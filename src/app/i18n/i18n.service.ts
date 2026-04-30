import { Injectable, signal } from '@angular/core';

/**
 * §5.2.4 CDC — Infrastructure i18n prête pour l'anglais.
 *
 * Service léger de traduction. Ne dépend d'aucune lib externe.
 * Ajoutez des traductions dans les objets FR / EN ci-dessous.
 *
 * Usage dans un composant :
 *   private i18n = inject(I18nService);
 *   titre = this.i18n.t('nav.chercheurs');   // → "Chercheurs" ou "Researchers"
 *
 * Changement de langue :
 *   this.i18n.setLangue('en');
 */

export type Langue = 'fr' | 'en';

type Traductions = Record<string, string>;

const FR: Traductions = {
  // Navigation
  'nav.accueil':       'Accueil',
  'nav.chercheurs':    'Chercheurs',
  'nav.publications':  'Publications',
  'nav.evenements':    'Événements',
  'nav.doctorants':    'Doctorants',
  'nav.masteriens':    'Mastériens',
  'nav.axes':          'Axes de recherche',
  'nav.outils':        'Outils',
  'nav.contact':       'Contact',

  // Publications
  'pub.titre':         'Publications',
  'pub.recherche':     'Rechercher par titre, journal, résumé...',
  'pub.type.all':      'Tous les types',
  'pub.annee.all':     'Toutes les années',
  'pub.axe.all':       'Tous les axes',
  'pub.classement.all':'Tous classements',
  'pub.export.bibtex': '⬇ BibTeX',
  'pub.export.csv':    '⬇ CSV',
  'pub.tri.annee_desc':'Année ↓',
  'pub.tri.annee_asc': 'Année ↑',
  'pub.tri.titre':     'Titre A→Z',
  'pub.tri.if_desc':   'Impact Factor ↓',
  'pub.tri.scimago':   'Scimago (Q1 → Q4)',
  'pub.tri.core':      'CORE (A* → C)',
  'pub.vide':          'Aucune publication ne correspond aux filtres.',
  'pub.reset':         'Réinitialiser les filtres',

  // Événements
  'evt.titre':         'Événements',
  'evt.galerie':       'Galerie photos',
  'evt.intervenants':  'Intervenants',
  'evt.programme':     'Programme',
  'evt.lieu':          'Lieu',
  'evt.statut.planifie': 'Planifié',
  'evt.statut.en_cours': 'En cours',
  'evt.statut.termine': 'Terminé',
  'evt.statut.annule':  'Annulé',

  // Contact
  'contact.titre':     'Contact',
  'contact.nom':       'Nom complet',
  'contact.email':     'Adresse email',
  'contact.sujet':     'Sujet',
  'contact.message':   'Message',
  'contact.envoyer':   'Envoyer le message',
  'contact.succes':    'Votre message a bien été envoyé.',
  'contact.captcha':   'Veuillez compléter le captcha.',

  // Admin
  'admin.audit':       'Journal d\'audit',
  'admin.parametres':  'Paramètres généraux',
  'admin.import_csv':  'Importer CSV',
  'admin.export_csv':  'Exporter CSV',

  // Général
  'general.loading':   'Chargement...',
  'general.erreur':    'Une erreur est survenue.',
  'general.voir_tout': 'Voir tout',
  'general.retour':    '← Retour',
  'general.enregistrer':'Enregistrer',
  'general.annuler':   'Annuler',
  'general.supprimer': 'Supprimer',
  'general.modifier':  'Modifier',
  'general.ajouter':   'Ajouter',
};

const EN: Traductions = {
  // Navigation
  'nav.accueil':       'Home',
  'nav.chercheurs':    'Researchers',
  'nav.publications':  'Publications',
  'nav.evenements':    'Events',
  'nav.doctorants':    'PhD Students',
  'nav.masteriens':    'Master Students',
  'nav.axes':          'Research Areas',
  'nav.outils':        'Tools',
  'nav.contact':       'Contact',

  // Publications
  'pub.titre':         'Publications',
  'pub.recherche':     'Search by title, journal, abstract...',
  'pub.type.all':      'All types',
  'pub.annee.all':     'All years',
  'pub.axe.all':       'All research areas',
  'pub.classement.all':'All rankings',
  'pub.export.bibtex': '⬇ BibTeX',
  'pub.export.csv':    '⬇ CSV',
  'pub.tri.annee_desc':'Year ↓',
  'pub.tri.annee_asc': 'Year ↑',
  'pub.tri.titre':     'Title A→Z',
  'pub.tri.if_desc':   'Impact Factor ↓',
  'pub.tri.scimago':   'Scimago (Q1 → Q4)',
  'pub.tri.core':      'CORE (A* → C)',
  'pub.vide':          'No publications match the selected filters.',
  'pub.reset':         'Reset filters',

  // Events
  'evt.titre':         'Events',
  'evt.galerie':       'Photo gallery',
  'evt.intervenants':  'Speakers',
  'evt.programme':     'Programme',
  'evt.lieu':          'Venue',
  'evt.statut.planifie': 'Planned',
  'evt.statut.en_cours': 'Ongoing',
  'evt.statut.termine': 'Ended',
  'evt.statut.annule':  'Cancelled',

  // Contact
  'contact.titre':     'Contact',
  'contact.nom':       'Full name',
  'contact.email':     'Email address',
  'contact.sujet':     'Subject',
  'contact.message':   'Message',
  'contact.envoyer':   'Send message',
  'contact.succes':    'Your message has been sent.',
  'contact.captcha':   'Please complete the captcha.',

  // Admin
  'admin.audit':       'Audit log',
  'admin.parametres':  'General settings',
  'admin.import_csv':  'Import CSV',
  'admin.export_csv':  'Export CSV',

  // General
  'general.loading':   'Loading...',
  'general.erreur':    'An error occurred.',
  'general.voir_tout': 'See all',
  'general.retour':    '← Back',
  'general.enregistrer':'Save',
  'general.annuler':   'Cancel',
  'general.supprimer': 'Delete',
  'general.modifier':  'Edit',
  'general.ajouter':   'Add',
};

const DICTIONNAIRE: Record<Langue, Traductions> = { fr: FR, en: EN };

@Injectable({ providedIn: 'root' })
export class I18nService {

  /** Langue courante, réactive (signal Angular) */
  langue = signal<Langue>('fr');

  constructor() {
    // Restaurer la langue depuis localStorage si disponible
    const saved = localStorage.getItem('limtic_langue') as Langue | null;
    if (saved && (saved === 'fr' || saved === 'en')) {
      this.langue.set(saved);
    }
  }

  /** Changer la langue et persister le choix */
  setLangue(l: Langue): void {
    this.langue.set(l);
    localStorage.setItem('limtic_langue', l);
  }

  /**
   * Obtenir une traduction par sa clé.
   * Si la clé est absente dans la langue cible, on tombe back sur le français.
   * Si absente aussi en français, on retourne la clé elle-même (aucune erreur silencieuse).
   */
  t(cle: string): string {
    return DICTIONNAIRE[this.langue()][cle]
      ?? DICTIONNAIRE['fr'][cle]
      ?? cle;
  }
}
