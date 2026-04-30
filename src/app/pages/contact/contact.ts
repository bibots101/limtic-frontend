import { Component, OnInit, signal, inject, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { LabSettingsService } from '../../services/lab-settings.service';

declare const hcaptcha: any;

@Component({
  selector: 'app-contact',
  imports: [FormsModule, CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact implements OnInit {
  private api       = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private zone      = inject(NgZone);
  public settings   = inject(LabSettingsService);

  // Formulaire
  nom     = signal('');
  email   = signal('');
  sujet   = signal('');
  message = signal('');

  // État
  envoi        = signal<'idle' | 'loading' | 'ok' | 'error'>('idle');
  erreurMsg    = signal('');
  captchaToken = signal('');
  captchaId    = signal<number | null>(null);

  // Coordonnées (depuis parametres_systeme)
  googleMapsUrl = signal<SafeResourceUrl | null>(null);
  adresse       = signal('');
  telephone     = signal('');
  emailContact  = signal('contact@limtic.tn');

  // Réseaux sociaux (depuis parametres_systeme)
  linkedinLabo  = signal('');
  researchGate  = signal('');
  twitterLabo   = signal('');
  facebookLabo  = signal('');

  ngOnInit() {
    this.chargerParametres();
    this.chargerHcaptcha();
  }

  private chargerParametres(): void {
    this.api.getParametresPublics().subscribe({
      next: (params: any[]) => {
        const get = (cle: string) => params.find(p => p.cle === cle)?.valeur ?? '';

        // Coordonnées
        this.adresse.set(get('labo.adresse'));
        this.telephone.set(get('labo.telephone'));
        this.emailContact.set(get('labo.email') || 'contact@limtic.tn');

        // Réseaux sociaux
        this.linkedinLabo.set(get('labo.linkedin'));
        this.researchGate.set(get('labo.researchgate'));
        this.twitterLabo.set(get('labo.twitter'));
        this.facebookLabo.set(get('labo.facebook'));

        // Google Maps
        const mapsUrl = get('contact.google_maps');
        if (mapsUrl) {
          this.googleMapsUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(mapsUrl)
          );
        } else {
          const lat = get('contact.latitude') || '36.8447';
          const lng = get('contact.longitude') || '10.1942';
          const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed&z=15`;
          this.googleMapsUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
          );
        }
      },
      error: () => {}
    });
  }

  private chargerHcaptcha(): void {
    if (typeof hcaptcha !== 'undefined') {
      this.rendreHcaptcha();
      return;
    }
    const script  = document.createElement('script');
    script.src    = 'https://js.hcaptcha.com/1/api.js';
    script.async  = true;
    script.defer  = true;
    script.onload = () => this.zone.run(() => this.rendreHcaptcha());
    document.head.appendChild(script);
  }

  private rendreHcaptcha(): void {
    const sitekey = '85b6c22e-d834-4fce-b28c-f100a006e110';
    const id = hcaptcha.render('hcaptcha-container', {
      sitekey,
      callback: (token: string) => {
        this.zone.run(() => this.captchaToken.set(token));
      },
      'expired-callback': () => {
        this.zone.run(() => this.captchaToken.set(''));
      }
    });
    this.captchaId.set(id);
  }

  soumettre(): void {
    const token = this.captchaToken() || this.getCaptchaResponse();
    if (!token) {
      this.erreurMsg.set('Veuillez compléter le captcha.');
      return;
    }
    this.captchaToken.set(token);
    this.envoi.set('loading');
    this.erreurMsg.set('');
    this.api.envoyerContact({
      nom:          this.nom(),
      email:        this.email(),
      sujet:        this.sujet(),
      message:      this.message(),
      captchaToken: this.captchaToken()
    }).subscribe({
      next: () => {
        this.envoi.set('ok');
        this.resetForm();
      },
      error: (err) => {
        this.envoi.set('error');
        this.erreurMsg.set(
          err?.error?.error ?? 'Une erreur est survenue. Veuillez réessayer.'
        );
        if (this.captchaId() !== null) hcaptcha.reset(this.captchaId()!);
        this.captchaToken.set('');
      }
    });
  }

  private resetForm(): void {
    this.nom.set('');
    this.email.set('');
    this.sujet.set('');
    this.message.set('');
    this.captchaToken.set('');
    if (this.captchaId() !== null) hcaptcha.reset(this.captchaId()!);
  }

  private getCaptchaResponse(): string {
    if (typeof hcaptcha === 'undefined') return '';
    const id = this.captchaId();
    if (id === null) return '';
    try {
      return hcaptcha.getResponse(id) || '';
    } catch {
      return '';
    }
  }
}