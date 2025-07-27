# Modèles de Données - TravelMap

## Vue d'ensemble

Cette documentation décrit les modèles de données de l'application TravelMap. Les modèles sont organisés en **core models** (modèles de base) qui constituent le fondement de l'application.

## Architecture des Modèles

```
User (Django default)
├── voyages (1:N) → Voyage
├── favoris (1:N) → Favori
└── Méthodes utilitaires

Pays
└── lieux (1:N) → Lieu

Lieu
├── voyages (1:N) → Voyage
├── favoris (1:N) → Favori
└── Méthode get_note_moyenne()

Voyage
├── utilisateur (N:1) → User
└── lieu (N:1) → Lieu

Favori
├── utilisateur (N:1) → User
└── lieu (N:1) → Lieu
```

## Modèles Core

### 1. Pays

**Description** : Modèle de référence géographique pour les pays du monde.

**Fichier** : `places/models.py`

```python
class Pays(models.Model):
    code_iso = models.CharField(max_length=3, primary_key=True)
    nom = models.CharField(max_length=100, unique=True)
```

**Champs :**
- **`code_iso`** (CharField, 3 caractères, clé primaire)
  - Code ISO 3166-1 alpha-3 du pays (ex: "FRA", "USA", "JPN")
  - Utilisé comme identifiant unique
- **`nom`** (CharField, 100 caractères, unique)
  - Nom complet du pays (ex: "France", "États-Unis", "Japon")

**Relations :**
- **`lieux`** : Relation inverse vers les lieux de ce pays (1:N)

**Métadonnées :**
- **verbose_name_plural** : "Pays"
- **ordering** : `['nom']` (tri alphabétique)

**Utilisation :**
- Référence géographique pour les lieux
- Affichage sur la carte (pays visités vs non visités)
- Filtrage des lieux par pays
- Statistiques de voyages par pays

**Exemple :**
```python
france = Pays.objects.create(code_iso='FRA', nom='France')
print(france)  # "France"
```

### 2. Lieu

**Description** : Modèle représentant une ville ou un lieu spécifique visitable.

**Fichier** : `places/models.py`

```python
class Lieu(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom_ville = models.CharField(max_length=200)
    pays = models.ForeignKey(Pays, on_delete=models.CASCADE, related_name='lieux')
    geoname_id = models.IntegerField(unique=True, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    date_creation = models.DateTimeField(auto_now_add=True)
```

**Champs :**
- **`id`** (UUIDField, clé primaire)
  - Identifiant unique auto-généré
  - Format UUID v4
- **`nom_ville`** (CharField, 200 caractères)
  - Nom de la ville ou du lieu (ex: "Paris", "New York")
- **`pays`** (ForeignKey vers Pays)
  - Pays auquel appartient le lieu
  - Relation CASCADE (suppression du pays supprime les lieux)
- **`geoname_id`** (IntegerField, unique, nullable)
  - Identifiant GeoNames pour l'intégration avec l'API externe
  - Optionnel, peut être null
- **`latitude`** (DecimalField, 9 chiffres, 6 décimales)
  - Latitude géographique (-90 à 90)
  - Validation automatique
- **`longitude`** (DecimalField, 9 chiffres, 6 décimales)
  - Longitude géographique (-180 à 180)
  - Validation automatique
- **`date_creation`** (DateTimeField, auto_now_add)
  - Date et heure de création automatique

**Relations :**
- **`pays`** : Pays auquel appartient le lieu (N:1)
- **`voyages`** : Voyages effectués dans ce lieu (1:N)
- **`favoris`** : Utilisateurs ayant ce lieu en favori (1:N)

**Métadonnées :**
- **verbose_name_plural** : "Lieux"
- **unique_together** : `['nom_ville', 'pays']` (pas de doublon ville/pays)
- **ordering** : `['nom_ville']` (tri alphabétique)

**Méthodes :**
- **`clean()`** : Validation des coordonnées géographiques
- **`get_note_moyenne()`** : Calcule la note moyenne des voyages

**Validation :**
- Latitude : -90 à 90
- Longitude : -180 à 180
- Nom ville + pays : unique

**Exemple :**
```python
paris = Lieu.objects.create(
    nom_ville='Paris',
    pays=france,
    geoname_id=2988507,
    latitude=48.8566,
    longitude=2.3522
)
print(paris)  # "Paris, France"
print(paris.get_note_moyenne())  # 5.0
```

### 3. Voyage

**Description** : Modèle enregistrant une visite d'un lieu par un utilisateur.

**Fichier** : `places/models.py`

