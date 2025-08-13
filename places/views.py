from django.http import JsonResponse
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    PaysSerializer, LieuSerializer, LieuListSerializer,
    VoyageSerializer, VoyageCreateSerializer,
    FavoriSerializer, FavoriCreateSerializer, UserStatsSerializer,
    VoyageCreateWithMediaSerializer, ActiviteSerializer, ActiviteListSerializer,
    NoteActiviteSerializer, ActiviteCreateWithMediaSerializer
)
from .models import Pays, Lieu, Voyage, Favori, MediaVoyage, Activite, NoteActivite, MediaActivite

def ping(request):
    return JsonResponse({"message": "pong"})

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Core Models Views

class PaysViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les pays - lecture seule"""
    queryset = Pays.objects.all()
    serializer_class = PaysSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Recherche de pays par nom"""
        query = request.query_params.get('q', '')
        if query:
            pays = Pays.objects.filter(nom__icontains=query)
        else:
            pays = Pays.objects.all()
        
        serializer = self.get_serializer(pays, many=True)
        return Response(serializer.data)

class LieuViewSet(viewsets.ModelViewSet):
    """ViewSet pour les lieux"""
    queryset = Lieu.objects.all()
    serializer_class = LieuSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'list':
            return LieuListSerializer
        return LieuSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Recherche de lieux par nom de ville"""
        query = request.query_params.get('q', '')
        if query:
            lieux = Lieu.objects.filter(
                Q(nom_ville__icontains=query) | 
                Q(pays__nom__icontains=query)
            )
        else:
            lieux = Lieu.objects.all()
        
        serializer = LieuListSerializer(lieux, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def voyages(self, request, pk=None):
        """Récupère les voyages pour un lieu spécifique"""
        lieu = self.get_object()
        voyages = lieu.voyages.all()
        serializer = VoyageSerializer(voyages, many=True)
        return Response(serializer.data)

class VoyageViewSet(viewsets.ModelViewSet):
    """ViewSet pour les voyages"""
    serializer_class = VoyageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne seulement les voyages de l'utilisateur connecté"""
        return Voyage.objects.filter(utilisateur=self.request.user)
    
    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'create':
            return VoyageCreateWithMediaSerializer
        return VoyageSerializer
    
    # Suppression de perform_create car VoyageCreateWithMediaSerializer gère déjà la création
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def detail_public(self, request, pk=None):
        """Récupère les détails publics d'un voyage (accessible à tous)"""
        try:
            voyage = Voyage.objects.get(id=pk)
            serializer = self.get_serializer(voyage)
            return Response(serializer.data)
        except Voyage.DoesNotExist:
            return Response({'error': 'Voyage non trouvé'}, status=status.HTTP_404_NOT_FOUND)

class FavoriViewSet(viewsets.ModelViewSet):
    """ViewSet pour les favoris"""
    serializer_class = FavoriSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne seulement les favoris de l'utilisateur connecté"""
        return Favori.objects.filter(utilisateur=self.request.user)
    
    def perform_create(self, serializer):
        """Crée un favori en assignant l'utilisateur connecté"""
        lieu_id = serializer.validated_data['lieu_id']
        lieu = get_object_or_404(Lieu, id=lieu_id)
        
        # Vérifier si le favori existe déjà
        favori, created = Favori.objects.get_or_create(
            utilisateur=self.request.user,
            lieu=lieu
        )
        return favori
    
    def destroy(self, request, *args, **kwargs):
        """Supprime un favori"""
        favori = self.get_object()
        favori.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserProfileView(APIView):
    """Vue pour le profil utilisateur avec statistiques"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Récupère les statistiques de l'utilisateur connecté"""
        serializer = UserStatsSerializer(request.user)
        return Response(serializer.data)

