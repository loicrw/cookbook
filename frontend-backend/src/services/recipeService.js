const API_URL = 'http://localhost:8000/api';

export const recipeService = {
    async createRecipe(recipeData) {
        try {
            const response = await fetch(`${API_URL}/recipes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData)
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
    },

    async getRecipe(id) {
        try {
            const response = await fetch(`${API_URL}/recipes/${id}/`);
            if (!response.ok) {
                throw new Error('Failed to fetch recipe');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    async updateRecipe(id, recipeData) {
        try {
            // Ensure steps have the correct format
            const formattedData = {
                ...recipeData,
                steps: recipeData.steps.map((step, index) => {
                    if (typeof step === 'string') {
                        return {
                            description: step,
                            order: index + 1
                        };
                    }
                    return step;
                })
            };
            
            console.log('Sending update request with data:', JSON.stringify(formattedData, null, 2));
            const response = await fetch(`${API_URL}/recipes/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                throw new Error(JSON.stringify(errorData));
            }

            return await response.json();
        } catch (error) {
            console.error('Update recipe error:', error);
            throw error;
        }
    }
};
