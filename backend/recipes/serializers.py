from rest_framework import serializers
from .models import Recipe, Ingredient, Step, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["name", "quantity", "unit"]


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["description", "order"]


class RecipeListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ["id", "title", "description", "created_at", "updated_at", "tags"]


class TagField(serializers.Field):
    def to_representation(self, value):
        return TagSerializer(value, many=True).data

    def to_internal_value(self, data):
        tags = []
        for item in data:
            if isinstance(item, dict) and "name" in item:
                # Create or get tag by name
                tag, _ = Tag.objects.get_or_create(name=item["name"])
                tags.append(tag)
            elif isinstance(item, int):
                # Get existing tag by ID
                try:
                    tag = Tag.objects.get(id=item)
                    tags.append(tag)
                except Tag.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Tag with id {item} does not exist"
                    )
        return tags


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True)
    steps = StepSerializer(many=True)
    tags = TagField(required=False)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "description",
            "servings",
            "ingredients",
            "steps",
            "tags",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])
        tags_data = validated_data.pop("tags", [])

        recipe = Recipe.objects.create(**validated_data)

        # Add tags
        if tags_data:
            recipe.tags.set(tags_data)

        # Add ingredients
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=recipe, **ingredient_data)

        # Add steps
        for step_data in steps_data:
            if isinstance(step_data, dict):
                description = step_data.get("description")
                order = step_data.get("order")
                if description is not None and order is not None:
                    Step.objects.create(
                        recipe=recipe, description=description, order=order
                    )

        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])
        tags_data = validated_data.pop("tags", None)

        # Update recipe fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update tags if provided
        if tags_data is not None:
            instance.tags.set(tags_data)

        # Clear existing ingredients and steps
        instance.ingredients.all().delete()
        instance.steps.all().delete()

        # Create new ingredients
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=instance, **ingredient_data)

        # Create new steps
        for step_data in steps_data:
            # Make sure we have both description and order
            if not isinstance(step_data, dict):
                continue
            description = step_data.get("description")
            order = step_data.get("order")
            if description is not None and order is not None:
                Step.objects.create(
                    recipe=instance, description=description, order=order
                )

        return instance
