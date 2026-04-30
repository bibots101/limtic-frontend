import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Evenement } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-evenements',
  imports: [DatePipe, SlicePipe, FormsModule, RouterLink],
  templateUrl: './evenements.html',
  styleUrl: './evenements.css'
})
export class Evenements implements OnInit {
  evenements = signal<Evenement[]>([]);

  // Filtres
  filtreStatut = signal('tous'); // tous / avenir / passe
  filtreType = signal('');

  types = computed(() => {
    const t = this.evenements().map(e => e.type).filter(Boolean);
    return [...new Set(t)];
  });

  // Statut automatique selon la date
  getStatut(dateStr: string): 'avenir' | 'passe' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date >= today ? 'avenir' : 'passe';
  }

  evenementsFiltres = computed(() => {
    let list = this.evenements();

    if (this.filtreStatut() !== 'tous') {
      list = list.filter(e => this.getStatut(e.dateEvenement) === this.filtreStatut());
    }

    if (this.filtreType()) {
      list = list.filter(e => e.type === this.filtreType());
    }

    // Tri : à venir d'abord (les plus proches), puis passés (les plus récents)
    list = [...list].sort((a, b) => {
      const da = new Date(a.dateEvenement).getTime();
      const db = new Date(b.dateEvenement).getTime();
      const today = new Date().getTime();
      const aAvenir = da >= today;
      const bAvenir = db >= today;
      if (aAvenir && !bAvenir) return -1;
      if (!aAvenir && bAvenir) return 1;
      if (aAvenir && bAvenir) return da - db; // plus proche en premier
      return db - da; // plus récent en premier pour les passés
    });

    return list;
  });

  aVenir = computed(() =>
    this.evenements().filter(e => this.getStatut(e.dateEvenement) === 'avenir').length
  );

  passes = computed(() =>
    this.evenements().filter(e => this.getStatut(e.dateEvenement) === 'passe').length
  );

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getEvenements().subscribe(data => this.evenements.set(data));
  }

  speakerSummary(e: Evenement): string {
    const names = (e.intervenants ?? [])
      .map(inv => `${inv.prenom ? inv.prenom + ' ' : ''}${inv.nom}`.trim())
      .filter(name => !!name);
    if (!names.length) return '';
    if (names.length === 1) return names[0];
    return `${names.slice(0, 2).join(', ')}${names.length > 2 ? ' et +' + (names.length - 2) : ''}`;
  }

  resetFiltres() {
    this.filtreStatut.set('tous');
    this.filtreType.set('');
  }
}
