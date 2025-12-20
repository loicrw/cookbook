import React, { useState } from 'react';
import { recipeService } from '../services/recipeService';
import './AddRecipeForm.css';

const AddRecipeForm = ({ onClose, initialRecipe = null }) => {
  const [recipe, setRecipe] = useState(() => {
    if (initialRecipe) {
      console.log('Initializing form with recipe:', initialRecipe);
      // Ensure steps array is properly formatted and ordered
      const steps = Array.isArray(initialRecipe.steps) 
        ? initialRecipe.steps
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(step => step.description || '')
        : [''];

      // Ensure ingredients are properly formatted
      const ingredients = Array.isArray(initialRecipe.ingredients)
        ? initialRecipe.ingredients.map(ing => ({
            name: ing.name || '',
            quantity: ing.quantity || '',
            unit: ing.unit || ''
          }))
        : [{ name: '', quantity: '', unit: '' }];

      // Ensure tags are properly formatted
      const tags = Array.isArray(initialRecipe.tags)
        ? initialRecipe.tags
        : [];

      return {
        title: initialRecipe.title || '',
        description: initialRecipe.description || '',
        servings: initialRecipe.servings || '',
        ingredients,
        steps,
        tags
      };
    }
    return {
      title: '',
      description: '',
      servings: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      steps: [''],
      tags: []
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, { name: '', quantity: '', unit: '' }]
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...recipe.steps];
    newSteps[index] = value;
    setRecipe({ ...recipe, steps: newSteps });
  };

  const addStep = () => {
    setRecipe({ ...recipe, steps: [...recipe.steps, ''] });
  };

  const removeStep = (index) => {
    const newSteps = recipe.steps.filter((_, i) => i !== index);
    setRecipe({ ...recipe, steps: newSteps });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('Current recipe state:', recipe);
      // Format the recipe data for the API
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        servings: parseInt(recipe.servings),
        ingredients: recipe.ingredients
          .filter(ing => ing.name.trim() !== '')
          .map(ing => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 0,
            unit: ing.unit
          })),
        steps: recipe.steps
          .filter(step => step.trim() !== '')
          .map((stepDescription, index) => ({
            description: stepDescription,
            order: index + 1
          })),
        tags: recipe.tags
          .filter(tag => tag.name.trim() !== '')
      };

      if (initialRecipe?.id) {
        await recipeService.updateRecipe(initialRecipe.id, recipeData);
      } else {
        await recipeService.createRecipe(recipeData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError(typeof error === 'string' ? error : 'Failed to save recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={recipe.title}
              onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tags:</label>
            <div className="tags-container">
              {recipe.tags.map((tag, index) => (
                <div key={index} className="tag-input-row">
                  <input
                    type="text"
                    placeholder="Tag name"
                    value={tag.name}
                    onChange={(e) => {
                      const newTags = [...recipe.tags];
                      newTags[index] = { name: e.target.value };
                      setRecipe({ ...recipe, tags: newTags });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = recipe.tags.filter((_, i) => i !== index);
                      setRecipe({ ...recipe, tags: newTags });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setRecipe({
                    ...recipe,
                    tags: [...recipe.tags, { name: '' }]
                  });
                }}
              >
                Add Tag
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={recipe.description}
              onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Servings:</label>
            <input
              type="number"
              min="1"
              value={recipe.servings}
              onChange={(e) => setRecipe({ ...recipe, servings: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ingredients:</label>
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  required
                />
                <button type="button" onClick={() => removeIngredient(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addIngredient}>
              Add Ingredient
            </button>
          </div>

          <div className="form-group">
            <label>Steps:</label>
            {recipe.steps.map((step, index) => (
              <div key={index} className="step-row">
                <div className="step-number">{index + 1}.</div>
                <textarea
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  required
                ></textarea>
                <button type="button" onClick={() => removeStep(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addStep}>
              Add Step
            </button>
          </div>

          <div className="button-group">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialRecipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeForm;