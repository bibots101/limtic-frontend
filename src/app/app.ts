import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { ThemeService } from './services/theme.service';
import { LabSettingsService } from './services/lab-settings.service';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isLoggedIn     = signal(false);
  userEmail      = signal('');
  userRole       = signal('');
  showNavbar     = signal(true);
  dropdownOuvert = signal<string | null>(null);
  menuOuvert     = signal(false);

  // Un seul constructeur avec ApiService et ThemeService
  constructor(
    private router: Router,
    private api: ApiService,
    public themeService: ThemeService,
    public settings: LabSettingsService,
    private seoService: SeoService
  ) {}

  ngOnInit() {
    this.settings.loadPublic();
    this.checkAuth();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const hiddenRoutes = ['/dashboard-admin', '/dashboard-chercheur'];
      this.showNavbar.set(!hiddenRoutes.some(r => e.url.startsWith(r)));
      this.checkAuth();
      this.dropdownOuvert.set(null);
      this.menuOuvert.set(false);
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown') && !target.closest('.nav-toggle')) {
        this.dropdownOuvert.set(null);
      }
      if (!target.closest('.navbar')) {
        this.menuOuvert.set(false);
      }
    });
  }

  toggleMenu() {
    this.menuOuvert.set(!this.menuOuvert());
    this.dropdownOuvert.set(null);
  }

  toggleDropdown(nom: string) {
    this.dropdownOuvert.set(this.dropdownOuvert() === nom ? null : nom);
  }

  fermerTout() {
    this.dropdownOuvert.set(null);
    this.menuOuvert.set(false);
  }

  checkAuth() {
    // Plus de token JWT — on vérifie role dans localStorage
    // (stocké au login, supprimé au logout)
    const role = localStorage.getItem('role');
    if (role) {
      this.isLoggedIn.set(true);
      this.userEmail.set(localStorage.getItem('email') || '');
      this.userRole.set(role);
    } else {
      this.isLoggedIn.set(false);
      this.userEmail.set('');
      this.userRole.set('');
    }
  }

  logout() {
    this.api.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.isLoggedIn.set(false);
        this.userEmail.set('');
        this.userRole.set('');
        this.router.navigate(['/home']);
      },
      error: () => {
        localStorage.clear();
        this.isLoggedIn.set(false);
        this.userEmail.set('');
        this.userRole.set('');
        this.router.navigate(['/home']);
      }
    });
  }
}
