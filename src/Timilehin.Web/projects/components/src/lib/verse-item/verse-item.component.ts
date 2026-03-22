import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-verse-item',
  standalone: true,
  templateUrl: './verse-item.component.html',
  styleUrl: './verse-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseItemComponent {
  number = input.required<number>();
  text = input.required<string>();
}
