import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalDetail, DevotionalService } from 'api';
import { DevotionalCardComponent } from 'components';
import { TodayDevotionalContainerComponent } from '../today-devotional-container/today-devotional-container.component';
import { DevotionalArchiveContainerComponent } from '../devotional-archive-container/devotional-archive-container.component';

@Component({
  selector: 'gw-devotional-page-container',
  standalone: true,
  imports: [
    TodayDevotionalContainerComponent,
    DevotionalArchiveContainerComponent,
    DevotionalCardComponent,
  ],
  templateUrl: './devotional-page-container.component.html',
  styleUrl: './devotional-page-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevotionalPageContainerComponent {
  private readonly devotionalService = inject(DevotionalService);

  readonly devotionalSelected = output<number>();
  readonly selectedDevotional = signal<DevotionalDetail | null>(null);
  readonly selectedLoading = signal(false);
  readonly selectedError = signal<string | null>(null);

  onDevotionalSelected(id: number): void {
    this.devotionalSelected.emit(id);
    this.selectedLoading.set(true);
    this.selectedError.set(null);
    this.selectedDevotional.set(null);

    this.devotionalService.getById(id).subscribe({
      next: (detail) => {
        this.selectedDevotional.set(detail);
        this.selectedLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.selectedError.set('Devotional not found.');
        } else {
          this.selectedError.set('Unable to load the devotional. Please try again later.');
        }
        this.selectedLoading.set(false);
      },
    });
  }
}
