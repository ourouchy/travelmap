from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.

def ping(request):
    return JsonResponse({"message": "pong"})
