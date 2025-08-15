# Système de Profil Utilisateur - TravelMap

## 🎯 **Vue d'ensemble**

Le système de profil utilisateur permet aux utilisateurs de **personnaliser leur identité** sur TravelMap en ajoutant une biographie, une photo de profil et en gagnant des points. Ces informations sont affichées dans la navbar et sur la page de profil, créant une expérience utilisateur plus personnalisée et engageante.

**🆕 NOUVEAU** : Le système inclut maintenant la possibilité de **consulter les profils publics des autres utilisateurs** depuis les voyages et activités, avec une carte mondiale interactive.

## 👤 **Fonctionnalités du Profil**

### **📝 Biographie**
- **Champ éditable** : Les utilisateurs peuvent écrire une description personnelle
- **Sauvegarde automatique** : Changements sauvegardés en temps réel
- **Affichage public** : Visible par tous les utilisateurs de la plateforme

### **🖼️ Photo de Profil**
- **Upload d'images** : Support des formats JPG, PNG, GIF
- **Gestion des médias** : Stockage sécurisé sur le serveur
- **Affichage global** : Visible dans la navbar sur toutes les pages
- **Image par défaut** : Avatar générique si aucune photo n'est définie
- **🎯 Gestion par utilisateur** : Chaque utilisateur a sa propre image de profil stockée séparément

### **🏆 Système de Score**
- **Points gagnés automatiquement** : +3 points pour création de voyage, +2 points pour création d'activité, +1 point pour notation d'activité
- **Affichage visuel** : Icône 🎯 avec score total dans la page profil
- **Score cumulatif** : Les points s'accumulent sans limite
- **Pas de pénalités** : Seuls les points positifs sont attribués
- **Unicité des actions** : Chaque action unique donne des points (pas de spam)

