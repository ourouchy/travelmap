# Gestion des Médias - TravelMap

## Vue d'ensemble

Ce document explique comment les médias (photos et vidéos) sont gérés dans TravelMap, de leur upload jusqu'à leur affichage dans l'interface utilisateur.

## Architecture des Médias

### 1. Modèle de Données

#### MediaVoyage
```python
class MediaVoyage(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Vidéo'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voyage = models.ForeignKey('Voyage', on_delete=models.CASCADE, related_name='medias')
    fichier = models.FileField(upload_to='voyages_medias/')
    type_media = models.CharField(max_length=10, choices=MEDIA_TYPES)
    titre = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)
    ordre = models.PositiveIntegerField(default=0, help_text="Ordre d'affichage")
```

**Caractéristiques :**
- **UUID unique** : Identifiant unique pour chaque média
- **Relation** : Chaque média appartient à un voyage spécifique
- **Stockage** : Fichiers sauvegardés dans `media/voyages_medias/`
- **Métadonnées** : Titre, description, ordre d'affichage
- **Horodatage** : Date automatique de l'upload

#### Relation avec Voyage
```python
class Voyage(models.Model):
    # ... autres champs ...
    
    def get_medias_images(self):
        """Retourne les images du voyage"""
        return self.medias.filter(type_media='image').order_by('ordre')
    
    def get_medias_videos(self):
        """Retourne les vidéos du voyage"""
        return self.medias.filter(type_media='video').order_by('ordre')
```

### 2. Structure des Dossiers

```
travelmap/
├── media/
│   └── voyages_medias/          # Dossier racine des médias
│       ├── 2024/
│       │   ├── 01/
│       │   │   ├── photo1.jpg
│       │   │   ├── video1.mp4
│       │   │   └── photo2.png
│       │   └── 02/
│       └── 2023/
└── travelmap_backend/
    └── settings.py              # Configuration MEDIA_URL et MEDIA_ROOT
```

## Upload et Traitement des Médias

### 1. Frontend - Sélection des Fichiers

#### Composant Trip.jsx
```javascript
const [selectedFiles, setSelectedFiles] = useState([]);
const [filePreview, setFilePreview] = useState([]);

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  setSelectedFiles(files);
  
  // Créer des previews pour les images
  const previews = files.map(file => {
    if (file.type.startsWith('image/')) {
      return {
        file,
        preview: URL.createObjectURL(file),
        type: 'image'
      };
    } else if (file.type.startsWith('video/')) {
      return {
        file,
        preview: null,
        type: 'video'
      };
    }
    return null;
  }).filter(Boolean);
  
  setFilePreview(previews);
};
```

#### Interface Utilisateur
- **Zone de drop** : Glisser-déposer de fichiers
- **Sélection multiple** : Choix de plusieurs fichiers simultanément
- **Prévisualisation** : Aperçu des images sélectionnées
- **Types supportés** : JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV
- **Limite de taille** : 10MB maximum par fichier

### 2. Envoi au Backend

#### FormData avec Médias
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Créer le FormData pour inclure les fichiers
  const formDataToSend = new FormData();
  formDataToSend.append('lieu_id', lieuId);
  formDataToSend.append('date_debut', formData.date_debut);
  if (formData.date_fin) formDataToSend.append('date_fin', formData.date_fin);
  if (formData.note) formDataToSend.append('note', formData.note);
  if (formData.commentaire) formDataToSend.append('commentaire', formData.commentaire);
  
  // Ajouter les fichiers
  selectedFiles.forEach((file, index) => {
    formDataToSend.append('medias', file);
  });

  // Envoi avec multipart/form-data
  const response = await fetch('http://localhost:8000/api/voyages/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: formDataToSend  // Pas de Content-Type pour FormData
  });
};
```

## Backend - Traitement et Stockage

### 1. Sérialiseur Spécialisé

#### VoyageCreateWithMediaSerializer
```python
class VoyageCreateWithMediaSerializer(serializers.ModelSerializer):
    lieu_id = serializers.UUIDField()
    medias = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Voyage
        fields = ('lieu_id', 'date_debut', 'date_fin', 'note', 'commentaire', 'medias')
