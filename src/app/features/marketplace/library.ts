import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MarketplacePurchase } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { formatPrice, marketError } from './market-utils';

@Component({
  selector: 'app-library',
  imports: [RouterLink, DatePipe],
  templateUrl: './library.html',
  styleUrl: './market.scss',
})
export class LibraryComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly purchases = signal<MarketplacePurchase[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly priceLabel = formatPrice;

  ngOnInit(): void {
    this.api.listLibrary().subscribe({
      next: (payload) => {
        this.purchases.set(payload.results ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(marketError(err, 'Could not load your library.'));
      },
    });
  }
}
