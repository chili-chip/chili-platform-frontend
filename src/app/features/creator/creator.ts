import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, effect, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { GameAssistResult, GameAssistTurn } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
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
  private readonly api = inject(ApiService);
  private readonly editorFrame = viewChild<ElementRef<HTMLIFrameElement>>('editor');
  readonly projectId = input<string>();
  readonly editorSrc = signal<SafeResourceUrl | null>(null);
  readonly chatOpen = signal(true);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly note = signal('');
  readonly turns = signal<ChatTurn[]>([]);
  /** Project id already shown in the editor, so a route update does not reload it. */
  private loadedFor: string | null = null;
  private chatFor = '';
  private destroyed = false;
  private assistSub: Subscription | null = null;
  private snapshotTimer = 0;
  private snapshotWait: ((ready: boolean) => void) | null = null;

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
      const ready = data.ready === true && typeof data.data === 'string';
      this.snapshotWait?.(ready);
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
    this.turns.update((turns) => [...turns, { role: 'user', content: message }]);
    void this.confirmEditor().then((ready) => {
      if (this.destroyed) {
        return;
      }
      if (!ready) {
        this.turns.update((turns) => turns.slice(0, -1));
        this.draft.set(message);
        this.note.set('The editor is not ready yet.');
        this.sending.set(false);
        return;
      }
      this.assistSub?.unsubscribe();
      this.assistSub = this.api.assistGame(id, { message, history }).subscribe({
        next: (body) => this.finishAssist(body),
        error: (err: HttpErrorResponse) => this.failAssist(err),
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    window.removeEventListener('message', this.onEditorMessage);
    window.clearTimeout(this.snapshotTimer);
    this.snapshotWait = null;
    this.assistSub?.unsubscribe();
  }

  private confirmEditor(): Promise<boolean> {
    return new Promise((resolve) => {
      window.clearTimeout(this.snapshotTimer);
      this.snapshotTimer = window.setTimeout(() => {
        this.snapshotWait = null;
        resolve(false);
      }, 4000);
      this.snapshotWait = (ready: boolean) => {
        window.clearTimeout(this.snapshotTimer);
        this.snapshotWait = null;
        resolve(ready);
      };
      this.postToEditor({ type: 'chili-assistant-read' });
    });
  }

  private finishAssist(body: GameAssistResult): void {
    const reply = body.reply?.trim() || 'Updated the Bitsy game.';
    this.turns.update((turns) => [...turns, { role: 'assistant', content: reply }]);
    if (typeof body.data === 'string' && body.data && !body.error) {
      this.postToEditor({ type: 'chili-assistant-apply', data: body.data });
      this.note.set('');
    } else if (body.error) {
      this.note.set(body.error);
    }
    this.sending.set(false);
  }

  private failAssist(err: HttpErrorResponse): void {
    const body = (err.error ?? {}) as { reply?: unknown; error?: unknown; detail?: unknown };
    const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
    const problem =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.detail === 'string' && body.detail) ||
      'The assistant could not answer.';
    this.turns.update((turns) => [...turns, { role: 'assistant', content: reply || problem }]);
    this.note.set(reply && problem !== reply ? problem : '');
    this.sending.set(false);
  }

  private postToEditor(payload: { type: string; data?: string }): void {
    const frame = this.editorFrame()?.nativeElement.contentWindow;
    if (!frame) {
      return;
    }
    frame.postMessage(payload, window.location.origin);
  }
}
