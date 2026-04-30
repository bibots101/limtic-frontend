import { Routes } from '@angular/router';
import { authGuard }      from './guards/auth.guard';
import { adminGuard }     from './guards/admin.guard';
import { chercheurGuard } from './guards/chercheur.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ── Pages publiques ──────────────────────────────────────
  { path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
  { path: 'chercheurs',
    loadComponent: () => import('./pages/chercheurs/chercheurs').then(m => m.Chercheurs) },
  { path: 'chercheurs/:id',
    loadComponent: () => import('./pages/chercheur-detail/chercheur-detail').then(m => m.ChercheurDetail) },
  { path: 'publications',
    loadComponent: () => import('./pages/publications/publications').then(m => m.Publications) },
  { path: 'publications/:id',
    loadComponent: () => import('./pages/publication-detail/publication-detail').then(m => m.PublicationDetail) },
  { path: 'evenements',
    loadComponent: () => import('./pages/evenements/evenements').then(m => m.Evenements) },
  { path: 'evenements/:id',
    loadComponent: () => import('./pages/evenement-detail/evenement-detail').then(m => m.EvenementDetail) },
  { path: 'outils',
    loadComponent: () => import('./pages/outils/outils').then(m => m.Outils) },
  { path: 'axes',
    loadComponent: () => import('./pages/axes/axes').then(m => m.Axes) },
  { path: 'axes/:id',
    loadComponent: () => import('./pages/axe-detail/axe-detail').then(m => m.AxeDetail) },
  { path: 'doctorants',
    loadComponent: () => import('./pages/doctorants/doctorants').then(m => m.Doctorants) },
  { path: 'doctorants/:id',
    loadComponent: () => import('./pages/doctorant-detail/doctorant-detail').then(m => m.DoctorantDetail) },
  { path: 'masteriens',
    loadComponent: () => import('./pages/masteriens/masteriens').then(m => m.Masteriens) },
  { path: 'masteriens/:id',
    loadComponent: () => import('./pages/masterien-detail/masterien-detail').then(m => m.MasterienDetail) },
  { path: 'directeur',
    loadComponent: () => import('./pages/directeur/directeur').then(m => m.Directeur) },
  { path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },

  // ── Auth ─────────────────────────────────────────────────
  { path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then(m => m.Signup) },
  { path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },

  // ── Pages protégées ──────────────────────────────────────
  {
    path: 'dashboard-admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin)
  },
  {
    path: 'dashboard-chercheur',
    canActivate: [chercheurGuard],
    loadComponent: () => import('./pages/dashboard-chercheur/dashboard-chercheur').then(m => m.DashboardChercheur)
  },

  // ── 404 ──────────────────────────────────────────────────
  { path: '**', redirectTo: 'home' }
];