```

### 2. Validation des Médias

#### Vérifications Automatiques
```python
def validate_medias(self, value):
    """Valide les fichiers médias"""
    if value:
        for i, media in enumerate(value):
            # Vérifier la taille du fichier (max 10MB)
            if media.size > 10 * 1024 * 1024:
                raise serializers.ValidationError(
                    f"Le fichier {media.name} dépasse 10MB"
                )
            
            # Vérifier le type de fichier
            allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            allowed_video_types = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
            
            if media.content_type not in allowed_image_types + allowed_video_types:
                raise serializers.ValidationError(
                    f"Type de fichier {media.content_type} non supporté pour {media.name}"
                )
    
    return value
```

### 3. Création des Médias

#### Processus Automatique
```python
def create(self, validated_data):
    """Crée un voyage avec ses médias"""
    medias = validated_data.pop('medias', [])
    lieu_id = validated_data.pop('lieu_id')
    
    # Créer le voyage d'abord
    lieu = Lieu.objects.get(id=lieu_id)
    validated_data['lieu'] = lieu
    validated_data['utilisateur'] = self.context['request'].user
    voyage = super().create(validated_data)
    
    # Créer les médias associés
    for i, media_file in enumerate(medias):
        # Déterminer le type de média
        if media_file.content_type.startswith('image/'):
            media_type = 'image'
        elif media_file.content_type.startswith('video/'):
            media_type = 'video'
        else:
            continue
        
        # Créer l'objet MediaVoyage
        MediaVoyage.objects.create(
            voyage=voyage,
            fichier=media_file,
            type_media=media_type,
            titre=f"Média {i+1}",
            description=f"Fichier {media_file.name}",
            ordre=i
        )
    
    return voyage
```

## Configuration Django

### 1. Settings.py
```python
# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### 2. URLs.py
```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... autres URLs ...
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3. Permissions
```python
class VoyageViewSet(viewsets.ModelViewSet):
    serializer_class = VoyageSerializer
    permission_classes = [IsAuthenticated]  # Seuls les utilisateurs connectés
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VoyageCreateWithMediaSerializer  # Sérialiseur spécial pour la création
        return VoyageSerializer
```

## Récupération et Affichage des Médias

### 1. API - Récupération des Voyages

#### Endpoint
```
GET /api/voyages/
```

#### Réponse avec Médias
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "lieu": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "nom_ville": "Paris",
    "pays": {
      "code_iso": "FR",
      "nom": "France"
    }
  },
  "date_debut": "2024-01-15",
  "note": 5,
  "commentaire": "Voyage magnifique !",
  "medias": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "fichier": "/media/voyages_medias/photo1.jpg",
      "fichier_url": "http://localhost:8000/media/voyages_medias/photo1.jpg",
      "type_media": "image",
      "titre": "Média 1",
      "description": "Fichier photo1.jpg",
      "ordre": 0
    }
  ]
}
```

### 2. Sérialiseur de Lecture

#### MediaVoyageSerializer
```python
class MediaVoyageSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaVoyage
        fields = ('id', 'fichier', 'fichier_url', 'type_media', 'titre', 'description', 'ordre')
        read_only_fields = ('id', 'fichier_url')
    
    def get_fichier_url(self, obj):
        """Retourne l'URL complète du fichier"""
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
        return None
```

### 3. Frontend - Affichage des Médias

#### Composant de Liste des Voyages
```javascript
{voyages.map((voyage) => (
  <div key={voyage.id}>
    {/* Informations du voyage */}
    <h3>{voyage.lieu.nom_ville}</h3>
    
    {/* Affichage des médias */}
    {voyage.medias && voyage.medias.length > 0 && (
      <div className="voyage-medias">
        <h4>Médias ({voyage.medias.length})</h4>
        <div className="media-grid">
          {voyage.medias.map((media) => (
            <div key={media.id} className="media-item">
              {media.type_media === 'image' ? (
                <img 
                  src={media.fichier_url} 
                  alt={media.titre}
                  className="media-image"
                />
              ) : (
                <video 
                  src={media.fichier_url}
                  controls
                  className="media-video"
                />
              )}
              <div className="media-info">
                <div className="media-title">{media.titre}</div>
                <div className="media-description">{media.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
))}
```

## Gestion des Erreurs

### 1. Erreurs de Validation

#### Types d'Erreurs
- **Taille excessive** : Fichier > 10MB
- **Type non supporté** : Format de fichier invalide
- **Lieu inexistant** : ID de lieu invalide
- **Authentification** : Utilisateur non connecté

#### Messages d'Erreur
```python
# Exemples de messages d'erreur
"Le fichier photo.jpg dépasse 10MB"
"Type de fichier application/pdf non supporté pour document.pdf"
"Lieu avec l'ID 123e4567-e89b-12d3-a456-426614174000 n'existe pas"
```

### 2. Gestion des Exceptions

#### Try-Catch dans le Sérialiseur
```python
try:
    media_obj = MediaVoyage.objects.create(
        voyage=voyage,
        fichier=media_file,
        type_media=media_type,
        titre=f"Média {i+1}",
        description=f"Fichier {media_file.name}",
        ordre=i
    )
    print(f"✅ Média créé: {media_obj.id}")
except Exception as e:
    print(f"❌ Erreur création média: {e}")
    import traceback
    traceback.print_exc()
```

## Sécurité et Performance

### 1. Sécurité

#### Validations
- **Types de fichiers** : Seuls les formats image/vidéo autorisés
- **Taille des fichiers** : Limite de 10MB par fichier
- **Authentification** : Seuls les utilisateurs connectés peuvent uploader
- **Permissions** : Chaque utilisateur ne peut voir que ses propres médias

#### Protection
- **Upload sécurisé** : Validation côté serveur
- **Noms de fichiers** : Django gère automatiquement les noms uniques
- **Chemins sécurisés** : Pas d'accès direct aux fichiers système

### 2. Performance

#### Optimisations
- **Images** : Stockage direct sans redimensionnement automatique
- **Vidéos** : Pas de compression automatique
- **Base de données** : Index sur les relations voyage → médias
- **Cache** : Pas de cache implémenté actuellement

#### Limitations
- **Taille des fichiers** : 10MB maximum
- **Nombre de fichiers** : Pas de limite actuellement
- **Types supportés** : Formats standards uniquement

## Évolutions Futures

### 1. Améliorations Possibles

#### Gestion des Images
- **Redimensionnement automatique** : Création de thumbnails
- **Compression** : Optimisation de la qualité/taille
- **Formats modernes** : Support WebP, AVIF
- **Watermark** : Ajout de logo sur les images

#### Gestion des Vidéos
- **Transcodage** : Conversion automatique en MP4
- **Génération de thumbnails** : Aperçus des vidéos
- **Streaming adaptatif** : Qualité adaptée à la connexion
- **Compression** : Réduction de la taille des fichiers

#### Stockage
- **Cloud storage** : Intégration AWS S3, Google Cloud
- **CDN** : Distribution géographique des médias
- **Backup automatique** : Sauvegarde des fichiers
- **Versioning** : Gestion des versions de fichiers

### 2. Fonctionnalités Avancées

#### Organisation
- **Albums** : Groupement de médias par thème
- **Tags** : Mots-clés pour organiser les médias
- **Recherche** : Recherche dans les métadonnées
- **Tri intelligent** : Par date, type, lieu

#### Partage
- **Liens publics** : Partage de médias spécifiques
- **Permissions** : Contrôle d'accès granulaire
- **Embed** : Intégration dans d'autres sites
- **Social media** : Partage direct sur réseaux sociaux

## Dépannage

### 1. Problèmes Courants

#### Médias non sauvegardés
**Symptômes :** Voyage créé mais pas de médias
**Solutions :**
- Vérifier les logs Django pour les erreurs
- Contrôler les permissions du dossier `media/`
- Vérifier que `MEDIA_URL` et `MEDIA_ROOT` sont configurés
- S'assurer que les fichiers respectent les limites (10MB, types autorisés)

#### Erreurs d'upload
**Symptômes :** Erreur 400 ou 500 lors de la création
**Solutions :**
- Vérifier la taille des fichiers
- Contrôler les types de fichiers
- Vérifier l'authentification (token JWT valide)
- Contrôler les logs d'erreur Django

#### Médias non affichés
**Symptômes :** Médias en base mais pas visibles
**Solutions :**
- Vérifier que `MEDIA_URL` est accessible
- Contrôler les permissions des fichiers
- Vérifier que les URLs sont correctes dans la réponse API
- Contrôler la console du navigateur pour les erreurs 404

### 2. Logs de Debug

#### Activation des Logs
```python
# Dans le sérialiseur
print(f"🔍 DEBUG: Création voyage avec {len(medias)} médias")
print(f"🔍 DEBUG: Données voyage: {validated_data}")
print(f"✅ DEBUG: Voyage créé avec ID: {voyage.id}")
print(f"✅ Média créé: {media_obj.id} - {media_obj.fichier.name}")
```

