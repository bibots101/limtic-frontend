import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private base = 'https://localhost:8443/api';

  private options = { withCredentials: true };

  constructor(private http: HttpClient) {}

  // ── Auth ──────────────────────────────────────────────────────────────────
  login(email: string, motDePasse: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { email, motDePasse }, this.options);
  }
  logout(): Observable<any> {
    return this.http.post(`${this.base}/auth/logout`, {}, this.options);
  }
  me(): Observable<any> {
    return this.http.get(`${this.base}/auth/me`, this.options);
  }

  // ── Chercheurs ────────────────────────────────────────────────────────────
  getChercheurs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/chercheurs`, this.options);
  }
  getChercheur(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/chercheurs/${id}`, this.options);
  }
  createChercheur(data: any): Observable<any> {
    return this.http.post(`${this.base}/chercheurs`, data, this.options);
  }
  updateChercheur(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/chercheurs/${id}`, data, this.options);
  }
  deleteChercheur(id: number): Observable<any> {
    return this.http.delete(`${this.base}/chercheurs/${id}`, this.options);
  }

  // ── Import/Export CSV membres ─────────────────────────────────────────────
  exportChercheursCsv(): void {
    window.open(`${this.base}/admin/chercheurs/export-csv`, '_blank');
  }
  importChercheursCsv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.base}/admin/chercheurs/import-csv`, formData, {
      withCredentials: true
    });
  }

  // ── Publications ──────────────────────────────────────────────────────────
  getPublications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/publications`, this.options);
  }
  getPublicationsByAxe(axeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/publications?axe=${axeId}`, this.options);
  }
  getPublication(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/publications/${id}`, this.options);
  }
  createPublication(data: any): Observable<any> {
    return this.http.post(`${this.base}/publications`, data, this.options);
  }
  updatePublication(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/publications/${id}`, data, this.options);
  }
  updatePublicationStatut(id: number, statut: string): Observable<any> {
    return this.http.patch(`${this.base}/publications/${id}/statut`, { statut }, this.options);
  }
  deletePublication(id: number): Observable<any> {
    return this.http.delete(`${this.base}/publications/${id}`, this.options);
  }

  getUploadUrl(relativePath: string): string {
    return `https://localhost:8443${relativePath}`;
  }

  getPdfBlob(relativePath: string): Observable<Blob> {
    return this.http.get(`https://localhost:8443${relativePath}`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  uploadPdfPublication(publicationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.base}/publications/${publicationId}/upload-pdf`,
      formData,
      { withCredentials: true }
    );
  }

  deletePdfPublication(publicationId: number): Observable<any> {
    return this.http.delete(
      `${this.base}/publications/${publicationId}/pdf`,
      { withCredentials: true }
    );
  }

  // ── Événements ────────────────────────────────────────────────────────────
  getEvenements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/evenements`, this.options);
  }
  getEvenement(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/evenements/${id}`, this.options);
  }
  createEvenement(data: any): Observable<any> {
    return this.http.post(`${this.base}/evenements`, data, this.options);
  }
  updateEvenement(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/evenements/${id}`, data, this.options);
  }
  deleteEvenement(id: number): Observable<any> {
    return this.http.delete(`${this.base}/evenements/${id}`, this.options);
  }

  /** Upload multiple photos pour un événement avec légendes et ordre */
  uploadPhotosEvenement(evenementId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post(
      `${this.base}/evenements/${evenementId}/photos`,
      formData,
      { withCredentials: true }
    );
  }

  /** Upload photos avec légendes (multipart enrichi) */
  uploadPhotosAvecLegendes(
    evenementId: number,
    items: { file: File; legende: string; ordre: number }[]
  ): Observable<any> {
    const formData = new FormData();
    items.forEach((item, i) => {
      formData.append('files', item.file);
      formData.append(`legendes[${i}]`, item.legende);
      formData.append(`ordres[${i}]`, String(item.ordre));
    });
    return this.http.post(
      `${this.base}/evenements/${evenementId}/photos`,
      formData,
      { withCredentials: true }
    );
  }

  /** Supprime une photo d'un événement */
  deletePhotoEvenement(evenementId: number, photoId: number): Observable<any> {
    return this.http.delete(
      `${this.base}/evenements/${evenementId}/photos/${photoId}`,
      this.options
    );
  }

  /** Met à jour l'ordre des photos (drag-drop) */
  updateOrdrePhotos(evenementId: number, ordres: { id: number; ordre: number }[]): Observable<any> {
    return this.http.patch(
      `${this.base}/evenements/${evenementId}/photos/ordre`,
      ordres,
      this.options
    );
  }

  /** Met à jour la légende d'une photo existante */
  updateLegendePhoto(evenementId: number, photoId: number, legende: string): Observable<any> {
    return this.http.patch(
      `${this.base}/evenements/${evenementId}/photos/${photoId}`,
      { legende },
      this.options
    );
  }

  // ── Axes de recherche ─────────────────────────────────────────────────────
  getAxes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/axes`, this.options);
  }
  getAxe(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/axes/${id}`, this.options);
  }
  createAxe(data: any): Observable<any> {
    return this.http.post(`${this.base}/axes`, data, this.options);
  }
  updateAxe(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/axes/${id}`, data, this.options);
  }
  deleteAxe(id: number): Observable<any> {
    return this.http.delete(`${this.base}/axes/${id}`, this.options);
  }
  addChercheurToAxe(axeId: number, chercheurId: number): Observable<any> {
    return this.http.post(`${this.base}/axes/${axeId}/chercheurs/${chercheurId}`, {}, this.options);
  }
  removeChercheurFromAxe(axeId: number, chercheurId: number): Observable<any> {
    return this.http.delete(`${this.base}/axes/${axeId}/chercheurs/${chercheurId}`, this.options);
  }

  // ── Doctorants / Mastériens ───────────────────────────────────────────────
  getDoctorants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/doctorants`, this.options);
  }
  getDoctorant(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/doctorants/${id}`, this.options);
  }
  createDoctorant(data: any): Observable<any> {
    return this.http.post(`${this.base}/doctorants`, data, this.options);
  }
  updateDoctorant(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/doctorants/${id}`, data, this.options);
  }
  deleteDoctorant(id: number): Observable<any> {
    return this.http.delete(`${this.base}/doctorants/${id}`, this.options);
  }

  getMasteriens(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/masteriens`, this.options);
  }
  createMasterien(data: any): Observable<any> {
    return this.http.post(`${this.base}/masteriens`, data, this.options);
  }
  updateMasterien(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/masteriens/${id}`, data, this.options);
  }
  deleteMasterien(id: number): Observable<any> {
    return this.http.delete(`${this.base}/masteriens/${id}`, this.options);
  }

  // ── Outils ────────────────────────────────────────────────────────────────
  getOutils(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/outils`, this.options);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users`, this.options);
  }

  // ── Paramètres système ────────────────────────────────────────────────────

  /** Paramètres publics (labo, seo, contact, theme) — sans authentification */
  getParametresPublics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/parametres/public`, this.options);
  }

  /** Tous les paramètres — admin uniquement */
  getParametres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/parametres`, this.options);
  }

  /** Mise à jour d'un paramètre individuel par sa clé */
  updateParametre(cle: string, valeur: string): Observable<any> {
    return this.http.put(`${this.base}/admin/parametres/${cle}`, { valeur }, this.options);
  }

  /**
   * §4.3.6 — Mise à jour en lot de plusieurs paramètres en une seule requête.
   * Envoie un dictionnaire { "labo.nom": "LIMTIC", "theme.couleurPrimaire": "#00d2ff", ... }
   * Crée les clés absentes (upsert côté backend).
   */
  updateParametresLot(params: Record<string, string>): Observable<void> {
    return this.http.put<void>(`${this.base}/admin/parametres/lot`, params, this.options);
  }

  /**
   * §4.3.6 — Upload du logo du laboratoire.
   * Retourne { logoUrl: "/uploads/logos/logo-xxx.png" }
   */
  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(
      `${this.base}/admin/parametres/logo`,
      formData,
      { withCredentials: true }
    );
  }

  /**
   * §4.3.6 — Construit l'URL absolue d'un logo stocké côté backend.
   * Exemple : "/uploads/logos/logo-abc123.png" → "https://localhost:8443/uploads/logos/logo-abc123.png"
   */
  getLogoUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `https://localhost:8443${relativePath}`;
  }

  // ── Journal d'audit ───────────────────────────────────────────────────────
  getAuditLog(page = 0, size = 50): Observable<any> {
    return this.http.get(
      `${this.base}/admin/audit?page=${page}&size=${size}`,
      this.options
    );
  }

  // ── Actualités ────────────────────────────────────────────────────────────
  getDernieresPublications(n = 5): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/publications?statut=PUBLIE&sort=annee,desc&size=${n}`,
      this.options
    );
  }
  getProchainsEvenements(n = 3): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/evenements?upcoming=true&size=${n}`,
      this.options
    );
  }

  // ── Contact ───────────────────────────────────────────────────────────────
  envoyerContact(data: {
    nom: string;
    email: string;
    sujet: string;
    message: string;
    captchaToken: string;
  }): Observable<any> {
    return this.http.post(`${this.base}/contact`, data, this.options);
  }

  // ── Chercheurs par statut ─────────────────────────────────────────────────
  getChercheursByStatut(statut: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/chercheurs?statut=${statut}`, this.options);
  }

  // ── Export publications CSV ───────────────────────────────────────────────
  exportPublicationsCsv(): void {
    window.open(`${this.base}/publications/export-csv`, '_blank');
  }

  // ── Helpers génériques ────────────────────────────────────────────────────
  post(endpoint: string, body: any): Observable<any> {
    return this.http.post(`${this.base}/${endpoint}`, body, this.options);
  }
  patch(endpoint: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/${endpoint}`, body, this.options);
  }
  delete(endpoint: string): Observable<any> {
    return this.http.delete(`${this.base}/${endpoint}`, this.options);
  }

  }