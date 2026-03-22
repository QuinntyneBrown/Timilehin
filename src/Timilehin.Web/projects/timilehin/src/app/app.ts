import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent, NavLink } from 'components';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: '/' }
  );

  get navLinks(): NavLink[] {
    const url = this.currentUrl();
    return [
      { label: 'Home', route: '/', active: url === '/' },
      { label: 'Read Bible', route: '/bible', active: url === '/bible' },
      { label: 'Devotionals', route: '/devotionals', active: url === '/devotionals' },
    ];
  }

  onLinkClicked(link: NavLink): void {
    this.router.navigateByUrl(link.route);
  }

  onCtaClicked(): void {
    this.router.navigateByUrl('/bible');
  }
}
