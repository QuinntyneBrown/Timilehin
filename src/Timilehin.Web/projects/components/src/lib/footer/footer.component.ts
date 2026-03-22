import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface FooterLink {
  label: string;
  url: string;
}

@Component({
  selector: 'gw-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  brandName = input<string>('GraceWord');
  copyright = input<string>('\u00A9 2026 GraceWord. All rights reserved.');
  links = input<FooterLink[]>([]);
  poweredByLabel = input<string>('Powered by');
  poweredByName = input<string>('bible-api.com');
  linkClicked = output<FooterLink>();
}
