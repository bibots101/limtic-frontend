import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Publication, Evenement } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  public settings = inject(LabSettingsService);

  statsLoading      = signal(true);
  statsChercheurs   = signal(0);
  statsPublications = signal(0);
  statsEvenements   = signal(0);
  statsOutils       = signal(0);
  // ── NOUVEAU §3.1 ──────────────────────────────────────────────
  statsDoctorants   = signal(0);
  statsMasteriens   = signal(0);

  dernieresPublications = signal<Publication[]>([]);
  prochainsEvenements   = signal<Evenement[]>([]);
  actualitesLoading     = signal(true);

  nomLabo        = signal('LIMTIC');
  descriptionLabo = signal(
    "Laboratoire d'Informatique, de Modélisation et des Technologies de l'Information et de la Communication"
  );

  ngOnInit() {
    this.chargerStats();
    this.chargerActualites();
    this.chargerParametres();
  }

  private chargerStats(): void {
    this.api.getChercheurs().subscribe({
      next: d => this.statsChercheurs.set(d?.length || 0),
      error: () => this.statsChercheurs.set(0)
    });
    this.api.getPublications().subscribe({
      next: d => this.statsPublications.set(d?.length || 0),
      error: () => this.statsPublications.set(0)
    });
    this.api.getEvenements().subscribe({
      next: d => this.statsEvenements.set(d?.length || 0),
      error: () => this.statsEvenements.set(0)
    });
    this.api.getOutils().subscribe({
      next: d => { this.statsOutils.set(d?.length || 0); },
      error: () => this.statsOutils.set(0)
    });
    // ── NOUVEAU : doctorants et mastériens ─────────────────────
    this.api.getDoctorants().subscribe({
      next: d => this.statsDoctorants.set(d?.length || 0),
      error: () => this.statsDoctorants.set(0)
    });
    this.api.getMasteriens().subscribe({
      next: d => { this.statsMasteriens.set(d?.length || 0); this.statsLoading.set(false); },
      error: () => { this.statsMasteriens.set(0); this.statsLoading.set(false); }
    });
  }

  private chargerActualites(): void {
    this.actualitesLoading.set(true);
    this.api.getPublications().subscribe({
      next: (pubs: Publication[]) => {
        const publiees = pubs
          .filter(p => p.statut === 'PUBLIE')
          .sort((a, b) => b.annee - a.annee)
          .slice(0, 5);
        this.dernieresPublications.set(publiees);
      },
      error: () => this.dernieresPublications.set([])
    });
    this.api.getEvenements().subscribe({
      next: (evts: Evenement[]) => {
        const now = new Date();
        const aVenir = evts
          .filter(e => e.statut !== 'ANNULE' && new Date(e.dateEvenement) >= now)
          .sort((a, b) =>
            new Date(a.dateEvenement).getTime() - new Date(b.dateEvenement).getTime()
          )
          .slice(0, 3);
        this.prochainsEvenements.set(aVenir);
        this.actualitesLoading.set(false);
      },
      error: () => { this.prochainsEvenements.set([]); this.actualitesLoading.set(false); }
    });
  }

  private chargerParametres(): void {
    this.api.getParametresPublics().subscribe({
      next: (params: any[]) => {
        const nom  = params.find(p => p.cle === 'labo.nom');
        const desc = params.find(p => p.cle === 'labo.description');
        if (nom?.valeur)  this.nomLabo.set(nom.valeur);
        if (desc?.valeur) this.descriptionLabo.set(desc.valeur);
      },
      error: () => {}
    });
  }

  getBadgeClassement(pub: Publication): { label: string; classe: string } | null {
    if (pub.scimagoQuartile) {
      const classes: Record<string, string> = {
        Q1: 'badge-q1', Q2: 'badge-q2', Q3: 'badge-q3', Q4: 'badge-q4'
      };
      return { label: pub.scimagoQuartile, classe: classes[pub.scimagoQuartile] || 'badge-q4' };
    }
    if (pub.classementCORE) {
      const classes: Record<string, string> = {
        'A*': 'badge-astar', 'A': 'badge-a', 'B': 'badge-b', 'C': 'badge-c'
      };
      return { label: `CORE ${pub.classementCORE}`, classe: classes[pub.classementCORE] || 'badge-c' };
    }
    if (pub.facteurImpact) {
      return { label: `IF ${pub.facteurImpact.toFixed(2)}`, classe: 'badge-if' };
    }
    return null;
  }
}
