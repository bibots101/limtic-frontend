import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Chercheur, Publication } from '../../models/chercheur.model';

@Component({
  selector: 'app-chercheur-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './chercheur-detail.html',
  styleUrl: './chercheur-detail.css'
})
export class ChercheurDetail implements OnInit {

  chercheur  = signal<Chercheur | null>(null);
  doctorants = signal<any[]>([]);
  masteriens = signal<any[]>([]);
  isAdmin    = false;

  // Onglet actif : 'profil' | 'publications' | 'doctorants' | 'masteriens'
  ongletActif = signal<'profil' | 'publications' | 'doctorants' | 'masteriens'>('profil');

  // ── Style Google Scholar : tri et stats des publications ──────────────────
  triPublications = signal<'annee-desc' | 'annee-asc' | 'if-desc' | 'scimago' | 'core'>('annee-desc');

  publicationsTri = computed(() => {
    const pubs = this.chercheur()?.publications ?? [];
    const tri  = this.triPublications();
    switch (tri) {
      case 'annee-desc': return [...pubs].sort((a, b) => b.annee - a.annee);
      case 'annee-asc':  return [...pubs].sort((a, b) => a.annee - b.annee);
      case 'if-desc':    return [...pubs].sort((a, b) => (b.facteurImpact ?? 0) - (a.facteurImpact ?? 0));
      case 'scimago': {
        const o: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
        return [...pubs].sort((a, b) => (o[a.scimagoQuartile ?? ''] ?? 99) - (o[b.scimagoQuartile ?? ''] ?? 99));
      }
      case 'core': {
        const o: Record<string, number> = { 'A*': 1, A: 2, B: 3, C: 4 };
        return [...pubs].sort((a, b) => (o[a.classementCORE ?? ''] ?? 99) - (o[b.classementCORE ?? ''] ?? 99));
      }
      default: return pubs;
    }
  });

  // Statistiques style Google Scholar (§3.7)
  statsPublications = computed(() => {
    const pubs  = this.chercheur()?.publications ?? [];
    const publiees = pubs.filter(p => p.statut === 'PUBLIE');

    return {
      total:      pubs.length,
      publiees:   publiees.length,
      // Citations : non disponibles côté BD pour l'instant — afficher 0
      citations:  0,
      // IF moyen des journaux avec IF renseigné
      ifMoyen:    this.calculerIFMoyen(pubs),
      // Répartition par quartile Scimago
      q1: pubs.filter(p => p.scimagoQuartile === 'Q1').length,
      q2: pubs.filter(p => p.scimagoQuartile === 'Q2').length,
      q3: pubs.filter(p => p.scimagoQuartile === 'Q3').length,
      q4: pubs.filter(p => p.scimagoQuartile === 'Q4').length,
      // Répartition CORE
      astar: pubs.filter(p => p.classementCORE === 'A*').length,
      a:     pubs.filter(p => p.classementCORE === 'A').length,
      b:     pubs.filter(p => p.classementCORE === 'B').length,
      // Répartition par type
      journals:     pubs.filter(p => p.type === 'Journal').length,
      conferences:  pubs.filter(p => p.type === 'Conference').length,
      chapitres:    pubs.filter(p => p.type === 'Book Chapter').length,
    };
  });

  // Publications par année (histogramme)
  publicationsParAnnee = computed(() => {
    const pubs = this.chercheur()?.publications ?? [];
    const map  = new Map<number, number>();
    pubs.forEach(p => map.set(p.annee, (map.get(p.annee) ?? 0) + 1));
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([annee, count]) => ({ annee, count }));
  });

  constructor(
    private api:   ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isAdmin = localStorage.getItem('role') === 'ADMIN';

    this.api.getChercheur(id).subscribe(data => {
      this.chercheur.set(data);
      this.api.getDoctorants().subscribe((list: any[]) =>
        this.doctorants.set(list.filter(d => d.directeur?.id === id))
      );
      this.api.getMasteriens().subscribe((list: any[]) =>
        this.masteriens.set(list.filter(m => m.encadrant?.id === id))
      );
    });
  }

  // Navigation
  retour() {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'doctorant-detail') this.router.navigate(['/doctorants']);
    else if (from === 'masterien-detail') this.router.navigate(['/masteriens']);
    else this.router.navigate(this.isAdmin ? ['/dashboard-admin'] : ['/chercheurs']);
  }

  getRetourText(): string {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'doctorant-detail') return 'Retour aux doctorants';
    if (from === 'masterien-detail') return 'Retour aux mastériens';
    return this.isAdmin ? 'Retour au dashboard' : 'Retour aux chercheurs';
  }

  naviguerPublication(id: number) { this.router.navigate(['/publications', id]); }
  naviguerDoctorant(id: number)   { this.router.navigate(['/doctorants', id]); }
  naviguerMasterien(id: number)   { this.router.navigate(['/masteriens', id]); }

  // Badges classement
  getBadgeClass(pub: Publication): string {
    if (pub.scimagoQuartile === 'Q1') return 'badge-q1';
    if (pub.scimagoQuartile === 'Q2') return 'badge-q2';
    if (pub.scimagoQuartile === 'Q3') return 'badge-q3';
    if (pub.scimagoQuartile === 'Q4') return 'badge-q4';
    if (pub.classementCORE === 'A*') return 'badge-astar';
    if (pub.classementCORE === 'A')  return 'badge-a';
    if (pub.classementCORE === 'B')  return 'badge-b';
    if (pub.classementCORE === 'C')  return 'badge-c';
    return '';
  }

  getBadgeLabel(pub: Publication): string {
    if (pub.scimagoQuartile) return pub.scimagoQuartile;
    if (pub.classementCORE) return `CORE ${pub.classementCORE}`;
    return '';
  }

  private calculerIFMoyen(pubs: Publication[]): number | null {
    const avecIF = pubs.filter(p => !!p.facteurImpact);
    if (!avecIF.length) return null;
    const sum = avecIF.reduce((s, p) => s + (p.facteurImpact ?? 0), 0);
    return Math.round((sum / avecIF.length) * 100) / 100;
  }
}
