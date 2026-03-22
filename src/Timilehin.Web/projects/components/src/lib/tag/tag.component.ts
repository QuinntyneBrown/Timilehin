import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-tag',
  standalone: true,
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent {
  text = input.required<string>();
}
