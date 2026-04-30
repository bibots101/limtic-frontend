import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  email = '';
  message = signal('');
  erreur = signal('');
  loading = signal(false);

  constructor(private router: Router, public settings: LabSettingsService) {}

  onSubmit() {
    if (!this.email) { this.erreur.set('Veuillez entrer votre email.'); return; }
    this.loading.set(true);
    this.erreur.set('');
    this.message.set('');

    fetch('https://localhost:8443/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email })
    })
    .then(r => r.json())
    .then(data => {
      this.loading.set(false);
      this.message.set(data.message || 'Lien envoyé.');
    })
    .catch(() => {
      this.loading.set(false);
      this.erreur.set('Impossible de contacter le serveur.');
    });
  }
}
