import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  motDePasse = '';
  erreur = signal('');
  loading = signal(false);

  constructor(
    private router: Router,
    private api: ApiService,
    public settings: LabSettingsService
  ) {}

  onSubmit() {
    this.loading.set(true);
    this.erreur.set('');

    this.api.login(this.email, this.motDePasse).subscribe({
      next: (data) => {
        this.loading.set(false);

        // Plus de token JWT — juste email et role pour l'affichage navbar
        // La session est gérée automatiquement par le cookie HttpOnly
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);

        if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
          this.router.navigate(['/dashboard-admin']);
        } else if (data.role === 'CHERCHEUR') {
          this.router.navigate(['/dashboard-chercheur']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.erreur.set(err.error?.error || 'Erreur de connexion');
      }
    });
  }
}
