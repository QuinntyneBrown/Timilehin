import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface HeroButton {
  label: string;
  variant: 'primary' | 'secondary';
}

@Component({
  selector: 'gw-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  tagText = input<string>('');
  title = input.required<string>();
  description = input.required<string>();
  primaryButtonLabel = input<string>('');
  secondaryButtonLabel = input<string>('');
  primaryClicked = output<void>();
  secondaryClicked = output<void>();
}
