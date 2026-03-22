import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalService, DevotionalSummary } from 'api';
import { DevotionalSummaryCardComponent } from 'components';

@Component({
  selector: 'gw-devotional-archive-container',
  standalone: true,
  imports: [DevotionalSummaryCardComponent],
  templateUrl: './devotional-archive-container.component.html',
  styleUrl: './devotional-archive-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevotionalArchiveContainerComponent implements OnInit {
  private readonly devotionalService = inject(DevotionalService);

  readonly devotionals = signal<DevotionalSummary[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasNextPage = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly devotionalSelected = output<number>();

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.loadPage(this.currentPage() + 1);
  }

  onCardClicked(id: number): void {
    this.devotionalSelected.emit(id);
  }

  private loadPage(page: number): void {
    this.devotionalService.getAll(page, this.pageSize).subscribe({
      next: (result) => {
        if (page === 1) {
          this.devotionals.set(result.items);
        } else {
          this.devotionals.update((current) => [...current, ...result.items]);
        }
        this.currentPage.set(result.page);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.error.set('No devotionals found.');
        } else {
          this.error.set('Unable to load devotionals. Please try again later.');
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
