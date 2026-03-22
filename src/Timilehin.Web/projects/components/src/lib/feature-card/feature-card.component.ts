import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gw-feature-card',
  standalone: true,
  templateUrl: './feature-card.component.html',
  styleUrl: './feature-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCardComponent {
  iconColor = input<string>('#c8a96e');
  title = input.required<string>();
  description = input.required<string>();
  tags = input<string[]>([]);
  linkText = input<string>('');
  linkClicked = output<void>();
}
