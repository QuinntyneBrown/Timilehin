import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { BibleService, VerseOfTheDay } from 'api';
import { VerseOfTheDayCardComponent } from 'components';

@Component({
  selector: 'gw-verse-of-the-day-container',
  standalone: true,
  imports: [VerseOfTheDayCardComponent],
  templateUrl: './verse-of-the-day-container.component.html',
  styleUrl: './verse-of-the-day-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseOfTheDayContainerComponent implements OnInit {
  private readonly bibleService = inject(BibleService);

  readonly verse = signal<VerseOfTheDay | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.bibleService.getVerseOfTheDay().subscribe({
      next: (data) => {
        this.verse.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the verse of the day. Please try again later.');
        this.loading.set(false);
      },
    });
  }
}
