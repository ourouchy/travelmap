# Système d'Activités - TravelMap

## Vue d'ensemble

Le système d'activités permet aux utilisateurs de créer, consulter et noter des activités dans des lieux qu'ils ont visités. Il a été enrichi avec de nouveaux champs et la gestion des médias pour offrir une expérience complète et détaillée.

## Modèles Backend

### Activite (Enrichi)
**Fichier** : `places/models.py`

```python
class Activite(models.Model):
    TYPE_ACTIVITE_CHOICES = [
        ('culture', 'Culture & Patrimoine'),
        ('nature', 'Nature & Plein air'),
        ('gastronomie', 'Gastronomie'),
        ('restauration_rapide', 'Restauration rapide'),
        ('sport', 'Sport & Aventure'),
        ('divertissement', 'Divertissement'),
        ('shopping', 'Shopping'),
        ('bien_etre', 'Bien-être & Spa'),
        ('autre', 'Autre')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=200)
    description = models.TextField()
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, related_name='activites')
    cree_par = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activites_creees')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    # Nouveaux champs pour enrichir les activités
    prix_estime = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    age_minimum = models.PositiveIntegerField(null=True, blank=True)
    type_activite = models.CharField(max_length=20, choices=TYPE_ACTIVITE_CHOICES, default='autre')
    adresse_precise = models.CharField(max_length=500, blank=True)
    transport_public = models.BooleanField(default=False)
    reservation_requise = models.BooleanField(default=False)
```

**Champs de base :**
- **`titre`** (CharField, 200 caractères) : Titre de l'activité
- **`description`** (TextField) : Description détaillée
- **`lieu`** (ForeignKey Lieu) : Lieu de l'activité
- **`cree_par`** (ForeignKey User) : Créateur de l'activité
- **`date_creation`** (DateTimeField) : Date de création automatique

**Nouveaux champs enrichis :**
- **`prix_estime`** (DecimalField, 8.2) : Prix estimé en euros (optionnel)
- **`age_minimum`** (PositiveIntegerField) : Âge minimum requis, 0 = "Tous âges"
- **`type_activite`** (CharField, choices) : Catégorie de l'activité
- **`adresse_precise`** (CharField, 500) : Adresse détaillée (optionnel)
- **`transport_public`** (BooleanField) : Accessible en transport en commun
- **`reservation_requise`** (BooleanField) : Réservation obligatoire

**Méthodes utilitaires :**
- **`get_medias_images()`** : Retourne les images de l'activité
- **`get_medias_videos()`** : Retourne les vidéos de l'activité
- **`get_prix_display()`** : Retourne le prix formaté (ex: "15.50 €")
- **`get_type_activite_display()`** : Retourne le nom lisible du type

### MediaActivite (NOUVEAU)
**Fichier** : `places/models.py`

```python
class MediaActivite(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Vidéo'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activite = models.ForeignKey('Activite', on_delete=models.CASCADE, related_name='medias')
    fichier = models.FileField(upload_to='activites_medias/')
    type_media = models.CharField(max_length=10, choices=MEDIA_TYPES)
    titre = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)
    ordre = models.PositiveIntegerField(default=0)
```

**Champs :**
- **`activite`** (ForeignKey Activite) : Activité associée
- **`fichier`** (FileField) : Fichier média (max 10MB)
- **`type_media`** (CharField) : Type (image/vidéo)
- **`titre`** (CharField) : Titre optionnel du média
- **`description`** (TextField) : Description optionnelle
- **`ordre`** (PositiveIntegerField) : Ordre d'affichage

**Validation :**
- **Taille** : Maximum 10MB par fichier
- **Types supportés** : JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV
- **Upload** : Dossier `activites_medias/` automatique

### NoteActivite
**Fichier** : `places/models.py`

```python
class NoteActivite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activite = models.ForeignKey(Activite, on_delete=models.CASCADE, related_name='notes')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes_activites')
    note = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
```

**Champs :**
- **`activite`** (ForeignKey Activite) : Activité notée
- **`utilisateur`** (ForeignKey User) : Utilisateur qui note
- **`note`** (IntegerField, 1-5) : Note de 1 à 5 étoiles
- **`commentaire`** (TextField) : Commentaire optionnel
- **`date_creation`** (DateTimeField) : Date de création

## API Endpoints

### Activités
- **`GET /api/activites/`** - Liste des activités (avec filtrage par `lieu_id`)
- **`GET /api/activites/{id}/`** - Détail d'une activité
- **`POST /api/activites/`** - Créer une activité avec médias (authentifié)
- **`PUT /api/activites/{id}/`** - Modifier une activité (créateur)
- **`DELETE /api/activites/{id}/`** - Supprimer une activité (créateur)

### Notes
- **`GET /api/notes-activites/`** - Notes de l'utilisateur connecté
- **`POST /api/notes-activites/`** - Créer une note (authentifié)

## Logique Métier

### Conditions pour noter une activité
1. **Utilisateur authentifié**
2. **N'est pas le créateur** de l'activité
3. **A visité le lieu** (voyage enregistré)
4. **N'a pas déjà noté** cette activité

### Conditions pour créer une activité
1. **Utilisateur authentifié**
2. **A visité le lieu** (voyage enregistré)
3. **Titre et description** obligatoires

### Validation des permissions
- **Lecture** : Publique (avec authentification JWT pour `can_rate`)
- **Création/Modification** : Utilisateur authentifié ayant visité le lieu
- **Suppression** : Créateur de l'activité

## Sérialisation

### ActiviteSerializer (détail complet)
**Fichier** : `places/serializers.py`

```python
class ActiviteSerializer(serializers.ModelSerializer):
    lieu = LieuListSerializer(read_only=True)
    lieu_id = serializers.UUIDField(write_only=True)
    cree_par = UserSerializer(read_only=True)
    notes = serializers.SerializerMethodField()
    note_moyenne = serializers.SerializerMethodField()
    nombre_notes = serializers.SerializerMethodField()
    can_rate = serializers.SerializerMethodField()
    medias = serializers.SerializerMethodField()
    prix_display = serializers.SerializerMethodField()
    type_activite_display = serializers.SerializerMethodField()
```

**Champs calculés :**
- **`medias`** : Médias de l'activité (limités à 10)
- **`prix_display`** : Prix formaté avec devise
- **`type_activite_display`** : Nom lisible du type
- **`can_rate`** : Vérification des permissions de notation

### ActiviteCreateWithMediaSerializer (création avec médias)
**Fichier** : `places/serializers.py`

```python
class ActiviteCreateWithMediaSerializer(serializers.ModelSerializer):
    lieu_id = serializers.UUIDField()
    medias = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )
```

**Fonctionnalités :**
- **Validation des médias** : Taille, type, format
- **Création automatique** des objets MediaActivite
- **Gestion des erreurs** avec logs détaillés
- **Upload vers** `activites_medias/`

### MediaActiviteSerializer
**Fichier** : `places/serializers.py`

```python
class MediaActiviteSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()
    
    def get_fichier_url(self, obj):
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
        return None
```

**Fonctionnalités :**
- **URL absolue** construite avec le contexte request
- **Sérialisation complète** des métadonnées
- **Support des types** image et vidéo

## Frontend

### Composants Principaux

#### Activites.jsx
**Fichier** : `travelmap-frontend/src/Activites.jsx`

**Fonctionnalités :**
- **Formulaire de création** avec tous les nouveaux champs
- **Gestion des médias** : Upload multiple, aperçu des fichiers
- **Formulaire de modification** complet avec tous les champs
- **Affichage des activités** avec détails pratiques
- **Gestion des états** : Création, modification, suppression

**Champs du formulaire :**
- Titre et description (obligatoires)
- Prix estimé (nombre, devise €)
- Âge minimum (nombre, 0 = "Tous âges")
- Type d'activité (select avec 9 choix)
- Adresse précise (texte libre)
- Options pratiques (checkboxes)
- Médias (upload multiple, max 10MB)

#### Lieu.jsx
**Fichier** : `travelmap-frontend/src/Lieu.jsx`

**Fonctionnalités :**
- **Affichage des activités** disponibles dans le lieu
- **Section "Détails pratiques"** pour chaque activité
- **Navigation vers** ActiviteDetail
- **Intégration avec** la carte du lieu

#### ActiviteDetail.jsx
**Fichier** : `travelmap-frontend/src/ActiviteDetail.jsx`

**Fonctionnalités :**
- **Vue détaillée** de l'activité avec tous les champs
- **Section médias** séparée (photos/vidéos)
- **Modal de visualisation** des médias en plein écran
- **Système de notation** avec conditions
- **Affichage des commentaires** et notes

**Gestion des médias :**
- **Séparation automatique** images/vidéos
- **Grille responsive** avec aperçus cliquables
- **Modal plein écran** pour visualisation
- **Contrôles vidéo** intégrés
- **Navigation intuitive** (clic pour fermer)

### Gestion des États

