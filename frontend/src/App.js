import { useState } from 'react';
import './App.css';
import AddRecipeForm from './components/AddRecipeForm';
import RecipeList from './components/RecipeList';
import { recipeService } from './services/recipeService';

function App() {
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleAddRecipe = () => {
    setShowAddRecipe(true);
    setSelectedRecipe(null);
  };

  const handleRecipeSelect = async (recipeId) => {
    try {
      const recipe = await recipeService.getRecipe(recipeId);
      setSelectedRecipe(recipe);
      setShowAddRecipe(true);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
  };

  const handleFormClose = () => {
    setShowAddRecipe(false);
    setSelectedRecipe(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="spacer"></div>
          <h1 className="app-title">The Cookbook</h1>
          <button onClick={handleAddRecipe} className="nav-button right-button">
            Add Recipe
          </button>
        </div>
      </header>
      <div className="App-content">
        {!showAddRecipe && (
          <RecipeList onRecipeSelect={handleRecipeSelect} />
        )}
        {showAddRecipe && (
          <AddRecipeForm 
            onClose={handleFormClose}
            initialRecipe={selectedRecipe}
          />
        )}
      </div>
    </div>
  );
}

export default App;