class LieuDetailView(APIView):
    """Vue détaillée pour un lieu avec ses voyages et favoris"""
    permission_classes = [AllowAny]
    
    def get(self, request, lieu_id):
        """Récupère les détails d'un lieu"""
        try:
            lieu = Lieu.objects.get(id=lieu_id)
        except Lieu.DoesNotExist:
            return Response({'error': 'Lieu non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier si l'utilisateur a ce lieu en favori
        is_favori = False
        if request.user.is_authenticated:
            is_favori = Favori.objects.filter(utilisateur=request.user, lieu=lieu).exists()
        
        # Récupérer TOUS les voyages pour ce lieu (pas seulement ceux de l'utilisateur connecté)
        all_voyages = Voyage.objects.filter(lieu=lieu)
        
        lieu_data = LieuSerializer(lieu).data
        lieu_data['is_favori'] = is_favori
        lieu_data['user_voyages'] = VoyageSerializer(all_voyages, many=True).data
        lieu_data['total_voyages'] = all_voyages.count()
        
        return Response(lieu_data)

class ActiviteViewSet(viewsets.ModelViewSet):
    """ViewSet pour les activités"""
    serializer_class = ActiviteSerializer
    authentication_classes = [JWTAuthentication]  # Forcer l'authentification JWT sur toutes les actions
    
    def get_permissions(self):
        """Permissions différentes selon l'action"""
        if self.action in ['list', 'retrieve', 'notes']:
            # Consultation publique des activités
            permission_classes = [AllowAny]
        else:
            # Création, modification, suppression nécessitent une authentification
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Retourne les activités avec filtrage optionnel par lieu"""
        queryset = Activite.objects.all()
        
        # Filtrer par lieu si le paramètre lieu_id est fourni
        lieu_id = self.request.query_params.get('lieu_id')
        if lieu_id:
            queryset = queryset.filter(lieu_id=lieu_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action in ['list', 'retrieve']:
            return ActiviteListSerializer
        elif self.action == 'create':
            return ActiviteCreateWithMediaSerializer
        return ActiviteSerializer
    
    def get_serializer_context(self):
        """S'assure que le contexte utilisateur est toujours passé"""
        context = super().get_serializer_context()
        # Toujours inclure la requête pour que les serializers puissent accéder à l'utilisateur
        context['request'] = self.request
        
        # Pour les actions publiques, s'assurer que l'utilisateur est bien dans le contexte
        if self.action in ['list', 'retrieve']:
            # Même si l'action est publique, on veut pouvoir vérifier l'utilisateur si il est connecté
            if self.request.user.is_authenticated:
                print(f"🔍 DEBUG ViewSet: Utilisateur authentifié: {self.request.user.username}")
                
                # Debug: vérifier les voyages de l'utilisateur
                lieu_id = self.request.query_params.get('lieu_id')
                if lieu_id:
                    voyages_count = self.request.user.voyages.filter(lieu_id=lieu_id).count()
                    print(f"🔍 DEBUG ViewSet: Utilisateur a {voyages_count} voyages dans ce lieu")
                    
                    # Debug: vérifier le lieu
                    try:
                        lieu = Lieu.objects.get(id=lieu_id)
                        print(f"🔍 DEBUG ViewSet: Lieu demandé: {lieu.nom_ville}, {lieu.pays.nom}")
                    except Lieu.DoesNotExist:
                        print(f"❌ DEBUG ViewSet: Lieu non trouvé")
            else:
                print(f"🔍 DEBUG ViewSet: Utilisateur anonyme")
        
        return context
    
    def perform_create(self, serializer):
        """Crée une activité avec validation des permissions"""
        # La validation est déjà faite dans le serializer
        return serializer.save()
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Récupère toutes les notes d'une activité"""
        activite = self.get_object()
        notes = activite.notes.all()
        serializer = NoteActiviteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def noter(self, request, pk=None):
        """Permet à un utilisateur de noter une activité"""
        activite = self.get_object()
        serializer = NoteActiviteSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoteActiviteViewSet(viewsets.ModelViewSet):
    """ViewSet pour les notes d'activités"""
    serializer_class = NoteActiviteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne seulement les notes de l'utilisateur connecté"""
        return NoteActivite.objects.filter(utilisateur=self.request.user)
    
    def perform_create(self, serializer):
        """Crée une note avec validation des permissions"""
        return serializer.save()
    
    def perform_update(self, serializer):
        """Met à jour une note (seulement le commentaire)"""
        return serializer.save()
    
    def perform_destroy(self, instance):
        """Supprime une note"""
        instance.delete()

class SearchView(APIView):
    """Vue pour la recherche globale"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Recherche dans les lieux et pays"""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Paramètre de recherche requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Recherche dans les lieux
        lieux = Lieu.objects.filter(
            Q(nom_ville__icontains=query) | 
            Q(pays__nom__icontains=query)
        )[:10]  # Limiter à 10 résultats
        
        # Recherche dans les pays
        pays = Pays.objects.filter(nom__icontains=query)[:5]
        
        return Response({
            'lieux': LieuListSerializer(lieux, many=True).data,
            'pays': PaysSerializer(pays, many=True).data
        })