#### États du formulaire de création
```javascript
const [formData, setFormData] = useState({
  titre: '',
  description: '',
  lieu_id: '',
  prix_estime: '',
  age_minimum: '',
  type_activite: 'autre',
  adresse_precise: '',
  transport_public: false,
  reservation_requise: false,
  medias: []
});
```

#### États du formulaire de modification
```javascript
const [editFormData, setEditFormData] = useState({
  titre: '',
  description: '',
  prix_estime: '',
  age_minimum: '',
  type_activite: 'autre',
  adresse_precise: '',
  transport_public: false,
  reservation_requise: false
});
```

### Gestion des Médias

#### Upload des fichiers
```javascript
const handleCreateActivite = async (e) => {
  e.preventDefault();
  
  // Utiliser FormData pour envoyer les fichiers
  const formDataToSend = new FormData();
  formDataToSend.append('titre', formData.titre.trim());
  // ... autres champs
  
  // Ajouter les fichiers médias
  formData.medias.forEach((file, index) => {
    formDataToSend.append('medias', file);
  });
  
  const response = await fetch('http://localhost:8000/api/activites/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Pas de Content-Type pour FormData
    },
    body: formDataToSend
  });
};
```

#### Affichage des médias
```javascript
{/* Section des médias séparée */}
{(activite.medias?.filter(m => m.type_media === 'image').length > 0 || 
  activite.medias?.filter(m => m.type_media === 'video').length > 0) && (
  <div className="medias-section">
    {/* Photos */}
    {activite.medias?.filter(m => m.type_media === 'image').length > 0 && (
      <div className="photos-section">
        <h3>Photos ({activite.medias.filter(m => m.type_media === 'image').length})</h3>
        {/* Grille d'images cliquables */}
      </div>
    )}
    
    {/* Vidéos */}
    {activite.medias?.filter(m => m.type_media === 'video').length > 0 && (
      <div className="videos-section">
        <h3>Vidéos ({activite.medias.filter(m => m.type_media === 'video').length})</h3>
        {/* Grille de vidéos avec contrôles */}
      </div>
    )}
  </div>
)}
```

## Interface Utilisateur

### Affichage des Détails Pratiques

#### Dans les cartes d'activités
```javascript
{/* Détails pratiques de l'activité */}
<div className="details-pratiques">
  <div className="tags-grid">
    {/* Type d'activité */}
    {activite.type_activite && activite.type_activite !== 'autre' && (
      <div className="tag type-activite">
        🏷️ {activite.type_activite_display}
      </div>
    )}
    
    {/* Prix */}
    {activite.prix_estime && (
      <div className="tag prix">
        💰 {activite.prix_display}
      </div>
    )}
    
    {/* Âge minimum */}
    {activite.age_minimum !== null && activite.age_minimum !== undefined && (
      <div className="tag age">
        👶 {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum}+ ans`}
      </div>
    )}
  </div>
  
  {/* Options pratiques */}
  <div className="options-pratiques">
    {activite.transport_public && (
      <span className="option">🚌 Transport public</span>
    )}
    {activite.reservation_requise && (
      <span className="option">📅 Réservation requise</span>
    )}
  </div>
  
  {/* Adresse précise */}
  {activite.adresse_precise && (
    <div className="adresse">
      📍 {activite.adresse_precise}
    </div>
  )}
