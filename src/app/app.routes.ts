import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page').then((m) => m.LandingPageComponent),
    title: 'Chili Platform',
  },
  {
    path: 'store',
    loadComponent: () => import('./features/store/store').then((m) => m.StoreComponent),
    title: 'Chilichip Store',
  },
  {
    path: 'marketplace',
    loadComponent: () =>
      import('./features/marketplace/marketplace').then((m) => m.MarketplaceComponent),
    title: 'Marketplace',
  },
  {
    path: 'creator',
    canActivate: [authGuard],
    loadComponent: () => import('./features/creator/creator').then((m) => m.CreatorComponent),
    title: 'Web Creator',
  },
  {
    path: 'community',
    loadComponent: () =>
      import('./features/community/community').then((m) => m.CommunityComponent),
    title: 'Community',
  },
  {
    path: 'community/post/:id',
    loadComponent: () =>
      import('./features/community/post-detail').then((m) => m.PostDetailComponent),
    title: 'Thread',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginComponent),
    title: 'Sign in',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register').then((m) => m.RegisterComponent),
    title: 'Create account',
  },
  {
    path: 'profile/:username',
    loadComponent: () =>
      import('./features/profile/user-profile').then((m) => m.UserProfileComponent),
    title: 'Profile',
  },
  { path: '**', redirectTo: '' },
];
