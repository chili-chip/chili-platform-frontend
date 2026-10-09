import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UI } from '../../shared/ui';

@Component({
  selector: 'app-checkout-cancel',
  imports: [UI, RouterLink],
  templateUrl: './checkout-cancel.html',
  styleUrl: './checkout.scss',
})
export class CheckoutCancelComponent {}
