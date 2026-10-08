import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UserSettings } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerComponent } from '../../shared/loading';

type Section = 'profile' | 'avatar' | 'email' | 'password' | 'preferences';
type Status = { kind: 'ok' | 'error'; text: string } | null;

const AVATAR_SIZE = 256;
const AVATAR_MAX_FILE = 8 * 1024 * 1024;
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink, SpinnerComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly busy = signal<Section | null>(null);
  readonly status = signal<Partial<Record<Section, Status>>>({});

  readonly profileForm = this.fb.nonNullable.group({
    display_name: ['', [Validators.maxLength(50)]],
    bio: ['', [Validators.maxLength(500)]],
  });

  readonly emailForm = this.fb.nonNullable.group({
    new_email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly preferencesForm = this.fb.nonNullable.group({
    locale: ['en'],
    theme: ['system' as UserSettings['theme']],
    newsletter_opt_in: [false],
    show_bio: [true],
    show_joined: [true],
    show_games: [true],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.reset({ display_name: user.display_name ?? '', bio: user.bio ?? '' });
    }
    this.api.getSettings().subscribe({
      next: (settings) => {
        this.preferencesForm.reset(settings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.report('preferences', 'error', 'Could not load your preferences.');
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.begin('profile');
    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (user) => {
        this.profileForm.reset({ display_name: user.display_name ?? '', bio: user.bio });
        this.report('profile', 'ok', 'Profile saved.');
      },
      error: (err) => this.report('profile', 'error', describe(err, 'Could not save your profile.')),
    });
  }

  async chooseAvatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/') || file.size > AVATAR_MAX_FILE) {
      this.report('avatar', 'error', 'Choose an image under 8 MB.');
      return;
    }
    this.begin('avatar');
    let image: string;
    try {
      image = await squareAvatar(file);
    } catch {
      this.report('avatar', 'error', 'Could not read that image.');
      return;
    }
    this.auth.uploadAvatar(image).subscribe({
      next: () => this.report('avatar', 'ok', 'Avatar updated.'),
      error: (err) => this.report('avatar', 'error', describe(err, 'Could not upload your avatar.')),
    });
  }

  removeAvatar(): void {
    this.begin('avatar');
    this.auth.removeAvatar().subscribe({
      next: () => this.report('avatar', 'ok', 'Avatar removed.'),
      error: (err) => this.report('avatar', 'error', describe(err, 'Could not remove your avatar.')),
    });
  }

  changeEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.begin('email');
    this.auth.requestEmailChange(this.emailForm.getRawValue()).subscribe({
      next: () => {
        const address = this.emailForm.controls.new_email.value;
        this.emailForm.reset();
        this.report('email', 'ok', `Check ${address} for a confirmation link.`);
      },
      error: (err) => this.report('email', 'error', describe(err, 'Could not change your email.')),
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.begin('password');
    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.report('password', 'ok', 'Password changed. Other devices were signed out.');
      },
      error: (err) => this.report('password', 'error', describe(err, 'Could not change your password.')),
    });
  }

  savePreferences(): void {
    this.begin('preferences');
    this.api.updateSettings(this.preferencesForm.getRawValue()).subscribe({
      next: (settings) => {
        this.preferencesForm.reset(settings);
        this.report('preferences', 'ok', 'Preferences saved.');
      },
      error: (err) =>
        this.report('preferences', 'error', describe(err, 'Could not save your preferences.')),
    });
  }

  private begin(section: Section): void {
    this.busy.set(section);
    this.status.update((all) => ({ ...all, [section]: null }));
  }

  private report(section: Section, kind: 'ok' | 'error', text: string): void {
    this.busy.set(null);
    this.status.update((all) => ({ ...all, [section]: { kind, text } }));
    if (kind === 'ok') {
      this.toast.success(text);
    } else {
      this.toast.error(text);
    }
  }
}

function describe(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (err.status === 429) {
    return 'Too many attempts. Try again later.';
  }
  const body = err.error;
  if (body && typeof body === 'object') {
    for (const value of Object.values(body as Record<string, unknown>)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string') {
        return first;
      }
    }
  }
  return fallback;
}

/** Center-crop to a square and downscale to a PNG data URL. */
async function squareAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no canvas');
  }
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  return canvas.toDataURL('image/png');
}
