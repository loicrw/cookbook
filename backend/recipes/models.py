from django.db import models


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    servings = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Ingredient(models.Model):
    recipe = models.ForeignKey(
        Recipe, related_name="ingredients", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}"


class Step(models.Model):
    recipe = models.ForeignKey(Recipe, related_name="steps", on_delete=models.CASCADE)
    description = models.TextField()
    order = models.IntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Step {self.order}: {self.description[:50]}..."
