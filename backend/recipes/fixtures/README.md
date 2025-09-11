# Loading Sample Data

To load the sample recipes into your database, follow these steps:

1. Ensure your database migrations are up to date:
```bash
python manage.py migrate
```

2. Load the fixture data:
```bash
python manage.py loaddata sample_recipes.json
```

## Customizing the Sample Data

The `sample_recipes.json` file contains template data that you can modify. Each recipe follows this structure:

```json
{
  "model": "recipes.recipe",
  "pk": 1,
  "fields": {
    "title": "Your Recipe Title",
    "description": "Your Recipe Description",
    "servings": 4
  }
}
```

Add ingredients and steps for each recipe following the template format in the JSON file.