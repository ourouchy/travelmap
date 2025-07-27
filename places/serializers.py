from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Pays, Lieu, Voyage, Favori

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
    pays_code = serializers.CharField(write_only=True, source='pays.code_iso')
    note_moyenne = serializers.SerializerMethodField()
    
    class Meta:
        model = Lieu
        fields = ('id', 'nom_ville', 'pays', 'pays_code', 'geoname_id', 'latitude', 'longitude', 'date_creation', 'note_moyenne')
        read_only_fields = ('id', 'date_creation')
    
    def get_note_moyenne(self, obj):
        """Calcule la note moyenne du lieu"""
        return obj.get_note_moyenne()
    
    def create(self, validated_data):
        """Crée un lieu en utilisant le code pays"""
        pays_code = validated_data.pop('pays_code')
        try:
            pays = Pays.objects.get(code_iso=pays_code)
        except Pays.DoesNotExist:
            raise serializers.ValidationError(f"Pays avec le code {pays_code} n'existe pas")
        
        validated_data['pays'] = pays
        return super().create(validated_data)

class LieuListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des lieux"""
    pays = PaysSerializer(read_only=True)
    
    class Meta:
        model = Lieu
        fields = ('id', 'nom_ville', 'pays', 'latitude', 'longitude')

class VoyageSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Voyage avec lieu et utilisateur imbriqués"""
    lieu = LieuListSerializer(read_only=True)
    lieu_id = serializers.UUIDField(write_only=True)
    utilisateur = UserSerializer(read_only=True)
    
    class Meta:
        model = Voyage
        fields = ('id', 'utilisateur', 'lieu', 'lieu_id', 'date_debut', 'date_fin', 'note', 'commentaire', 'date_creation')
        read_only_fields = ('id', 'utilisateur', 'date_creation')
    
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