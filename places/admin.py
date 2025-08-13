from django.contrib import admin
from .models import Pays, Lieu, Voyage, Favori, MediaVoyage, Activite, NoteActivite

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

@admin.register(Activite)
class ActiviteAdmin(admin.ModelAdmin):
    list_display = ('titre', 'lieu', 'cree_par', 'date_creation', 'note_moyenne', 'nombre_notes')
    list_filter = ('lieu__pays', 'date_creation', 'cree_par')
    search_fields = ('titre', 'description', 'lieu__nom_ville')
    readonly_fields = ('date_creation', 'note_moyenne', 'nombre_notes')
    
    def note_moyenne(self, obj):
        return obj.get_note_moyenne() or "Aucune note"
    note_moyenne.short_description = "Note moyenne"
    
    def nombre_notes(self, obj):
        return obj.get_nombre_notes()
    nombre_notes.short_description = "Nombre de notes"

@admin.register(NoteActivite)
class NoteActiviteAdmin(admin.ModelAdmin):
    list_display = ('activite', 'utilisateur', 'note', 'date_creation')
    list_filter = ('note', 'date_creation', 'activite__lieu')
    search_fields = ('activite__titre', 'utilisateur__username', 'commentaire')
    readonly_fields = ('date_creation',)
