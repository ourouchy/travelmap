from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid

class Pays(models.Model):
    """Country model - Référence géographique pour les lieux"""
    code_iso = models.CharField(max_length=3, primary_key=True)
    nom = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name_plural = "Pays"
        ordering = ['nom']
    
    def __str__(self):
        return self.nom

class Lieu(models.Model):
    """Place/City model - Ville ou lieu spécifique visitable"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom_ville = models.CharField(max_length=200)
    pays = models.ForeignKey(Pays, on_delete=models.CASCADE, related_name='lieux')
    geoname_id = models.IntegerField(unique=True, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Lieux"
        unique_together = ['nom_ville', 'pays']
        ordering = ['nom_ville']
    
    def __str__(self):
        return f"{self.nom_ville}, {self.pays.nom}"
    
    def clean(self):
        """Validation des coordonnées géographiques"""
        if self.latitude < -90 or self.latitude > 90:
            raise ValidationError('Latitude must be between -90 and 90')
        if self.longitude < -180 or self.longitude > 180:
            raise ValidationError('Longitude must be between -180 and 180')
    
    def get_note_moyenne(self):
        """Calcule la note moyenne des voyages pour ce lieu"""
        voyages_notes = self.voyages.exclude(note__isnull=True)
        if voyages_notes.exists():
            return voyages_notes.aggregate(models.Avg('note'))['note__avg']
        return None

class MediaVoyage(models.Model):
    """Media model for voyage images and videos"""
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
    
    class Meta:
        verbose_name = "Média de voyage"
        verbose_name_plural = "Médias de voyage"
        ordering = ['ordre', 'date_upload']
    
    def __str__(self):
        return f"{self.voyage} - {self.get_type_media_display()}"
    
    def get_url(self):
        """Retourne l'URL du fichier"""
        return self.fichier.url if self.fichier else None

class Voyage(models.Model):
    """Trip model - Enregistrement d'une visite d'un lieu par un utilisateur"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voyages')
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, related_name='voyages')
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    note = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Note de 1 à 5"
    )
    commentaire = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Voyages"
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.utilisateur.username} - {self.lieu.nom_ville}"
    
    def clean(self):
        """Validation des dates de voyage"""
        if self.date_fin and self.date_fin < self.date_debut:
            raise ValidationError('La date de fin ne peut pas être antérieure à la date de début')
    
    def get_medias_images(self):
        """Retourne les images du voyage"""
        return self.medias.filter(type_media='image').order_by('ordre')
    
    def get_medias_videos(self):
        """Retourne les vidéos du voyage"""
        return self.medias.filter(type_media='video').order_by('ordre')

class Favori(models.Model):
    """Favorite place model - Lieux marqués comme favoris par l'utilisateur"""
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoris')
    lieu = models.ForeignKey(Lieu, on_delete=models.CASCADE, related_name='favoris')
    date_ajout = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Favoris"
        unique_together = ['utilisateur', 'lieu']
        ordering = ['-date_ajout']
    
    def __str__(self):
        return f"{self.utilisateur.username} - {self.lieu.nom_ville}"

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

# Ajout des méthodes au modèle User
User.add_to_class('get_lieux_visites', get_lieux_visites)
User.add_to_class('get_pays_visites', get_pays_visites)
User.add_to_class('get_score_total', get_score_total)