</div>
```

#### Dans la page de détail
```javascript
{/* Informations pratiques */}
<div className="informations-pratiques">
  <h3>Informations pratiques</h3>
  <div className="grid-pratiques">
    {/* Type d'activité */}
    {activite.type_activite && activite.type_activite !== 'autre' && (
      <div className="info-item">
        <strong>🏷️ Type :</strong>
        <div className="value">{activite.type_activite_display}</div>
      </div>
    )}
    
    {/* Prix */}
    {activite.prix_estime && (
      <div className="info-item">
        <strong>💰 Prix :</strong>
        <div className="value">{activite.prix_display}</div>
      </div>
    )}
    
    {/* Âge minimum */}
    {activite.age_minimum !== null && activite.age_minimum !== undefined && (
      <div className="info-item">
        <strong>👶 Âge minimum :</strong>
        <div className="value">
          {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum} ans et plus`}
        </div>
      </div>
    )}
  </div>
</div>
```

### Gestion des Médias

#### Modal de visualisation
```javascript
{/* Modal pour afficher les médias en grand */}
{selectedMedia && (
  <div className="media-modal" onClick={closeMediaModal}>
    <div className="modal-content">
      <button className="close-btn" onClick={closeMediaModal}>✕</button>
      
      {selectedMedia.type_media === 'image' ? (
        <img
          src={selectedMedia.fichier_url}
          alt={selectedMedia.titre || 'Image'}
          className="media-fullscreen"
        />
      ) : (
        <video
          src={selectedMedia.fichier_url}
          controls
          autoPlay
          className="media-fullscreen"
        />
      )}
      
      {selectedMedia.titre && (
        <div className="media-title">{selectedMedia.titre}</div>
      )}
    </div>
  </div>
)}
```

## Validation et Sécurité

### Validation côté serveur
- **Taille des fichiers** : Maximum 10MB
- **Types de fichiers** : Formats supportés uniquement
- **Permissions** : Vérification des droits d'accès
- **Données** : Validation des champs obligatoires

### Validation côté client
- **Formulaire** : Vérification avant envoi
- **Fichiers** : Aperçu et validation des types
- **Interface** : Feedback utilisateur en temps réel
- **Navigation** : Protection contre les actions non autorisées

## Performance et Optimisation

### Limitation des données
- **Médias** : Limités à 10 pour le détail, 5 pour la liste
- **Notes** : Limitées à 5 pour la liste, 10 pour le détail
- **Cache** : Utilisation du state React pour éviter rechargements

### Requêtes optimisées
- **Filtrage par lieu** : Endpoint `/api/activites/?lieu_id={id}`
- **Sérialisation** : Champs calculés uniquement si nécessaires
- **Relations** : Chargement optimisé des données liées

## Messages d'interface

### États de notation
- **Peut noter** : Bouton "⭐ Noter cette activité"
- **Déjà noté** : Affichage de la note existante
- **Créateur** : "Vous ne pouvez pas noter votre propre activité"
- **Non visité** : "Vous devez avoir visité ce lieu pour pouvoir noter ses activités"

### Aide utilisateur
- **Âge minimum** : "💡 Mettre 0 pour 'Tous âges'"
- **Médias** : "💡 Formats acceptés : JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)"
- **Prix** : Affichage automatique en euros (€)

## Évolutions Futures

### Fonctionnalités prévues
1. **Géolocalisation** : Position précise des activités sur la carte
2. **Horaires** : Plages d'ouverture et disponibilité
3. **Contact** : Informations de réservation et contact
4. **Avis détaillés** : Photos des utilisateurs, vérifications
5. **Recommandations** : Suggestions basées sur l'historique

### Optimisations techniques
1. **Compression des images** : Redimensionnement automatique
2. **Lazy loading** : Chargement progressif des médias
3. **Cache avancé** : Mise en cache des médias populaires
4. **Pagination** : Gestion des grandes collections d'activités

## Tests et Débogage

### Logs de débogage
```python
# Backend - Création d'activité avec médias
print(f"🔍 DEBUG: Création activité avec {len(medias)} médias")
print(f"🔍 DEBUG: Données activité: {validated_data}")

# Backend - Création des médias
print(f"✅ Média créé: {media_obj.id} - {media_obj.fichier.name}")
print(f"✅ Chemin fichier: {media_obj.fichier.path}")
print(f"✅ URL fichier: {media_obj.fichier.url}")
```

### Vérifications frontend
```javascript
// Vérification des médias reçus
console.log('✅ Activité créée:', activite);
console.log('📸 Médias reçus:', activite.medias);

// Vérification des URLs
console.log('🔗 URL média:', media.fichier_url);
```

## Résumé des Nouvelles Fonctionnalités

### ✅ **Implémenté et Fonctionnel**
1. **Champs enrichis** : Prix, âge, type, adresse, options pratiques
2. **Gestion des médias** : Upload, stockage, affichage, modal
3. **Interface complète** : Création, modification, visualisation
4. **Validation robuste** : Côté client et serveur
5. **Séparation des médias** : Photos et vidéos distinctes
6. **Navigation intuitive** : Modal plein écran, clic pour fermer

### 🎯 **Expérience Utilisateur**
- **Formulaires complets** avec tous les champs
- **Upload de médias** avec aperçu et validation
- **Affichage riche** des détails pratiques
- **Interaction fluide** avec les médias
- **Feedback visuel** pour toutes les actions

### 🚀 **Performance et Robustesse**
- **Validation en temps réel** des données
- **Gestion des erreurs** avec messages clairs
- **Optimisation des requêtes** et de l'affichage
- **Responsive design** pour tous les appareils
- **Sécurité renforcée** avec vérifications des permissions

Le système d'activités est maintenant **complet et production-ready**, offrant une expérience utilisateur riche et intuitive pour la création, la consultation et la notation d'activités enrichies avec médias et détails pratiques. 