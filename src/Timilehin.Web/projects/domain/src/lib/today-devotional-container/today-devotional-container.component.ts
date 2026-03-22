import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalDetail, DevotionalService } from 'api';
import { DevotionalCardComponent, SectionLabelComponent } from 'components';

@Component({
  selector: 'gw-today-devotional-container',
  standalone: true,
  imports: [DevotionalCardComponent, SectionLabelComponent],
  templateUrl: './today-devotional-container.component.html',
  styleUrl: './today-devotional-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayDevotionalContainerComponent implements OnInit {
  private readonly devotionalService = inject(DevotionalService);

  readonly devotional = signal<DevotionalDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);

  ngOnInit(): void {
    this.devotionalService.getToday().subscribe({
      next: (data) => {
        this.devotional.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Unable to load today\'s devotional. Please try again later.');
        }
        this.loading.set(false);
      },
    });
  }
}
