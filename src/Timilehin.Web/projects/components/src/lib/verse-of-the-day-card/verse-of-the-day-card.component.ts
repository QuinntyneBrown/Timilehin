import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gw-verse-of-the-day-card',
  standalone: true,
  templateUrl: './verse-of-the-day-card.component.html',
  styleUrl: './verse-of-the-day-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseOfTheDayCardComponent {
  verseText = input.required<string>();
  reference = input.required<string>();
  shareClicked = output<void>();
  copyClicked = output<void>();
}
