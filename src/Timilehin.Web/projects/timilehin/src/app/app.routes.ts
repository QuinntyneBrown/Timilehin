import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home-page').then(m => m.HomePageComponent) },
  { path: 'bible', loadComponent: () => import('./pages/bible-page').then(m => m.BiblePageComponent) },
  { path: 'devotionals', loadComponent: () => import('./pages/devotionals-page').then(m => m.DevotionalsPageComponent) },
  { path: '**', redirectTo: '' },
];
