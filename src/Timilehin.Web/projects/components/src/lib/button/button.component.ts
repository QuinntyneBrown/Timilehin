import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gw-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'gold'>('primary');
  label = input.required<string>();
  clicked = output<void>();
}