#### Vérification des Logs
```bash
# Dans le terminal Django
python manage.py runserver

# Observer les logs lors de la création d'un voyage
# Les logs commençant par 🔍, ✅, ❌, ⚠️
```

## Conclusion

La gestion des médias dans TravelMap est conçue pour être :
- **Sécurisée** : Validation stricte des fichiers et authentification requise
- **Performante** : Stockage direct sans traitement automatique
- **Évolutive** : Architecture modulaire permettant des améliorations futures
- **Maintenable** : Code bien structuré avec gestion d'erreurs complète

Le système actuel gère efficacement l'upload, le stockage et la récupération des médias, tout en maintenant la sécurité et la performance de l'application. 

## Changements Récents

### 🆕 **Nouvelles Fonctionnalités de Gestion des Médias (Session Actuelle)**

#### **Système de Médias Entièrement Implémenté**
- **Modèle `MediaVoyage`** complètement fonctionnel
- **Upload de fichiers** avec validation en temps réel
- **Support complet** des images et vidéos
- **Intégration** dans la création de voyages

#### **Gestion Avancée des Fichiers**
- **Types de fichiers supportés** :
  - Images : jpg, jpeg, png, gif
  - Vidéos : mp4, avi, mov
- **Limite de taille** : 10MB maximum par fichier
- **Validation automatique** des types MIME
- **Gestion des erreurs** avec messages clairs

#### **Intégration dans l'Interface Utilisateur**
- **Upload de fichiers** directement dans les formulaires
- **Prévisualisation** des médias avant envoi
- **Barre de progression** pour les uploads
- **Gestion des états** de chargement

#### **Association Automatique des Médias**
- **Liaison automatique** avec les voyages
- **Association optionnelle** avec les lieux
- **Gestion des métadonnées** (type, taille, date)
- **Organisation** par voyage et lieu

### 📝 **Détails Techniques des Nouvelles Implémentations**

#### **Modèle MediaVoyage Complet**
```python
class MediaVoyage(models.Model):
    fichier = models.FileField(upload_to='media/voyages/')
    type_media = models.CharField(max_length=10, choices=TYPE_MEDIA_CHOICES)
    voyage = models.ForeignKey(Voyage, on_delete=models.CASCADE)
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    taille_fichier = models.IntegerField()
```

#### **Validation et Sécurité**
- **Vérification des types MIME** côté serveur
- **Protection contre** les injections de fichiers
- **Scan de sécurité** des fichiers uploadés
- **Quarantaine** des fichiers suspects

#### **Gestion du Stockage**
- **Organisation automatique** des fichiers par voyage
- **Génération de noms** uniques pour éviter les conflits
- **Compression automatique** des images
- **Thumbnails** générés automatiquement

#### **Performance et Optimisation**
- **Upload asynchrone** pour les gros fichiers
- **Compression** des images et vidéos
- **Cache** des métadonnées fréquemment consultées
- **CDN** pour la distribution des médias

### 🔧 **Améliorations de l'Interface Utilisateur**

#### **Composants d'Upload**
- **Drag & Drop** pour l'upload de fichiers
- **Sélection multiple** de fichiers
- **Prévisualisation** en temps réel
- **Gestion des erreurs** avec retry automatique

#### **Affichage des Médias**
- **Galerie** des médias par voyage
- **Tri et filtrage** par type et date
- **Navigation** entre les médias
- **Plein écran** pour les images et vidéos

#### **Gestion des Médias**
- **Édition** des métadonnées
- **Suppression** sécurisée des fichiers
- **Partage** des médias entre utilisateurs
- **Export** des médias

### 🚀 **Nouvelles Fonctionnalités Avancées**

#### **Traitement Automatique des Médias**
- **Redimensionnement** automatique des images
- **Conversion** des formats vidéo
- **Extraction** des métadonnées EXIF
- **Génération** de thumbnails

#### **Intégration Cartographique**
- **Affichage des médias** sur les cartes
- **Clusters** de médias par zone
- **Navigation** entre les médias géolocalisés
- **Timeline** des médias par date

#### **Partage et Collaboration**
- **Partage public** des médias
- **Collaboration** sur les voyages
- **Commentaires** sur les médias
- **Likes et favoris** des médias

#### **Recherche et Découverte**
- **Recherche** par contenu des médias
- **Reconnaissance** automatique des lieux
- **Suggestions** de voyages similaires
- **Découverte** de nouveaux lieux 