### **🆕 Profil Public des Autres Utilisateurs**
- **Consultation publique** : Possibilité de voir le profil des autres utilisateurs
- **Navigation intuitive** : Noms d'utilisateur cliquables dans les voyages et activités
- **Carte mondiale interactive** : Visualisation des pays visités par l'utilisateur
- **Statistiques publiques** : Nombre de voyages, activités créées, pays visités
- **Données sécurisées** : Seules les informations publiques sont exposées (pas d'email)

## 🔧 **Comment ça marche**

### **Modifier sa biographie**
1. **Aller sur sa page profil** → Cliquer sur "Profil" dans la navbar
2. **Cliquer sur la biographie** → Le champ devient éditable
3. **Taper le nouveau texte** → Modifier le contenu
4. **Cliquer "Enregistrer"** → La bio est sauvegardée automatiquement
5. **Confirmation** → Message "Bio enregistrée avec succès !"

### **Changer sa photo de profil**
1. **Cliquer sur l'avatar** → Menu déroulant s'ouvre
2. **Choisir "Changer la photo"** → Sélecteur de fichier s'ouvre
3. **Sélectionner une image** → Choisir un fichier depuis l'ordinateur
4. **Upload automatique** → L'image est envoyée au serveur
5. **Confirmation** → Message "Photo de profil enregistrée avec succès !"

### **Supprimer sa photo**
1. **Cliquer sur l'avatar** → Menu déroulant s'ouvre
2. **Choisir "Supprimer la photo"** → Confirmation automatique
3. **Image par défaut** → L'avatar générique est restauré

### **Gagner des points**
- **Créer un voyage** : +3 points automatiquement
- **Créer une activité** : +2 points automatiquement  
- **Noter une activité** : +1 point automatiquement
- **Voir son score** : Affiché dans la page profil avec l'icône 🎯

### **🆕 Consulter le profil d'un autre utilisateur**
1. **Dans un voyage/activité** → Cliquer sur le nom d'utilisateur (souligné en bleu)
2. **Navigation automatique** → Redirection vers la page de profil public
3. **Consultation des informations** : Bio, photo, score, statistiques
4. **Exploration de la carte** : Visualiser les pays visités
5. **Retour facile** → Bouton "Retour" pour revenir à la page précédente

## 🏗️ **Architecture Technique**

### **Backend (Django)**
- **Modèle UserProfile** : Extension du modèle User Django
- **Champs** : `bio` (texte), `profile_image` (fichier), `score_total` (entier), dates de création/modification
- **API REST** : Endpoint `/api/profile/detail/` pour CRUD complet
- **🆕 API Profil Public** : Endpoint `/api/users/{user_id}/profile/` pour consultation des autres utilisateurs
- **Gestion des médias** : Stockage sécurisé dans `/media/profile_images/`
- **Authentification JWT** : Sécurisation des opérations de modification (lecture publique pour les profils)
- **🎯 Système de score** : Intégré dans les serializers des modèles Voyage, Activite et NoteActivite

### **Frontend (React)**
- **State global** : `userProfileImage` synchronisé entre toutes les pages
- **Composant Profile** : Interface d'édition, d'affichage et de score
- **🆕 Composant UserPublicProfile** : Affichage des profils publics avec carte mondiale
- **Navbar** : Affichage permanent de l'image de profil
- **localStorage** : Persistance des données utilisateur avec clés spécifiques par utilisateur
- **🎯 Affichage du score** : Icône 🎯 avec score total dans la section "Informations du compte"
- **🆕 Navigation entre profils** : Système de routage pour passer d'un profil à l'autre

### **Synchronisation des données**
- **Chargement automatique** : Au démarrage de l'application
- **Mise à jour en temps réel** : Changements immédiatement visibles
- **Persistance** : Données conservées après refresh de la page
- **🎯 Gestion silencieuse** : Chargement des images sans messages d'erreur gênants
- **🆕 Cache des profils publics** : Données mises en cache pour améliorer les performances

## 🔒 **Sécurité et Permissions**

### **Authentification requise**
- **Modifications de profil** nécessitent un token JWT valide
- **🆕 Consultation des profils publics** : Aucune authentification requise
- **Vérification automatique** de l'identité de l'utilisateur pour les modifications
- **Protection des données** : Chaque utilisateur ne peut modifier que son propre profil

### **Validation des fichiers**
- **Types acceptés** : Images uniquement (JPG, PNG, GIF)
- **Taille limitée** : Contrôle de la taille des fichiers uploadés
- **Stockage sécurisé** : Fichiers isolés dans des dossiers dédiés

### **🎯 Protection du système de score**
- **Vérification des actions** : Seules les actions valides donnent des points
- **Prévention du spam** : Chaque action unique ne donne des points qu'une seule fois
- **Validation métier** : Points attribués uniquement après validation des données

### **🆕 Sécurité des profils publics**
- **Données exposées** : Seulement nom, prénom, bio, photo, score, statistiques
- **Données protégées** : Email, informations personnelles non exposées
- **Validation des IDs** : Vérification de l'existence de l'utilisateur avant affichage

## 📱 **Expérience Utilisateur**

### **Interface intuitive**
- **Édition en place** : Cliquer pour modifier, boutons d'action clairs
- **Feedback immédiat** : Messages de confirmation pour chaque action
- **États de chargement** : Indicateurs visuels pendant les opérations
- **🎯 Score visible** : Affichage clair du score total avec icônes attrayantes

### **Navigation fluide**
- **Image visible partout** : Avatar affiché dans la navbar sur toutes les pages
- **Accès rapide** : Menu profil accessible depuis n'importe quelle page
- **Cohérence visuelle** : Même image affichée partout dans l'application
- **🎯 Progression visible** : Score mis à jour en temps réel
- **🆕 Navigation entre profils** : Transitions fluides entre profils utilisateurs

### **🆕 Découverte des autres utilisateurs**
- **Noms cliquables** : Identifiants visuels clairs (soulignés en bleu)
- **Carte interactive** : Exploration visuelle des pays visités
- **Statistiques comparatives** : Comparaison facile des activités des utilisateurs
- **Retour intuitif** : Navigation simple vers la page précédente

## 🗺️ **🆕 Carte Mondiale dans les Profils**

### **Fonctionnalités de la carte**
- **Visualisation mondiale** : Vue complète de la Terre avec pays colorés
- **Coloration intelligente** : Rouge pour les pays visités, gris pour les autres
- **Interactivité** : Popups informatifs au clic, effets hover
- **Responsive** : Adaptation automatique aux différentes tailles d'écran
- **Performance optimisée** : Chargement rapide des données géographiques

### **Intégration technique**
- **Composant WorldMap** : Utilise Leaflet.js avec données GeoJSON
- **Sources de données** : Natural Earth Data pour les frontières des pays
- **Synchronisation** : Mise à jour automatique avec les données utilisateur
- **Gestion des erreurs** : Fallback vers des données de base en cas de problème

## 🚀 **Évolutions Futures**

### **Fonctionnalités prévues**
- **Galerie d'images** : Possibilité d'avoir plusieurs photos de profil
- **Personnalisation avancée** : Thèmes de profil, couleurs personnalisées
- **Partage social** : Intégration avec les réseaux sociaux
- **🎯 Système de badges** : Récompenses visuelles pour différents niveaux de score
- **🎯 Classements** : Comparaison des scores entre utilisateurs
- **🎯 Défis** : Objectifs spécifiques pour gagner des points bonus
- **🆕 Interactions entre profils** : Système de suivi, commentaires sur profils
- **🆕 Statistiques avancées** : Graphiques, tendances, comparaisons temporelles

### **Améliorations techniques**
- **Compression d'images** : Optimisation automatique des fichiers uploadés
- **Cache intelligent** : Mise en cache des images pour de meilleures performances
- **Synchronisation cloud** : Sauvegarde automatique des données
- **🎯 Historique des points** : Traçabilité des actions qui ont donné des points
- **🆕 Cache des profils publics** : Stockage local pour améliorer les performances
- **🆕 Synchronisation en temps réel** : Mise à jour automatique des profils consultés

## 💡 **Bonnes Pratiques**

### **Pour les utilisateurs**
- **Choisir des images claires** : Photos de bonne qualité pour un meilleur rendu
- **Biographie concise** : Description courte et personnelle
- **Respect des autres** : Contenu approprié et respectueux
- **🎯 Participer activement** : Créer des voyages et activités pour gagner des points
- **🆕 Découvrir les autres** : Explorer les profils des voyageurs actifs
- **🆕 Partager ses expériences** : Enrichir sa bio avec des anecdotes de voyage

### **Pour les développeurs**
- **Gestion des erreurs** : Toujours prévoir les cas d'échec
- **Validation des données** : Vérifier la validité des entrées utilisateur
- **Performance** : Optimiser le chargement des images et des données
- **🎯 Gestion silencieuse** : Éviter les messages d'erreur lors du chargement automatique
- **🎯 Séparation des responsabilités** : Fonctions distinctes pour chargement et upload
- **🆕 Gestion des profils publics** : Optimiser les requêtes API et la mise en cache
- **🆕 Navigation intuitive** : Assurer une expérience utilisateur fluide entre profils

## 🔍 **Dépannage**

### **Problèmes courants**
- **Image qui ne s'affiche pas** : Vérifier la connexion internet et recharger la page
- **Bio qui ne se sauvegarde pas** : Vérifier que l'utilisateur est bien connecté
- **Upload qui échoue** : Vérifier le format et la taille du fichier
- **🎯 Score qui ne s'affiche pas** : Vérifier que l'utilisateur a des points dans la base de données
- **🆕 Profil public inaccessible** : Vérifier que l'ID utilisateur est valide
- **🆕 Carte mondiale qui ne se charge pas** : Vérifier la connexion internet et les données GeoJSON

### **Solutions**
- **Refresh de la page** : Recharger pour synchroniser les données
- **Reconnexion** : Se déconnecter et se reconnecter si nécessaire
- **Support technique** : Contacter l'équipe en cas de problème persistant
- **🎯 Vérification des actions** : S'assurer que les actions (voyages, activités, notes) sont bien créées
- **🆕 Vérification des IDs** : Contrôler que les identifiants utilisateur sont corrects
- **🆕 Test de la carte** : Vérifier le chargement des données géographiques

### **🎯 Problèmes spécifiques au score**
- **Points manquants** : Vérifier que les actions ont bien été validées par l'API
- **Score incorrect** : Vérifier la cohérence entre les actions et les points attribués
- **Mise à jour différée** : Le score peut prendre quelques secondes à se mettre à jour

### **🆕 Problèmes spécifiques aux profils publics**
- **Navigation bloquée** : Vérifier que les composants ont bien accès aux fonctions de navigation
- **Images de profil manquantes** : Contrôler la construction des URLs d'images
- **Carte non interactive** : Vérifier le chargement des composants Leaflet.js
- **Performance lente** : Optimiser les requêtes API et la mise en cache

---

*Le système de profil utilisateur de TravelMap offre une expérience personnalisée et intuitive, permettant à chaque voyageur de s'exprimer, de partager sa passion pour les voyages, de progresser grâce au système de score gamifié et de découvrir les profils des autres voyageurs avec une carte mondiale interactive.* 