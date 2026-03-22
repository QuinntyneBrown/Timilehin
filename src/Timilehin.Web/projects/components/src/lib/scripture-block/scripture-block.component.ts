import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gw-scripture-block',
  standalone: true,
  templateUrl: './scripture-block.component.html',
  styleUrl: './scripture-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptureBlockComponent {
  text = input.required<string>();
}
