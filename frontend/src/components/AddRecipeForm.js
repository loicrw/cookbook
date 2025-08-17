import React, { useState } from 'react';
import { recipeService } from '../services/recipeService';
import './AddRecipeForm.css';

const AddRecipeForm = ({ onClose }) => {
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    servings: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    steps: ['']
  });

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await recipeService.createRecipe({
        ...recipe,
        servings: parseInt(recipe.servings),
        ingredients: recipe.ingredients.map(ing => ({
          ...ing,
          quantity: parseFloat(ing.quantity)
        }))
      });
      onClose();
    } catch (err) {
      console.error('Error submitting recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>Add New Recipe</h2>
        <form onSubmit={handleSubmit}>
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
            <label>Description:</label>
            <textarea
              value={recipe.description}
              onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
              required
            />
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
                {recipe.ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)}>
                    Remove
                  </button>
                )}
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
                />
                {recipe.steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStep}>
              Add Step
            </button>
          </div>

          {error && (
            <div className="error-message submit-error">
              {error}
            </div>
          )}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Recipe'}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeForm;
