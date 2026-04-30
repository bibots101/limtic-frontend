import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Publication } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-publications',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './publications.html',
  styleUrl: './publications.css'
})
export class Publications implements OnInit {
  publications = signal<Publication[]>([]);

  // Filtres
  recherche   = signal('');
  filtreType  = signal('');
  filtreAnnee = signal('');
  filtreAxe   = signal('');
  filtreClassement = signal(''); // Filtre Scimago/CORE — NOUVEAU

  // Tri — ajout de tri par IF, Scimago
  triPar = signal('annee-desc');

  // Listes dynamiques pour les selects
  annees = computed(() => {
    const a = [...new Set(this.publications().map(p => p.annee))];
    return a.sort((x, y) => y - x);
  });

  axes = computed(() => {
    const a = this.publications()
      .filter(p => p.axe?.nom)
      .map(p => p.axe!.nom);
    return [...new Set(a)];
  });

  // Publications filtrées + triées
  publicationsFiltrees = computed(() => {
    let list = this.publications();

    // Recherche plein texte
    const q = this.recherche().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.titre.toLowerCase().includes(q) ||
        p.journal?.toLowerCase().includes(q) ||
        p.resume?.toLowerCase().includes(q) ||
        p.motsCles?.toLowerCase().includes(q)
      );
    }

    // Filtre type
    if (this.filtreType()) {
      list = list.filter(p => p.type === this.filtreType());
    }

    // Filtre année
    if (this.filtreAnnee()) {
      list = list.filter(p => p.annee === Number(this.filtreAnnee()));
    }

    // Filtre axe
    if (this.filtreAxe()) {
      list = list.filter(p => p.axe?.nom === this.filtreAxe());
    }

    // ── Filtre classement (§3.7 — RÉEL, pas simulation) ──────────
    const cl = this.filtreClassement();
    if (cl === 'Q1')   list = list.filter(p => p.scimagoQuartile === 'Q1');
    if (cl === 'Q2')   list = list.filter(p => p.scimagoQuartile === 'Q2');
    if (cl === 'Q3')   list = list.filter(p => p.scimagoQuartile === 'Q3');
    if (cl === 'Q4')   list = list.filter(p => p.scimagoQuartile === 'Q4');
    if (cl === 'ASTAR')list = list.filter(p => p.classementCORE === 'A*');
    if (cl === 'A')    list = list.filter(p => p.classementCORE === 'A');
    if (cl === 'B')    list = list.filter(p => p.classementCORE === 'B');
    if (cl === 'avecIF')list = list.filter(p => !!p.facteurImpact);

    // Tri
    const tri = this.triPar();
    switch (tri) {
      case 'annee-desc': list = [...list].sort((a, b) => b.annee - a.annee); break;
      case 'annee-asc':  list = [...list].sort((a, b) => a.annee - b.annee); break;
      case 'titre':      list = [...list].sort((a, b) => a.titre.localeCompare(b.titre)); break;
      // ── Tris par classement RÉEL ──────────────────────────────────
      case 'if-desc':
        list = [...list].sort((a, b) => (b.facteurImpact ?? 0) - (a.facteurImpact ?? 0));
        break;
      case 'scimago':
        const order: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
        list = [...list].sort((a, b) =>
          (order[a.scimagoQuartile ?? ''] ?? 99) - (order[b.scimagoQuartile ?? ''] ?? 99)
        );
        break;
      case 'core':
        const coreOrder: Record<string, number> = { 'A*': 1, A: 2, B: 3, C: 4 };
        list = [...list].sort((a, b) =>
          (coreOrder[a.classementCORE ?? ''] ?? 99) - (coreOrder[b.classementCORE ?? ''] ?? 99)
        );
        break;
    }
    return list;
  });

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getPublications().subscribe(data => this.publications.set(data));
  }

  resetFiltres() {
    this.recherche.set('');
    this.filtreType.set('');
    this.filtreAnnee.set('');
    this.filtreAxe.set('');
    this.filtreClassement.set('');
    this.triPar.set('annee-desc');
  }

  // ── Export BibTeX ─────────────────────────────────────────────────────────
  exportBibtex() {
    const lines: string[] = [];
    for (const p of this.publicationsFiltrees()) {
      const key = `${p.chercheurs?.[0]?.nom ?? 'limtic'}${p.annee}`.replace(/\s/g, '');
      const entryType = p.type === 'Journal' ? 'article'
        : p.type === 'Conference' ? 'inproceedings'
        : p.type === 'Book Chapter' ? 'incollection'
        : 'misc';

      let entry = `@${entryType}{${key},\n`;
      entry += `  title     = {${p.titre}},\n`;
      if (p.chercheurs?.length) {
        entry += `  author    = {${p.chercheurs.map(c => `${c.nom}, ${c.prenom}`).join(' and ')}},\n`;
      }
      if (p.journal) {
        entry += entryType === 'article'
          ? `  journal   = {${p.journal}},\n`
          : `  booktitle = {${p.journal}},\n`;
      }
      entry += `  year      = {${p.annee}},\n`;
      if (p.doi)  entry += `  doi       = {${p.doi}},\n`;
      if (p.lienUrl) entry += `  url    = {${p.lienUrl}},\n`;
      // Champs classement §3.7
      if (p.facteurImpact)    entry += `  note      = {IF=${p.facteurImpact}},\n`;
      if (p.scimagoQuartile)  entry += `  note      = {Scimago ${p.scimagoQuartile}},\n`;
      if (p.classementCORE)   entry += `  note      = {CORE ${p.classementCORE}},\n`;
      entry += `}`;
      lines.push(entry);
    }
    this.telecharger(lines.join('\n\n'), 'publications_limtic.bib', 'text/plain');
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exportCsv() {
    // Entête CSV avec les champs de classement §3.7
    const header = 'titre,type,annee,journal,doi,facteurImpact,scimagoQuartile,snip,classementCORE,statut,auteurs';
    const rows = this.publicationsFiltrees().map(p => {
      const auteurs = p.chercheurs?.map(c => `${c.prenom} ${c.nom}`).join('; ') ?? '';
      return [
        this.csvField(p.titre),
        this.csvField(p.type),
        p.annee,
        this.csvField(p.journal ?? ''),
        this.csvField(p.doi ?? ''),
        p.facteurImpact ?? '',
        p.scimagoQuartile ?? '',
        p.snip ?? '',
        p.classementCORE ?? '',
        p.statut ?? '',
        this.csvField(auteurs)
      ].join(',');
    });
    this.telecharger([header, ...rows].join('\n'), 'publications_limtic.csv', 'text/csv;charset=utf-8;');
  }

  private csvField(val: string): string {
    if (!val) return '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  private telecharger(contenu: string, nomFichier: string, mimeType: string) {
    const bom = mimeType.includes('csv') ? '\uFEFF' : '';
    const blob = new Blob([bom + contenu], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = nomFichier;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers badges ────────────────────────────────────────────────────────
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
    if (pub.facteurImpact)  return `IF ${pub.facteurImpact.toFixed(2)}`;
    return '';
  }
}
