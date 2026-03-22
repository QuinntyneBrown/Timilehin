import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-devotional-card',
  standalone: true,
  templateUrl: './devotional-card.component.html',
  styleUrl: './devotional-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevotionalCardComponent {
  title = input.required<string>();
  scriptureReference = input.required<string>();
  scriptureText = input<string>('');
  reflectionText = input.required<string>();
  prayerPrompt = input.required<string>();
}
