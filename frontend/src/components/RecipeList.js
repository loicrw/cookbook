import React, { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import './RecipeList.css';

const RecipeList = ({ onRecipeSelect }) => {
    console.log('RecipeList component rendered');
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        try {
            const data = await recipeService.getRecipes();
            setRecipes(data);
            setError(null);
        } catch (err) {
            setError('Failed to load recipes. Please try again later.');
            console.error('Error loading recipes:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="recipe-list">Loading...</div>;
    if (error) return <div className="recipe-list error">{error}</div>;

    return (
        <div className="recipe-list">
            {recipes.length === 0 ? (
                <div className="no-recipes">No recipes found. Add your first recipe!</div>
            ) : (
                recipes.map(recipe => (
                    <div
                        key={recipe.id}
                        className="recipe-card"
                        onClick={() => onRecipeSelect(recipe.id)}
                    >
                        <h3>{recipe.title}</h3>
                        <p>{recipe.description}</p>
                        {recipe.tags && recipe.tags.length > 0 && (
                            <div className="recipe-tags">
                                {recipe.tags.map((tag, index) => (
                                    <span key={index} className="recipe-tag">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="recipe-meta">
                            Last updated: {new Date(recipe.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RecipeList;