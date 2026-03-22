import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-prayer-prompt',
  standalone: true,
  templateUrl: './prayer-prompt.component.html',
  styleUrl: './prayer-prompt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrayerPromptComponent {
  label = input<string>('PRAYER PROMPT');
  text = input.required<string>();
}
