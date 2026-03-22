import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HomepageContainerComponent } from 'domain';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HomepageContainerComponent],
  template: `<gw-homepage-container (navigated)="onNavigated($event)" />`,
})
export class HomePageComponent {
  constructor(private readonly router: Router) {}
  onNavigated(route: string): void {
    this.router.navigateByUrl(route);
  }
}
