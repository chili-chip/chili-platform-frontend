import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { SpinnerComponent } from '../../shared/loading';

@Component({
  selector: 'app-creator',
  imports: [SpinnerComponent],
  templateUrl: './creator.html',
  styleUrl: './creator.scss',
})
export class CreatorComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly projectId = input<string>();
  readonly editorSrc = signal<SafeResourceUrl | null>(null);
  /** True from the moment the editor frame is pointed at a URL until it finishes loading. */
  readonly editorLoading = signal(false);
  /** Project id already shown in the editor, so a route update does not reload it. */
  private loadedFor: string | null = null;

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
  }

  private readonly onEditorMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    const data = event.data as { type?: string; id?: number };
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
  }
}
