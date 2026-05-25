import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-directeur',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './directeur.html',
  styleUrl: './directeur.css'
})
export class Directeur implements OnInit {
  public i18n  = inject(I18nService);
  public api   = inject(ApiService);
  private http = inject(HttpClient);

  loading = signal(true);
  private _raw = signal<any>(null);

  getPhotoUrl(photo: string | null): string | null {
    if (!photo) return null;
    return photo.startsWith('/uploads/') ? this.api.getUploadUrl(photo) : photo;
  }

  get directeur(): any {
    const d = this._raw();
    if (!d) return null;
    return {
      prenom:      d.prenom,
      nom:         d.nom,
      titre:       d.titre,
      specialite:  d.specialite,
      institution: d.institution,
      email:       d.email,
      telephone:   d.telephone,
      bureau:      d.bureau,
      photo:       d.photoUrl ?? null,
      message:     d.message,
      liens: {
        googleScholar: d.googleScholarUrl,
        researchGate:  d.researchgateUrl,
        orcid:         d.orcidUrl,
        linkedin:      d.linkedinUrl,
      },
      publications: []
    };
  }

  ngOnInit() {
    this.http
      .get<any>('https://localhost:8443/api/directeur', { withCredentials: true })
      .subscribe({
        next:  (d) => { this._raw.set(d); this.loading.set(false); },
        error: ()  => this.loading.set(false)
      });
  }
}