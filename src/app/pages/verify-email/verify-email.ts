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
  // showForm=true by default; hides automatically when a URL token triggers verify()
  showForm = signal(true);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public i18n: I18nService
  ) {
    // Auto-verify when the link from the email is clicked (?token=...)
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token') ?? '';
      if (token) {
        this.token = token;
        this.showForm.set(false); // hide manual form — we verify automatically
        this.verify();
      }
    });
  }

  verify() {
    if (!this.token?.trim()) {
      this.message.set(this.i18n.t('verify.error_token'));
      this.status.set('error');
      return;
    }
    this.status.set('pending');
    this.message.set('');

    this.api.verifyEmail(this.token.trim()).subscribe({
      next: (res: any) => {
        this.status.set('success');
        this.showForm.set(false);
        this.message.set(res?.message || this.i18n.t('verify.success_default'));
      },
      error: (err) => {
        this.status.set('error');
        this.showForm.set(true); // let user try again or copy token manually
        this.message.set(
          err.error?.error === 'Token invalide ou expiré'
            ? this.i18n.t('verify.error_token_expired')
            : (err.error?.error || this.i18n.t('verify.error_default'))
        );
      }
    });
  }
}