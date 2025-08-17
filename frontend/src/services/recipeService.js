const API_URL = 'http://localhost:8000/api';

export const recipeService = {
    async createRecipe(recipeData) {
        try {
            const response = await fetch(`${API_URL}/recipes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...recipeData,
                    steps: recipeData.steps.map((description, index) => ({
                        description: description,
                        order: index + 1
                    }))
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(JSON.stringify(error));
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    async getRecipes() {
        try {
            const response = await fetch(`${API_URL}/recipes/`);
            if (!response.ok) {
                throw new Error('Failed to fetch recipes');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
};
