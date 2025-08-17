from rest_framework import serializers
from .models import Recipe, Ingredient, Step


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["name", "quantity", "unit"]


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["description", "order"]


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True)
    steps = StepSerializer(many=True)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "description",
            "servings",
            "ingredients",
            "steps",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients")
        steps_data = validated_data.pop("steps")
        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=recipe, **ingredient_data)

        for step_data in steps_data:
            Step.objects.create(recipe=recipe, **step_data)

        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])

        # Update recipe fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Clear existing ingredients and steps
        instance.ingredients.all().delete()
        instance.steps.all().delete()

        # Create new ingredients
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=instance, **ingredient_data)

        # Create new steps
        for i, step_data in enumerate(steps_data, 1):
            Step.objects.create(recipe=instance, order=i, **step_data)

        return instance
