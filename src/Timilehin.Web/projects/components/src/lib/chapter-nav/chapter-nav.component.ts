import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gw-chapter-nav',
  standalone: true,
  templateUrl: './chapter-nav.component.html',
  styleUrl: './chapter-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterNavComponent {
  currentChapter = input.required<number>();
  totalChapters = input.required<number>();
  hasPrevious = input<boolean>(true);
  hasNext = input<boolean>(true);
  previousClicked = output<void>();
  nextClicked = output<void>();
  chapterSelected = output<void>();
}
