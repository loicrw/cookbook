import { useState } from 'react';
import './App.css';
import AddRecipeForm from './components/AddRecipeForm';

function App() {
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  const handleBrowseRecipes = () => {
    // TODO: Implement browse recipes functionality
    console.log('Browse recipes clicked');
  };

  const handleAddRecipe = () => {
    setShowAddRecipe(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cookbook App</h1>
        <div className="button-container">
          <button onClick={handleBrowseRecipes} className="nav-button">
            Browse Recipes
          </button>
          <button onClick={handleAddRecipe} className="nav-button">
            Add Recipe
          </button>
        </div>
      </header>
      {showAddRecipe && (
        <AddRecipeForm onClose={() => setShowAddRecipe(false)} />
      )}
    </div>
  );
}

export default App;
