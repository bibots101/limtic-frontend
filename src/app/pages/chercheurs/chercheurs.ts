import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Chercheur } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-chercheurs',
  imports: [RouterLink, FormsModule],
  templateUrl: './chercheurs.html',
  styleUrl: './chercheurs.css'
})
export class Chercheurs implements OnInit {
  chercheurs = signal<Chercheur[]>([]);

  recherche    = signal('');
  filtreGrade  = signal('');
  filtreAxe    = signal('');
  filtreStatut = signal('');  // '' | 'ACTIF' | 'RETRAITE' | 'INVITE'

  grades = computed(() => {
    const g = this.chercheurs().map(c => c.grade).filter(Boolean);
    return [...new Set(g)];
  });

  axes = computed(() => {
    const a = this.chercheurs()
      .flatMap(c => c.axes || [])
      .map(axe => axe.nom);
    return [...new Set(a)];
  });

  chercheursFiltres = computed(() => {
    let list = this.chercheurs();

    const q = this.recherche().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.specialite?.toLowerCase().includes(q) ||
        c.institution?.toLowerCase().includes(q)
      );
    }

    if (this.filtreGrade()) {
      list = list.filter(c => c.grade === this.filtreGrade());
    }

    if (this.filtreAxe()) {
      list = list.filter(c =>
        c.axes?.some(a => a.nom === this.filtreAxe())
      );
    }

    // FIXE §3.3.1 — filtre case-insensitive + valeurs normalisées
    if (this.filtreStatut()) {
      list = list.filter(c =>
        (c.statut ?? '').toUpperCase() === this.filtreStatut()
      );
    }

    return list;
  });

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getChercheurs().subscribe({
      next: (data) => this.chercheurs.set(data),
      error: (err) => console.error('ERREUR:', err)
    });
  }

  resetFiltres() {
    this.recherche.set('');
    this.filtreGrade.set('');
    this.filtreAxe.set('');
    this.filtreStatut.set('');
  }
}
