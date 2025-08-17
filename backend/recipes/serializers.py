from rest_framework import serializers
from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "description",
            "ingredients",
            "instructions",
            "cooking_time",
            "created_at",
            "updated_at",
        ]