```python
class Voyage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voyages')
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, related_name='voyages')
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    note = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    commentaire = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
```

**Champs :**
- **`id`** (UUIDField, clé primaire)
  - Identifiant unique auto-généré
- **`utilisateur`** (ForeignKey vers User)
  - Utilisateur qui a effectué le voyage
  - Relation CASCADE
- **`lieu`** (ForeignKey vers Lieu)
  - Lieu visité
  - Relation CASCADE
- **`date_debut`** (DateField)
  - Date de début du voyage (obligatoire)
- **`date_fin`** (DateField, nullable)
  - Date de fin du voyage (optionnelle)
  - Permet les voyages d'une journée
- **`note`** (IntegerField, 1-5, nullable)
  - Note donnée par l'utilisateur (1 à 5 étoiles)
  - Optionnelle
- **`commentaire`** (TextField, blank)
  - Commentaire libre de l'utilisateur
  - Optionnel
- **`date_creation`** (DateTimeField, auto_now_add)
  - Date et heure de création automatique

**Relations :**
- **`utilisateur`** : Utilisateur qui a effectué le voyage (N:1)
- **`lieu`** : Lieu visité (N:1)

**Métadonnées :**
- **verbose_name_plural** : "Voyages"
- **ordering** : `['-date_debut']` (tri par date décroissante)

**Méthodes :**
- **`clean()`** : Validation des dates (date_fin >= date_debut)

**Validation :**
- Note : 1 à 5 étoiles
- Date fin >= date début
- Utilisateur et lieu obligatoires

**Exemple :**
```python
voyage = Voyage.objects.create(
    utilisateur=user,
    lieu=paris,
    date_debut=date(2024, 6, 15),
    date_fin=date(2024, 6, 20),
    note=5,
    commentaire="Super voyage à Paris !"
)
print(voyage)  # "user@example.com - Paris"
```

### 4. Favori

**Description** : Modèle représentant les lieux marqués comme favoris par un utilisateur.

**Fichier** : `places/models.py`

```python
class Favori(models.Model):
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoris')
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, related_name='favoris')
    date_ajout = models.DateTimeField(auto_now_add=True)
```

**Champs :**
- **`id`** (BigAutoField, clé primaire)
  - Identifiant unique auto-incrémenté
- **`utilisateur`** (ForeignKey vers User)
  - Utilisateur qui a ajouté le favori
  - Relation CASCADE
- **`lieu`** (ForeignKey vers Lieu)
  - Lieu ajouté aux favoris
  - Relation CASCADE
- **`date_ajout`** (DateTimeField, auto_now_add)
  - Date et heure d'ajout automatique

**Relations :**
- **`utilisateur`** : Utilisateur propriétaire du favori (N:1)
- **`lieu`** : Lieu favori (N:1)

