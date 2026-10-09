import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { SpinnerComponent } from '../../shared/loading';
import { ToastService } from '../../core/services/toast.service';
import { LeaveCheck } from '../../core/guards/unsaved-work.guard';

@Component({
  selector: 'app-creator',
  imports: [SpinnerComponent],
  templateUrl: './creator.html',
  styleUrl: './creator.scss',
})
export class CreatorComponent implements OnDestroy, LeaveCheck {
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly projectId = input<string>();
  readonly editorSrc = signal<SafeResourceUrl | null>(null);
  /** True from the moment the editor frame is pointed at a URL until it finishes loading. */
  readonly editorLoading = signal(false);
  /** Project id already shown in the editor, so a route update does not reload it. */
  private loadedFor: string | null = null;
  /** True while the editor reports edits that are not saved to the account yet. */
  private unsavedWork = false;

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
      this.editorLoading.set(true);
      this.editorSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    });

    window.addEventListener('message', this.onEditorMessage);
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  /** Asks before leaving the creator with unsaved work. Moves between creator pages are the editor's own. */
  canLeave(nextUrl: string): boolean {
    if (!this.unsavedWork || nextUrl === '/creator' || nextUrl.startsWith('/creator/')) {
      return true;
    }
    return window.confirm('Your latest changes to this game are not saved yet. Leave anyway?');
  }

  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.unsavedWork) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  private readonly onEditorMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    const data = event.data as {
      type?: string;
      id?: number;
      kind?: string;
      message?: string;
      unsaved?: boolean;
    };
    if (data?.type === 'chili-save-state') {
      this.unsavedWork = data.unsaved === true;
      return;
    }
    if (data?.type === 'chili-toast' && typeof data.message === 'string') {
      if (data.kind === 'error') {
        this.toast.error(data.message);
      } else if (data.kind === 'info') {
        this.toast.info(data.message);
      } else {
        this.toast.success(data.message);
      }
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

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onEditorMessage);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }
}
