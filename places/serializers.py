from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Pays, Lieu, Voyage, Favori, MediaVoyage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)

# Core Models Serializers

class PaysSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Pays"""
    class Meta:
        model = Pays
        fields = ('code_iso', 'nom')

class LieuSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Lieu avec pays imbriqué"""
    pays = PaysSerializer(read_only=True)
    pays_code = serializers.CharField(write_only=True)  # Supprimé source='pays.code_iso'
    note_moyenne = serializers.SerializerMethodField()
    
    class Meta:
        model = Lieu
        fields = ('id', 'nom_ville', 'pays', 'pays_code', 'geoname_id', 'latitude', 'longitude', 'date_creation', 'note_moyenne')
        read_only_fields = ('id', 'date_creation')
    
    def get_note_moyenne(self, obj):
        """Calcule la note moyenne du lieu"""
        return obj.get_note_moyenne()
    
    def create(self, validated_data):
        """Crée un lieu en utilisant le code pays, et crée le pays s'il n'existe pas"""
        pays_code = validated_data.pop('pays_code')
        
        # Essayer de récupérer le pays existant, sinon le créer
        try:
            pays = Pays.objects.get(code_iso=pays_code)
        except Pays.DoesNotExist:
            # Créer le pays avec un nom par défaut (sera mis à jour plus tard si nécessaire)
            pays = Pays.objects.create(
                code_iso=pays_code,
                nom=f"Pays {pays_code}"  # Nom temporaire
            )
            print(f"Pays créé automatiquement: {pays_code}")
        
        validated_data['pays'] = pays
        return super().create(validated_data)

class LieuListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des lieux"""
    pays = PaysSerializer(read_only=True)
    
    class Meta:
        model = Lieu
        fields = ('id', 'nom_ville', 'pays', 'latitude', 'longitude')

class MediaVoyageSerializer(serializers.ModelSerializer):
    """Serializer pour les médias de voyage"""
    fichier_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaVoyage
        fields = ('id', 'fichier', 'fichier_url', 'type_media', 'titre', 'description', 'ordre')
        read_only_fields = ('id', 'fichier_url')
    
    def get_fichier_url(self, obj):
        """Retourne l'URL du fichier"""
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
        return None

class VoyageSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Voyage avec lieu et utilisateur imbriqués"""
    lieu = LieuListSerializer(read_only=True)
    lieu_id = serializers.UUIDField(write_only=True)
    utilisateur = UserSerializer(read_only=True)
    medias = MediaVoyageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Voyage
        fields = ('id', 'utilisateur', 'lieu', 'lieu_id', 'date_debut', 'date_fin', 'note', 'commentaire', 'date_creation', 'medias')
        read_only_fields = ('id', 'utilisateur', 'date_creation', 'medias')
    
    def create(self, validated_data):
        """Crée un voyage en assignant automatiquement l'utilisateur connecté"""
        lieu_id = validated_data.pop('lieu_id')
        try:
            lieu = Lieu.objects.get(id=lieu_id)
        except Lieu.DoesNotExist:
            raise serializers.ValidationError(f"Lieu avec l'ID {lieu_id} n'existe pas")
        
        validated_data['lieu'] = lieu
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)

class VoyageCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de voyage (plus simple)"""
    lieu_id = serializers.UUIDField()
    
    class Meta:
        model = Voyage
        fields = ('lieu_id', 'date_debut', 'date_fin', 'note', 'commentaire')
    
    def validate_lieu_id(self, value):
        """Valide que le lieu existe"""
        try:
            Lieu.objects.get(id=value)
        except Lieu.DoesNotExist:
            raise serializers.ValidationError("Ce lieu n'existe pas")
        return value

class VoyageCreateWithMediaSerializer(serializers.ModelSerializer):
    """Serializer pour la création de voyage avec médias"""
    lieu_id = serializers.UUIDField()
    medias = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Voyage
        fields = ('lieu_id', 'date_debut', 'date_fin', 'note', 'commentaire', 'medias')
    
    def validate_lieu_id(self, value):
        """Valide que le lieu existe"""
        try:
            Lieu.objects.get(id=value)
        except Lieu.DoesNotExist:
            raise serializers.ValidationError("Ce lieu n'existe pas")
        return value
    
    def validate_medias(self, value):
        """Valide les fichiers médias"""
        if value:
            print(f"🔍 DEBUG: Validation de {len(value)} médias")
            for i, media in enumerate(value):
                print(f"🔍 DEBUG: Média {i+1}: {media.name} - {media.content_type} - {media.size} bytes")
                
                # Vérifier la taille du fichier (max 10MB)
                if media.size > 10 * 1024 * 1024:
                    raise serializers.ValidationError(f"Le fichier {media.name} dépasse 10MB")
                
                # Vérifier le type de fichier
                allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                allowed_video_types = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
                
                if media.content_type not in allowed_image_types + allowed_video_types:
                    raise serializers.ValidationError(f"Type de fichier {media.content_type} non supporté pour {media.name}")
        
        return value
    
    def create(self, validated_data):
        """Crée un voyage avec ses médias"""
        medias = validated_data.pop('medias', [])
        lieu_id = validated_data.pop('lieu_id')
        
        print(f"🔍 DEBUG: Création voyage avec {len(medias)} médias")
        print(f"🔍 DEBUG: Données voyage: {validated_data}")
        
        try:
            lieu = Lieu.objects.get(id=lieu_id)
            print(f"🔍 DEBUG: Lieu trouvé: {lieu.nom_ville}, {lieu.pays.nom}")
        except Lieu.DoesNotExist:
            raise serializers.ValidationError(f"Lieu avec l'ID {lieu_id} n'existe pas")
        
        validated_data['lieu'] = lieu
        validated_data['utilisateur'] = self.context['request'].user
        
        # Créer le voyage
        voyage = super().create(validated_data)
        print(f"✅ DEBUG: Voyage créé avec ID: {voyage.id}")
        
        # Créer les médias associés
        if medias:
            print(f"🔍 DEBUG: Création de {len(medias)} médias...")
            for i, media_file in enumerate(medias):
                print(f"🔍 DEBUG: Traitement média {i+1}: {media_file.name} ({media_file.content_type})")
                
                # Déterminer le type de média
                if media_file.content_type.startswith('image/'):
                    media_type = 'image'
                elif media_file.content_type.startswith('video/'):
                    media_type = 'video'
                else:
                    print(f"⚠️  Type de média non reconnu: {media_file.content_type}")
                    continue
                
                try:
                    # Créer le média avec plus de détails
                    media_obj = MediaVoyage.objects.create(
                        voyage=voyage,
                        fichier=media_file,
                        type_media=media_type,
                        titre=f"Média {i+1}",
                        description=f"Fichier {media_file.name}",
                        ordre=i
                    )
                    print(f"✅ Média créé: {media_obj.id} - {media_obj.fichier.name} - Type: {media_obj.type_media}")
                    print(f"✅ Chemin fichier: {media_obj.fichier.path}")
                    print(f"✅ URL fichier: {media_obj.fichier.url}")
                except Exception as e:
                    print(f"❌ Erreur création média: {e}")
                    print(f"❌ Type d'erreur: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
        else:
            print("ℹ️  Aucun média à traiter")
        
        return voyage

class FavoriSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Favori"""
    lieu = LieuListSerializer(read_only=True)
    lieu_id = serializers.UUIDField(write_only=True)
    utilisateur = UserSerializer(read_only=True)
    
    class Meta:
        model = Favori
        fields = ('id', 'utilisateur', 'lieu', 'lieu_id', 'date_ajout')
        read_only_fields = ('id', 'utilisateur', 'date_ajout')
    
    def create(self, validated_data):
        """Crée un favori en assignant automatiquement l'utilisateur connecté"""
        lieu_id = validated_data.pop('lieu_id')
        try:
            lieu = Lieu.objects.get(id=lieu_id)
        except Lieu.DoesNotExist:
            raise serializers.ValidationError(f"Lieu avec l'ID {lieu_id} n'existe pas")
        
        validated_data['lieu'] = lieu
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)

class FavoriCreateSerializer(serializers.Serializer):
    """Serializer simple pour ajouter un favori"""
    lieu_id = serializers.UUIDField()
    
    def validate_lieu_id(self, value):
        """Valide que le lieu existe"""
        try:
            Lieu.objects.get(id=value)
        except Lieu.DoesNotExist:
            raise serializers.ValidationError("Ce lieu n'existe pas")
        return value

# Serializers pour les statistiques utilisateur

class UserStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques de l'utilisateur"""
    lieux_visites = serializers.SerializerMethodField()
    pays_visites = serializers.SerializerMethodField()
    score_total = serializers.SerializerMethodField()
    nombre_voyages = serializers.SerializerMethodField()
    nombre_favoris = serializers.SerializerMethodField()
    
    def get_lieux_visites(self, obj):
        """Retourne les lieux visités par l'utilisateur"""
        lieux = obj.get_lieux_visites()
        return LieuListSerializer(lieux, many=True).data
    
    def get_pays_visites(self, obj):
        """Retourne les pays visités par l'utilisateur"""
        pays = obj.get_pays_visites()
        return PaysSerializer(pays, many=True).data
    
    def get_score_total(self, obj):
        """Retourne le score total de l'utilisateur"""
        return obj.get_score_total()
    
    def get_nombre_voyages(self, obj):
        """Retourne le nombre de voyages de l'utilisateur"""
        return obj.voyages.count()
    
    def get_nombre_favoris(self, obj):
        """Retourne le nombre de favoris de l'utilisateur"""
        return obj.favoris.count() 