**Métadonnées :**
- **verbose_name_plural** : "Favoris"
- **unique_together** : `['utilisateur', 'lieu']` (pas de doublon)
- **ordering** : `['-date_ajout']` (tri par date d'ajout décroissante)

**Validation :**
- Un utilisateur ne peut pas avoir le même lieu en favori plusieurs fois
- Utilisateur et lieu obligatoires

**Exemple :**
```python
favori = Favori.objects.create(utilisateur=user, lieu=paris)
print(favori)  # "user@example.com - Paris"
```

## Méthodes Utilitaires (User)

### Extension du modèle User Django

Le modèle User Django par défaut est étendu avec des méthodes utilitaires pour faciliter les requêtes courantes.

**Fichier** : `places/models.py`

```python
# Méthodes utilitaires pour User
def get_lieux_visites(self):
    """Retourne les lieux visités par l'utilisateur"""
    return Lieu.objects.filter(voyages__utilisateur=self).distinct()

def get_pays_visites(self):
    """Retourne les pays visités par l'utilisateur"""
    return Pays.objects.filter(lieux__voyages__utilisateur=self).distinct()

def get_score_total(self):
    """Calcule le score total de l'utilisateur basé sur ses voyages"""
    voyages_notes = self.voyages.exclude(note__isnull=True)
    if voyages_notes.exists():
        return voyages_notes.aggregate(models.Sum('note'))['note__sum'] or 0
    return 0
```

**Méthodes ajoutées :**

1. **`get_lieux_visites()`**
   - **Retour** : QuerySet des lieux visités
   - **Logique** : Lieux ayant au moins un voyage de l'utilisateur
   - **Utilisation** : Affichage des lieux visités sur la carte

2. **`get_pays_visites()`**
   - **Retour** : QuerySet des pays visités
   - **Logique** : Pays ayant des lieux visités par l'utilisateur
   - **Utilisation** : Affichage des pays visités sur la carte

3. **`get_score_total()`**
   - **Retour** : Integer (score total)
   - **Logique** : Somme des notes de tous les voyages
   - **Utilisation** : Gamification et classements

**Exemple d'utilisation :**
```python
user = User.objects.first()
lieux_visites = user.get_lieux_visites()
pays_visites = user.get_pays_visites()
score = user.get_score_total()

print(f"Lieux visités: {lieux_visites.count()}")
print(f"Pays visités: {pays_visites.count()}")
print(f"Score total: {score}")
```

## Logique Métier

### Calcul des Lieux/Pays Visités

- **Lieu visité** = Existe au moins un voyage pour ce lieu
- **Pays visité** = Existe au moins un voyage dans un lieu de ce pays
- **Pas besoin de table séparée** "Lieux Visités" car calculable via voyages

### Gestion des Notes

- **Note sur voyage** : Note individuelle donnée par l'utilisateur
- **Note moyenne lieu** : Moyenne calculée à partir des voyages
- **Score utilisateur** : Somme de toutes les notes données

### Relations et Contraintes

1. **Unicité** :
   - Pays : code_iso unique
   - Lieu : nom_ville + pays unique
   - Favori : utilisateur + lieu unique

2. **Intégrité référentielle** :
   - Suppression d'un pays → Suppression des lieux
   - Suppression d'un lieu → Suppression des voyages/favoris
   - Suppression d'un utilisateur → Suppression des voyages/favoris

3. **Validation** :
   - Coordonnées géographiques valides
   - Dates de voyage cohérentes
   - Notes entre 1 et 5

## Migrations

### Migration Initiale

**Fichier** : `places/migrations/0001_initial.py`

```bash
python manage.py makemigrations places
python manage.py migrate
```

**Tables créées :**
- `places_pays`
- `places_lieu`
- `places_voyage`
- `places_favori`

### Index et Contraintes

- **Index automatiques** : Django crée des index sur les clés étrangères
- **Contraintes uniques** : Pays, Lieu (nom+pays), Favori (utilisateur+lieu)
- **Contraintes de validation** : Coordonnées, dates, notes

## Utilisation dans l'API

### Sérialisation

Chaque modèle a ses serializers correspondants :

- **PaysSerializer** : Sérialisation simple
- **LieuSerializer** : Avec pays imbriqué et note moyenne
- **VoyageSerializer** : Avec lieu et utilisateur imbriqués
- **FavoriSerializer** : Avec lieu et utilisateur imbriqués

### Requêtes Courantes

```python
# Lieux visités par un utilisateur
lieux_visites = user.get_lieux_visites()

# Voyages d'un utilisateur
voyages = user.voyages.all()

# Favoris d'un utilisateur
favoris = user.favoris.all()

# Note moyenne d'un lieu
note_moyenne = lieu.get_note_moyenne()

# Pays visités par un utilisateur
pays_visites = user.get_pays_visites()
```

## Évolutions Futures

### Modèles de Contenu (Phase 2)

Les core models sont conçus pour être extensibles vers :

1. **Activite** : Activités proposées dans les lieux
2. **Media** : Photos/vidéos des voyages
3. **Quizz** : Quiz sur les lieux
4. **Score** : Système de gamification avancé

### Optimisations Possibles

1. **Index** : Ajout d'index sur les champs fréquemment recherchés
2. **Cache** : Mise en cache des calculs de notes moyennes
3. **Pagination** : Pagination des listes de voyages/favoris
4. **Soft Delete** : Suppression logique au lieu de physique

## Tests

### Tests de Validation

```python
# Test création pays
france = Pays.objects.create(code_iso='FRA', nom='France')

# Test création lieu
paris = Lieu.objects.create(
    nom_ville='Paris',
    pays=france,
    latitude=48.8566,
    longitude=2.3522
)

# Test création voyage
voyage = Voyage.objects.create(
    utilisateur=user,
    lieu=paris,
    date_debut=date(2024, 6, 15),
    note=5
)

# Test méthodes utilitaires
lieux_visites = user.get_lieux_visites()
score = user.get_score_total()
```

### Tests de Relations

```python
# Vérifier les relations
assert paris.pays == france
assert voyage.lieu == paris
assert voyage.utilisateur == user

# Vérifier les relations inverses
assert france.lieux.count() == 1
assert paris.voyages.count() == 1
assert user.voyages.count() == 1
```

Cette architecture de modèles fournit une base solide et extensible pour l'application TravelMap, permettant une gestion efficace des données géographiques, des voyages utilisateur et des interactions sociales. 