import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';

import { UserProfile } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  imports: [DatePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly username = input.required<string>();
  readonly profile = signal<UserProfile | null>(null);

  ngOnInit(): void {
    this.api.getProfile(this.username()).subscribe((profile) => this.profile.set(profile));
  }
}
