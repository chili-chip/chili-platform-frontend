import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, effect, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { GameAssistTurn } from '../../core/models/platform';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-creator',
  templateUrl: './creator.html',
  styleUrl: './creator.scss',
})
export class CreatorComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly auth = inject(AuthService);
  private readonly editorFrame = viewChild<ElementRef<HTMLIFrameElement>>('editor');
  readonly projectId = input<string>();
  readonly editorSrc = signal<SafeResourceUrl | null>(null);
  readonly chatOpen = signal(true);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly note = signal('');
  readonly undoText = signal('');
  readonly turns = signal<ChatTurn[]>([]);
  /** Project id already shown in the editor, so a route update does not reload it. */
  private loadedFor: string | null = null;
  private chatFor = '';
  private destroyed = false;
  private assistAbort: AbortController | null = null;
  private snapshotTimer = 0;
  private snapshotWait: ((ready: boolean, data: string) => void) | null = null;
  private streamingReply = false;

  constructor() {
    effect(() => {
      const id = this.projectId() ?? '';
      if (this.loadedFor === id) {
        return;
      }
      this.loadedFor = id;
      const params = new URLSearchParams({ api: environment.apiUrl });
      if (id) {
        params.set('project', id);
      }
      const url = `/creator/editor/index.html?${params.toString()}`;
      this.editorSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    });

    effect(() => {
      const id = this.projectId() ?? '';
      if (id === this.chatFor) {
        return;
      }
      this.chatFor = id;
      this.turns.set([]);
      this.draft.set('');
      this.note.set('');
      this.undoText.set('');
    });

    window.addEventListener('message', this.onEditorMessage);
  }

  private readonly onEditorMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    const data = event.data as {
      type?: string;
      id?: number;
      data?: string;
      ready?: boolean;
    };
    if (data?.type === 'chili-assistant-snapshot') {
      const frame = this.editorFrame()?.nativeElement.contentWindow;
      if (!frame || event.source !== frame) {
        return;
      }
      const text = typeof data.data === 'string' ? data.data : '';
      const ready = data.ready === true && typeof data.data === 'string';
      this.snapshotWait?.(ready, text);
      return;
    }
    if (data?.type === 'chili-project-removed' || data?.type === 'chili-project-new') {
      this.loadedFor = '';
      void this.router.navigate(['/creator'], { replaceUrl: true });
      return;
    }
    if (data?.type !== 'chili-project' || !data.id) {
      return;
    }
    const id = String(data.id);
    if (this.projectId() === id) {
      return;
    }
    this.loadedFor = id;
    void this.router.navigate(['/creator', id], { replaceUrl: true });
  };

  onDraft(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.draft.set(target.value);
  }

  onDraftKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const id = this.projectId();
    const message = this.draft().trim();
    if (!id || !message || this.sending()) {
      return;
    }
    const history: GameAssistTurn[] = this.turns()
      .slice(-6)
      .map((turn) => ({ role: turn.role, content: turn.content }));
    this.sending.set(true);
    this.note.set('');
    this.draft.set('');
    this.streamingReply = false;
    this.turns.update((turns) => [...turns, { role: 'user', content: message }]);
    void this.runAssist(id, message, history);
  }

  undo(): void {
    const previous = this.undoText();
    if (!previous || this.sending()) {
      return;
    }
    this.postToEditor({ type: 'chili-assistant-apply', data: previous });
    this.undoText.set('');
    this.note.set('Restored the previous game.');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    window.removeEventListener('message', this.onEditorMessage);
    window.clearTimeout(this.snapshotTimer);
    this.snapshotWait = null;
    this.assistAbort?.abort();
  }

  private async runAssist(id: string, message: string, history: GameAssistTurn[]): Promise<void> {
    const snap = await this.readEditor();
    if (this.destroyed) {
      return;
    }
    if (!snap.ready) {
      this.addAssistant('The editor is not ready yet. Wait for the project to load, then send again.');
      return;
    }
    const basis = snap.data;
    this.assistAbort?.abort();
    const controller = new AbortController();
    this.assistAbort = controller;
    const timer = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await this.postAssist(
        id,
        { message, history, data: basis },
        true,
        controller.signal,
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        this.failAssist(new HttpErrorResponse({ status: response.status, error: errBody }));
        return;
      }
      await this.readStream(response, basis);
    } catch (err) {
      if (this.destroyed) {
        return;
      }
      if ((err instanceof DOMException && err.name === 'AbortError') || this.isNetwork(err)) {
        this.finishEarly(
          'The API did not answer. Start it with `npm run dev`. For a live Bitsy reply, run `npx wrangler login`, then `npm run dev:ai`.',
        );
        return;
      }
      this.failAssist(err);
    } finally {
      window.clearTimeout(timer);
    }
  }

  private async readStream(response: Response, basis: string): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      this.finishEarly('The API did not answer. Start it with `npm run dev`. For a live Bitsy reply, run `npx wrangler login`, then `npm run dev:ai`.');
      return;
    }
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';
    let data = '';
    let error = '';
    const take = (line: string): void => {
      if (!line.trim()) {
        return;
      }
      const event = JSON.parse(line) as { reply?: unknown; data?: unknown; error?: unknown };
      if (typeof event.reply === 'string') {
        reply = event.reply;
        this.showReply(reply);
      }
      if (typeof event.data === 'string') {
        data = event.data;
      }
      if (typeof event.error === 'string') {
        error = event.error;
      }
    };
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        take(line);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      take(buffer);
    }
    if (this.destroyed) {
      return;
    }
    const shown = reply.trim() || error || 'The assistant could not answer.';
    this.showReply(shown);
    this.streamingReply = false;
    if (error || !data) {
      this.note.set(error && error !== shown ? error : '');
      this.sending.set(false);
      return;
    }
    const current = await this.readEditor();
    if (this.destroyed) {
      return;
    }
    if (!current.ready || !this.sameText(current.data, basis)) {
      this.note.set('The game changed while the assistant was working, so that edit was not applied.');
      this.sending.set(false);
      return;
    }
    this.undoText.set(basis);
    this.note.set('');
    this.postToEditor({ type: 'chili-assistant-apply', data });
    this.sending.set(false);
  }

  private async postAssist(
    id: string,
    body: { message: string; history: GameAssistTurn[]; data: string },
    allowRetry: boolean,
    signal: AbortSignal,
  ): Promise<Response> {
    const token = this.auth.accessToken();
    const response = await fetch(`${environment.apiUrl}/games/${id}/assist/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
    if (response.status === 401 && allowRetry) {
      await firstValueFrom(this.auth.refreshAccessToken());
      return this.postAssist(id, body, false, signal);
    }
    return response;
  }

  private readEditor(): Promise<{ ready: boolean; data: string }> {
    const waitMs = 8000;
    return new Promise((resolve) => {
      const started = Date.now();
      const attempt = (): void => {
        if (this.destroyed) {
          resolve({ ready: false, data: '' });
          return;
        }
        const remaining = waitMs - (Date.now() - started);
        if (remaining <= 0) {
          this.snapshotWait = null;
          resolve({ ready: false, data: '' });
          return;
        }
        window.clearTimeout(this.snapshotTimer);
        this.snapshotTimer = window.setTimeout(() => {
          this.snapshotWait = null;
          resolve({ ready: false, data: '' });
        }, remaining);
        this.snapshotWait = (ready: boolean, data: string) => {
          if (!ready) {
            window.setTimeout(attempt, 250);
            return;
          }
          window.clearTimeout(this.snapshotTimer);
          this.snapshotWait = null;
          resolve({ ready: true, data });
        };
        this.postToEditor({ type: 'chili-assistant-read' });
      };
      attempt();
    });
  }

  private showReply(content: string): void {
    const streaming = this.streamingReply;
    this.turns.update((turns) => {
      if (streaming && turns.length > 0 && turns[turns.length - 1].role === 'assistant') {
        const next = turns.slice();
        next[next.length - 1] = { role: 'assistant', content };
        return next;
      }
      return [...turns, { role: 'assistant', content }];
    });
    this.streamingReply = true;
  }

  private failAssist(err: unknown): void {
    if (this.isNetwork(err) || (err instanceof HttpErrorResponse && err.status === 0)) {
      this.finishEarly(
        'The API did not answer. Start it with `npm run dev`. For a live Bitsy reply, run `npx wrangler login`, then `npm run dev:ai`.',
      );
      return;
    }
    const http = err instanceof HttpErrorResponse ? err : null;
    const body = (http?.error ?? {}) as { reply?: unknown; error?: unknown; detail?: unknown };
    const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
    const problem =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.detail === 'string' && body.detail) ||
      (http && http.status >= 500
        ? 'The API could not answer. If Workers AI is not logged in, run `npx wrangler login`, then `npm run dev:ai`.'
        : 'The assistant could not answer.');
    this.finishEarly(reply || problem);
    if (reply && problem !== reply) {
      this.note.set(problem);
    }
  }

  private finishEarly(content: string): void {
    if (this.streamingReply) {
      this.showReply(content);
      this.streamingReply = false;
      this.note.set('');
      this.sending.set(false);
      return;
    }
    this.addAssistant(content);
  }

  private addAssistant(content: string): void {
    this.turns.update((turns) => [...turns, { role: 'assistant', content }]);
    this.streamingReply = false;
    this.note.set('');
    this.sending.set(false);
  }

  private sameText(left: string, right: string): boolean {
    const norm = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return norm(left) === norm(right);
  }

  private isNetwork(err: unknown): boolean {
    return err instanceof TypeError;
  }

  private postToEditor(payload: { type: string; data?: string }): void {
    const frame = this.editorFrame()?.nativeElement.contentWindow;
    if (!frame) {
      return;
    }
    frame.postMessage(payload, window.location.origin);
  }
}
