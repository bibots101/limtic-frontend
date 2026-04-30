import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  email = '';
  motDePasse = '';
  confirm = '';
  erreur = signal('');
  succes = signal('');
  loading = signal(false);

  constructor(private router: Router) {}

  onSubmit() {
    if (this.motDePasse !== this.confirm) {
      this.erreur.set('Les mots de passe ne correspondent pas');
      return;
    }
    this.loading.set(true);
    this.erreur.set('');

    fetch('https://localhost:8443/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, motDePasse: this.motDePasse })
    })
    .then(res => res.json())
    .then(data => {
      this.loading.set(false);
      if (data.message) {
        this.succes.set('Compte créé ! Redirection...');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      } else {
        this.erreur.set(data.error || 'Erreur lors de l\'inscription');
      }
    })
    .catch(() => {
      this.loading.set(false);
      this.erreur.set('Impossible de contacter le serveur');
    });
  }
}
