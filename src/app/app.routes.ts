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
    path: 'store/checkout',
    loadComponent: () =>
      import('./features/store/checkout-review').then((m) => m.CheckoutReviewComponent),
    title: 'Checkout',
  },
  {
    path: 'store/checkout/success',
    loadComponent: () =>
      import('./features/store/checkout-success').then((m) => m.CheckoutSuccessComponent),
    title: 'Checkout complete',
  },
  {
    path: 'store/checkout/cancel',
    loadComponent: () =>
      import('./features/store/checkout-cancel').then((m) => m.CheckoutCancelComponent),
    title: 'Checkout canceled',
  },
  {
    path: 'store/orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/store/order-detail').then((m) => m.OrderDetailComponent),
    title: 'Order',
  },
  {
    path: 'store/:slug',
    loadComponent: () =>
      import('./features/store/product-detail').then((m) => m.ProductDetailComponent),
    title: 'Product',
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
