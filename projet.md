# Proposition de Projet : TravelMap
## Application Web de Suivi de Voyage

### Équipe du Projet

- **Célia Ibrahim** – Numéro étudiant : 22011745  
  celia.ibrahim02@etud.univ-paris8.fr
- **Abaarour Moad** – Numéro étudiant : 19004198  
  moad.abaarour@etud.univ-paris8.fr
- **Deliège Sacha** – Numéro étudiant : 22000731  
  sacha.deliege@etud.univ-paris8.fr
- **Belbachir Lekbir** – Numéro étudiant : 23003433  
  lekbir.belbachir@etud.univ-paris8.fr

**Licence 2 Informatique**  
**Année universitaire : 2024–2025**

---

## Table des matières

1. [Description du projet](#1-description-du-projet)
2. [Fonctionnalités principales](#2-fonctionnalités-principales)
3. [Technologies et architecture](#3-technologies-et-architecture)
4. [Modèle de données relationnel](#4-modèle-de-données-relationnel)
5. [API REST et structure logicielle](#5-api-rest-et-structure-logicielle)
6. [Objectifs pédagogiques](#6-objectifs-pédagogiques)
7. [Planning du projet (4 semaines)](#7-planning-du-projet-4-semaines)
8. [Méthodologie de travail](#8-méthodologie-de-travail)

---

## 1. Description du projet

TravelMap est une application web interactive permettant aux utilisateurs de suivre, documenter et consulter leurs voyages à travers une carte du monde. Elle a pour but d'encourager les utilisateurs à voyager davantage et à s'intéresser à la culture des lieux qu'ils visitent.

### Chaque utilisateur peut :

- Saisir un lieu et consulter sa page
- Ajouter le lieu à sa liste de lieux visités
- Ajouter ou consulter les activités du lieu
- Créer ou finir un quizz sur le lieu
- Noter le lieu
- Augmenter son score en visitant de nouveaux lieux et en créant/finissant des quizz
- Visualiser les lieux visités (colorés)

Le projet met en œuvre une architecture web moderne (React + Django + API REST), avec un déploiement local prévu dans le cadre d'un projet universitaire.

---

## 2. Fonctionnalités principales

### 2.1 Recherche et accès aux lieux

- Après connexion, l'utilisateur arrive sur une page d'accueil avec une barre de recherche : « Où partez-vous ? »
- Lorsqu'un lieu est saisi, l'utilisateur est redirigé vers la page correspondante
- L'auto-complétion des lieux est assurée via l'API GeoNames


### 2.2 Consultation d'un lieu et interactions

#### La page d'un lieu affiche :
- Les activités récentes proposées à cet endroit
- Les quizz disponibles
- D'éventuels médias ou lien vers un site officiel

#### L'utilisateur peut :
- Ajouter le lieu à ses destinations visitées (favoris)
- Ajouter une activité ou un quizz (le lieu est alors marqué comme visité)
- Cliquer sur une activité pour consulter les détails, l'enregistrer et la noter
- Réaliser un quizz pour gagner des points

Chaque action (contribution, quizz, notation) permet d'augmenter le score de l'utilisateur.


### 2.3 Consultation du profil utilisateur

- Map affichant les pays visités en rouge, non visités en gris
- Liste des voyages effectués avec lieu et date
- Liste des activités créées/sauvegardées
- Liste des quizz créés/terminés


---

## 3. Technologies et architecture

- **Backend** : Django + Django REST Framework
- **Frontend** : React, Vite
- **Cartographie** : LeafletJS + OpenStreetMap
- **Base de données** : PostgreSQL
- **API externe** : GeoNames pour la suggestion de lieux
- **Outils** : Git, GitHub, Postman, VS Code

L'architecture suit un modèle frontend/backend séparé avec communication via API REST.

---

## 4. Modèle de données relationnel

| Table | Champs principaux |
|-------|-------------------|
| **Utilisateurs** | id (PK), username, email, mot de passe (hashé), date inscription |
| **Pays** | code iso (PK), nom |
| **Lieux** | id (PK), nom ville, pays code (FK), geoname id, latitude, longitude |
| **Voyages** | id (PK), utilisateur id (FK), lieu id (FK), date début, date fin, note, commentaire |
| **Favoris** | utilisateur id (FK), lieu id (FK), date ajout |
| **Lieux Visités** | utilisateur id (FK), lieu id (FK), clé primaire composite |
| **Médias** | id (PK), voyage id (FK), type (photo/vidéo), chemin fichier |
| **Activités** | id (PK), titre, description, lieu id (FK), créé par (FK utilisateur), date création |
| **Notes Activités** | id (PK), utilisateur id (FK), activite id (FK), note, commentaire, date |
| **Quizz** | id (PK), titre, lieu id (FK), créé par (FK utilisateur), date création |
| **Questions Quizz** | id (PK), quizz id (FK), question, réponse correcte, choix a, choix b, choix c, choix d |
| **Résultats Quizz** | id (PK), utilisateur id (FK), quizz id (FK), score, date achèvement |
| **Scores** | utilisateur id (PK, FK), score total |

### Relations :

- Un utilisateur peut avoir plusieurs voyages (relation 1-N)
- Un voyage est associé à un lieu (relation N-1)
- Un lieu appartient à un seul pays (relation N-1)
- Un voyage peut contenir plusieurs médias (relation 1-N)
- Un utilisateur peut ajouter plusieurs lieux en favoris (relation N-N via table d'association)
- Un utilisateur peut avoir visité plusieurs lieux (relation N-N via table d'association lieux visités)
- Un lieu peut proposer plusieurs activités (relation 1-N)
- Un utilisateur peut créer plusieurs activités (relation 1-N)
- Une activité peut recevoir plusieurs notes d'autres utilisateurs (relation 1-N)
- Un lieu peut contenir plusieurs quizz (relation 1-N)
- Un utilisateur peut créer plusieurs quizz (relation 1-N)
- Un quizz contient plusieurs questions (relation 1-N)
- Un utilisateur peut répondre à plusieurs quizz (relation N-N via résultats quizz)
- Un utilisateur possède un score global cumulé (relation 1-1)

---

## 5. API REST et structure logicielle

### Modèles Django :
User, Pays, Lieu, Voyage, Favori, Media, Activité, NoteActivité, Quizz, QuestionQuizz, ResultatQuizz, Score

### Endpoints principaux :

- `POST /auth/login` – Connexion de l'utilisateur
- `GET /lieux/search?q=nom` – Recherche d'un lieu (ville ou pays)
- `GET /lieux/id` – Détails d'un lieu (activités, quizz, etc.)
- `POST /favoris` – Ajouter un lieu aux favoris
- `POST /voyages` – Marquer un lieu comme visité (nouveau voyage)
- `GET /voyages/moi` – Liste des voyages de l'utilisateur
- `POST /activites` – Créer une activité
- `GET /activites/id` – Voir une activité + notes
- `POST /activites/id/note` – Noter une activité
- `POST /quizz` – Créer un quizz
- `GET /quizz/id` – Voir un quizz
- `POST /quizz/id/reponse` – Répondre à un quizz

- **Format des données** : JSON (entrées et sorties)
- **Intégration front-end** : via fetch ou axios dans l'application React (hooks personnalisés ou context API si besoin)

---

## 6. Objectifs pédagogiques

- Concevoir une application web fullstack avec une architecture clairement séparée frontend/backend (React + Django REST)
- Modéliser et implémenter une base de données relationnelle cohérente avec les interactions utilisateur
- Développer des modèles ORM avec Django et gérer la persistance des données
- Concevoir et consommer une API RESTful dans React (fetch, axios)
- Intégrer des APIs tierces pour enrichir l'expérience utilisateur (ex. : GeoNames pour la suggestion de lieux)
- Travailler en équipe à l'aide de Git et GitHub, avec une organisation collaborative (branches, pull requests, revues de code)
- Concevoir un algorithme de recommandation personnalisé pour suggérer les prochaines destinations à visiter, basé sur l'historique de voyages, les quizz terminés ou les activités appréciées

---

## 7. Planning du projet (4 semaines)

| Semaine | Activités |
|---------|-----------|
| **Semaine 1** | Analyse des besoins, conception de la base, prototypes (carte, formulaire) |
| **Semaine 2** | Développement du back-end Django, création des modèles, API REST |
| **Semaine 3** | Développement du front-end React, intégration carte, formulaire, API |
| **Semaine 4** | Tests, correction, documentation, préparation de la soutenance |

### Livrables :
- Code source (frontend + backend)
- Documentation technique (PDF)
- Diaporama + démonstration pour la soutenance

---

## 8. Méthodologie de travail

- **Versionnage** avec Git (GitHub, branches, pull requests)
- **Répartition claire des rôles** : frontend, backend, intégration
- **Meeting** via Discord
- **Documentation partagée** sur Drive