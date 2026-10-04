import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-page',
  imports: [RouterLink],
  templateUrl: './terms.html',
  styleUrl: './legal.scss',
})
export class TermsPageComponent {}

@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink],
  templateUrl: './privacy.html',
  styleUrl: './legal.scss',
})
export class PrivacyPageComponent {}

@Component({
  selector: 'app-seller-terms-page',
  imports: [RouterLink],
  templateUrl: './seller-terms.html',
  styleUrl: './legal.scss',
})
export class SellerTermsPageComponent {}
