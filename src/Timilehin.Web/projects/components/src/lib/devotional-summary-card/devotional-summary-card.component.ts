import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gw-devotional-summary-card',
  standalone: true,
  templateUrl: './devotional-summary-card.component.html',
  styleUrl: './devotional-summary-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevotionalSummaryCardComponent {
  date = input.required<string>();
  title = input.required<string>();
  excerpt = input<string>('');
  scriptureReference = input.required<string>();
  cardClicked = output<void>();
}
