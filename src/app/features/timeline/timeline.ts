import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { SkeletonRowsComponent } from '../../shared/loading';
import { TimelineEntry, TimelineService, TimelineType } from './timeline.service';

type Filter = 'all' | TimelineType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'plan', label: 'Plans' },
  { value: 'release', label: 'Releases' },
];

@Component({
  selector: 'app-timeline',
  imports: [DatePipe, SkeletonRowsComponent],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent implements OnInit {
  private readonly service = inject(TimelineService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = FILTERS;
  readonly filter = signal<Filter>('all');
  readonly loading = signal(true);
  readonly failed = signal(false);
  private readonly all = signal<TimelineEntry[]>([]);
  private controller?: AbortController;

  readonly entries = computed(() => {
    const filter = this.filter();
    return this.all().filter((entry) => filter === 'all' || entry.type === filter);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.controller?.abort());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.loading.set(true);
    this.failed.set(false);
    this.service
      .load(controller.signal)
      .then((entries) => {
        this.all.set(entries);
        this.loading.set(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          this.failed.set(true);
          this.loading.set(false);
        }
      });
  }
}
