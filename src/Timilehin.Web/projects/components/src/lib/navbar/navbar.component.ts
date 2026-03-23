import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface NavLink {
  label: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'gw-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  brandName = input<string>('GraceWord');
  links = input<NavLink[]>([]);
  ctaLabel = input<string>('Start Reading');
  linkClicked = output<NavLink>();
  ctaClicked = output<void>();
  menuToggled = output<void>();
  brandClicked = output<void>();
}
