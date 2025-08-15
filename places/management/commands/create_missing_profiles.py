from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from places.models import UserProfile


class Command(BaseCommand):
    help = 'Crée automatiquement les profils utilisateurs manquants avec score_total initialisé à 0'

    def handle(self, *args, **options):
        self.stdout.write('🔧 Création des profils utilisateurs manquants...')
        
        count_created = 0
        count_existing = 0
        
        for user in User.objects.all():
            try:
                # Vérifier si l'utilisateur a déjà un profil
                profile = UserProfile.objects.get(utilisateur=user)
                count_existing += 1
                self.stdout.write(f'  ✅ {user.username} a déjà un profil (score: {profile.score_total})')
                
            except UserProfile.DoesNotExist:
                # Créer un nouveau profil
                profile = UserProfile.objects.create(
                    utilisateur=user,
                    bio='Profil créé automatiquement',
                    score_total=0
                )
                count_created += 1
                self.stdout.write(f'  🆕 Profil créé pour {user.username} (score: {profile.score_total})')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🎯 Migration terminée ! {count_created} profils créés, {count_existing} profils existants'
            )
        ) 