import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UI } from '../../shared/ui';

@Component({
  selector: 'app-marketplace-checkout-cancel',
  imports: [UI, RouterLink],
  templateUrl: './checkout-cancel.html',
  styleUrl: './market.scss',
})
export class MarketplaceCheckoutCancelComponent {}
