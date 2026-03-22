import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-section-label',
  standalone: true,
  templateUrl: './section-label.component.html',
  styleUrl: './section-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionLabelComponent {
  icon = input.required<string>();
  text = input.required<string>();
  color = input<string>('#c8a96e');
}
