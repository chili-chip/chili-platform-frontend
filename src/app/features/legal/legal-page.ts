import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UI } from '../../shared/ui';

@Component({
  selector: 'app-terms-page',
  imports: [UI, RouterLink],
  templateUrl: './terms.html',
  styleUrl: './legal.scss',
})
export class TermsPageComponent {}

@Component({
  selector: 'app-privacy-page',
  imports: [UI, RouterLink],
  templateUrl: './privacy.html',
  styleUrl: './legal.scss',
})
export class PrivacyPageComponent {}

@Component({
  selector: 'app-seller-terms-page',
  imports: [UI, RouterLink],
  templateUrl: './seller-terms.html',
  styleUrl: './legal.scss',
})
export class SellerTermsPageComponent {}
