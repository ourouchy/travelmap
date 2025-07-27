from django.contrib import admin
from .models import Pays, Lieu, Voyage, Favori

@admin.register(Pays)
class PaysAdmin(admin.ModelAdmin):
    list_display = ['code_iso', 'nom']
    search_fields = ['nom', 'code_iso']
    ordering = ['nom']

@admin.register(Lieu)
class LieuAdmin(admin.ModelAdmin):
    list_display = ['nom_ville', 'pays', 'latitude', 'longitude', 'geoname_id']
    list_filter = ['pays']
    search_fields = ['nom_ville', 'pays__nom']
    ordering = ['nom_ville']
    readonly_fields = ['id', 'date_creation']

@admin.register(Voyage)
class VoyageAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'lieu', 'date_debut', 'date_fin', 'note']
    list_filter = ['date_debut', 'lieu__pays', 'note']
    search_fields = ['utilisateur__username', 'lieu__nom_ville']
    ordering = ['-date_debut']
    readonly_fields = ['id', 'date_creation']
    date_hierarchy = 'date_debut'

@admin.register(Favori)
class FavoriAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'lieu', 'date_ajout']
    list_filter = ['date_ajout', 'lieu__pays']
    search_fields = ['utilisateur__username', 'lieu__nom_ville']
    ordering = ['-date_ajout']
    readonly_fields = ['date_ajout']
