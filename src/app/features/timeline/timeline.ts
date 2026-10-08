import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { SkeletonRowsComponent } from '../../shared/loading';
import { AREAS, STATUSES, TimelineStatus } from './timeline-config';
import { TimelineEntry, TimelineService } from './timeline.service';

type StatusFilter = 'all' | TimelineStatus;

@Component({
  selector: 'app-timeline',
  imports: [DatePipe, SkeletonRowsComponent],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent implements OnInit {
  private readonly service = inject(TimelineService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = [{ value: 'all' as StatusFilter, label: 'All' }, ...STATUSES];
  readonly status = signal<StatusFilter>('all');
  readonly area = signal('all');
  readonly loading = signal(true);
  readonly failed = signal(false);
  private readonly all = signal<TimelineEntry[]>([]);
  private controller?: AbortController;

  /** Only areas that have at least one entry, in the configured order. */
  readonly areas = computed(() => {
    const present = new Set(this.all().map((entry) => entry.area));
    return AREAS.filter((area) => present.has(area.value));
  });

  readonly entries = computed(() => {
    const status = this.status();
    const area = this.area();
    return this.all().filter(
      (entry) =>
        (status === 'all' || entry.status === status) && (area === 'all' || entry.area === area),
    );
  });

  readonly filtering = computed(() => this.status() !== 'all' || this.area() !== 'all');

  statusLabel(status: TimelineStatus): string {
    return STATUSES.find((item) => item.value === status)?.label ?? status;
  }

  areaLabel(value: string | undefined): string {
    return AREAS.find((item) => item.value === value)?.label ?? '';
  }

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
        if (this.area() !== 'all' && !entries.some((entry) => entry.area === this.area())) {
          this.area.set('all');
        }
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
