import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { TIMELINE_ENTRIES, TimelineType } from './timeline-entries';

type Filter = 'all' | TimelineType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'plan', label: 'Plans' },
  { value: 'release', label: 'Releases' },
];

@Component({
  selector: 'app-timeline',
  imports: [DatePipe],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent {
  readonly filters = FILTERS;
  readonly filter = signal<Filter>('all');

  readonly entries = computed(() => {
    const filter = this.filter();
    return TIMELINE_ENTRIES.filter((entry) => filter === 'all' || entry.type === filter).sort(
      (a, b) => b.date.localeCompare(a.date),
    );
  });
}
