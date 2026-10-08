import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ForumCategory, ForumPost, Paginated } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonThreadsComponent, SpinnerComponent } from '../../shared/loading';

@Component({
  selector: 'app-community',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, SkeletonThreadsComponent, SpinnerComponent],
  templateUrl: './community.html',
  styleUrl: './community.scss',
})
export class CommunityComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly categories = signal<ForumCategory[]>([]);
  readonly posts = signal<ForumPost[]>([]);
  readonly activeCategory = signal<string | undefined>(undefined);
  readonly showComposer = signal(false);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly publishing = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    category: [0, [Validators.required, Validators.min(1)]],
    content: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.api.listCategories().subscribe({
      next: (payload) => this.categories.set(this.unwrap(payload)),
      error: () => this.categories.set([]),
    });
    this.loadPosts();
  }

  filterBy(slug?: string): void {
    this.activeCategory.set(slug);
    this.loadPosts(slug);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.publishing()) {
      return;
    }
    this.error.set('');
    this.publishing.set(true);
    this.api.createPost(this.form.getRawValue()).subscribe({
      next: (post) => {
        this.posts.update((current) => [post, ...current]);
        this.form.reset({ title: '', category: 0, content: '' });
        this.showComposer.set(false);
        this.publishing.set(false);
      },
      error: () => {
        this.error.set('Could not publish. Check the fields and try again.');
        this.publishing.set(false);
      },
    });
  }

  private loadPosts(category?: string): void {
    this.loading.set(true);
    this.api.listPosts(category).subscribe({
      next: (payload) => {
        this.posts.set(payload.results ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.posts.set([]);
        this.loading.set(false);
      },
    });
  }

  private unwrap(payload: Paginated<ForumCategory> | ForumCategory[]): ForumCategory[] {
    return Array.isArray(payload) ? payload : payload.results;
  }
}
