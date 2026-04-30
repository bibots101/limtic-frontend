import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  motDePasse = '';
  confirmation = '';
  token = '';
  message = signal('');
  erreur = signal('');
  loading = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public settings: LabSettingsService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.erreur.set('Token manquant ou invalide.');
    }
  }

  onSubmit() {
    if (!this.motDePasse || !this.confirmation) {
      this.erreur.set('Veuillez remplir les deux champs.');
      return;
    }
    if (this.motDePasse !== this.confirmation) {
      this.erreur.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.erreur.set('');

    fetch('https://localhost:8443/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token, motDePasse: this.motDePasse })
    })
    .then(r => r.json())
    .then(data => {
      this.loading.set(false);
      if (data.error) {
        this.erreur.set(data.error);
      } else {
        this.message.set('Mot de passe réinitialisé ! Redirection...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    })
    .catch(() => {
      this.loading.set(false);
      this.erreur.set('Impossible de contacter le serveur.');
    });
  }
}
