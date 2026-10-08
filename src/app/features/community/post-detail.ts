import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ForumComment, ForumPost } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SkeletonArticleComponent,
  SkeletonRowsComponent,
  SpinnerComponent,
} from '../../shared/loading';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-post-detail',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    SkeletonArticleComponent,
    SkeletonRowsComponent,
    SpinnerComponent,
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetailComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly post = signal<ForumPost | null>(null);
  readonly comments = signal<ForumComment[]>([]);
  readonly postLoading = signal(true);
  readonly commentsLoading = signal(true);
  readonly posting = signal(false);

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    this.api.getPost(this.id()).subscribe({
      next: (post) => {
        this.post.set(post);
        this.postLoading.set(false);
      },
      error: () => this.postLoading.set(false),
    });
    this.api.listComments(this.id()).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.commentsLoading.set(false);
      },
      error: () => this.commentsLoading.set(false),
    });
  }

  submit(): void {
    const post = this.post();
    if (!post || this.form.invalid || this.posting()) {
      return;
    }
    this.posting.set(true);
    this.api.createComment(post.id, this.form.controls.content.value).subscribe({
      next: (comment) => {
        this.comments.update((current) => [...current, comment]);
        this.form.reset({ content: '' });
        this.posting.set(false);
        this.toast.success('Reply posted.');
      },
      error: () => {
        this.posting.set(false);
        this.toast.error('Could not post your reply. Try again.');
      },
    });
  }
}
