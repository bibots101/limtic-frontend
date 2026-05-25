import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmail {
  token = '';
  status = signal<'idle' | 'pending' | 'success' | 'error'>('idle');
  message = signal('');
  showForm = signal(true);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public i18n: I18nService
  ) {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token') ?? '';
      if (token) {
        this.token = token;
        this.verify();
      }
    });
  }

  verify() {
    if (!this.token?.trim()) {
      this.message.set('Veuillez fournir un token de vérification.');
      this.status.set('error');
      return;
    }
    this.status.set('pending');
    this.message.set('');

    this.api.verifyEmail(this.token.trim()).subscribe({
      next: (res: any) => {
        this.status.set('success');
        this.showForm.set(false);
        this.message.set(res?.message || 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.');
      },
      error: (err) => {
        this.status.set('error');
        this.showForm.set(true);
        this.message.set(err.error?.error || 'Impossible de vérifier l\'email.');
      }
    });
  }
}
