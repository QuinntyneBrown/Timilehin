import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const ICONS: Record<string, string> = {
  'book-open':
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  heart:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
};

@Component({
  selector: 'gw-feature-card',
  standalone: true,
  templateUrl: './feature-card.component.html',
  styleUrl: './feature-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCardComponent {
  iconColor = input<string>('#c8a96e');
  icon = input<string>('');
  title = input.required<string>();
  description = input.required<string>();
  tags = input<string[]>([]);
  linkText = input<string>('');
  linkClicked = output<void>();

  constructor(private sanitizer: DomSanitizer) {}

  iconSvg = computed<SafeHtml | null>(() => {
    const name = this.icon();
    const svg = ICONS[name];
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  });
}
