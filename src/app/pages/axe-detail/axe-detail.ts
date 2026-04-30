import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AxeRecherche, Chercheur, Publication, Doctorant, Masterien } from '../../models/chercheur.model';

@Component({
  selector: 'app-axe-detail',
  imports: [CommonModule],
  templateUrl: './axe-detail.html',
  styleUrl: './axe-detail.css'
})
export class AxeDetail implements OnInit {
  axe = signal<AxeRecherche | null>(null);
  chercheurs = signal<Chercheur[]>([]);
  publications = signal<Publication[]>([]);
  doctorants = signal<Doctorant[]>([]);
  masteriens = signal<Masterien[]>([]);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getAxe(id).subscribe(data => {
      this.axe.set(data);
    });

    this.api.getChercheurs().subscribe((chercheurs: Chercheur[]) => {
      this.chercheurs.set(chercheurs.filter(c => c.axes?.some(a => a.id === id)));
    });

    this.api.getPublicationsByAxe(id).subscribe((pubs: Publication[]) => {
      this.publications.set(pubs);
    });

    this.api.getDoctorants().subscribe((doctorants: Doctorant[]) => {
      this.doctorants.set(doctorants.filter(d => d.axeRecherche?.id === id));
    });

    this.api.getMasteriens().subscribe((masteriens: Masterien[]) => {
      this.masteriens.set(masteriens.filter(m => m.axeRecherche?.id === id));
    });
  }

  retour() { this.router.navigate(['/axes']); }

  navigateToChercheur(id: number) {
    this.router.navigate(['/chercheurs', id], { queryParams: { from: 'axe-detail' } });
  }

  navigateToPublication(id: number) {
    this.router.navigate(['/publications', id]);
  }

  navigateToDoctorant(id: number) {
    this.router.navigate(['/doctorants', id]);
  }

  navigateToMasterien(id: number) {
    this.router.navigate(['/masteriens', id]);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
