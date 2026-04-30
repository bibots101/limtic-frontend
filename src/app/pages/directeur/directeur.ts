import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-directeur',
  imports: [RouterLink],
  templateUrl: './directeur.html',
  styleUrl: './directeur.css'
})
export class Directeur {
  directeur = {
    prenom: 'Salah',
    nom: 'SALHI',
    titre: 'Professeur des Universités',
    specialite: 'Intelligence Artificielle & Traitement du Langage Naturel',
    institution: 'Institut Supérieur d\'Informatique — Université de Tunis El Manar',
    email: 'm.benromdhane@isi.utm.tn',
    telephone: '+216 71 123 456',
    bureau: 'Bureau 214, Bâtiment A — ISI El Manar',
    photo: null,
    message: `Bienvenue sur le site officiel du Laboratoire d'Informatique, de Modélisation et des Technologies de l'Information et de la Communication (LIMTIC).

Notre laboratoire réunit des chercheurs passionnés autour de thématiques de pointe : intelligence artificielle, cybersécurité, Internet des objets, big data et traitement automatique du langage naturel.

Depuis sa création, LIMTIC s'est imposé comme un acteur incontournable de la recherche informatique en Tunisie, avec des collaborations nationales et internationales de premier plan. Nous accueillons chaque année de nouveaux doctorants et mastériens qui contribuent à l'avancement de la science et à la résolution de problèmes concrets.

Notre ambition : faire de LIMTIC un laboratoire de référence en Afrique du Nord, ouvert sur le monde et ancré dans les réalités socio-économiques de notre région.

Je vous invite à découvrir nos travaux, nos équipes et nos axes de recherche à travers ce site.`,
    liens: {
      googleScholar: 'https://scholar.google.com/citations?user=example',
      researchGate: 'https://www.researchgate.net/profile/example',
      orcid: 'https://orcid.org/0000-0000-0000-0000',
      linkedin: 'https://www.linkedin.com/in/example'
    },
    publications: [
      {
        titre: 'Deep Learning for Arabic Natural Language Processing: A Survey',
        journal: 'IEEE Transactions on Neural Networks',
        annee: 2024,
        type: 'Journal'
      },
      {
        titre: 'Federated Learning in IoT Environments: Challenges and Opportunities',
        journal: 'ACM Computing Surveys',
        annee: 2023,
        type: 'Journal'
      },
      {
        titre: 'A Novel Approach for Cybersecurity Threat Detection using Graph Neural Networks',
        journal: 'USENIX Security Symposium',
        annee: 2023,
        type: 'Conference'
      },
      {
        titre: 'Multilingual Sentiment Analysis for Social Media: A Transfer Learning Approach',
        journal: 'Elsevier Information Processing & Management',
        annee: 2022,
        type: 'Journal'
      }
    ]
  };
}
