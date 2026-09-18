import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ForumComment, ForumPost } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-post-detail',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly post = signal<ForumPost | null>(null);
  readonly comments = signal<ForumComment[]>([]);

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    this.api.getPost(this.id()).subscribe((post) => this.post.set(post));
    this.api.listComments(this.id()).subscribe((comments) => this.comments.set(comments));
  }

  submit(): void {
    const post = this.post();
    if (!post || this.form.invalid) {
      return;
    }
    this.api.createComment(post.id, this.form.controls.content.value).subscribe((comment) => {
      this.comments.update((current) => [...current, comment]);
      this.form.reset({ content: '' });
    });
  }
}
