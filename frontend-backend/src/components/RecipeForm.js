import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import './RecipeForm.css';

const RecipeForm = ({ recipe, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [steps, setSteps] = useState(
    recipe?.steps?.map(step => ({ text: step.description })) || [{ text: '' }]
  );
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.map(ing => ({ text: ing.name })) || [{ text: '' }]
  );
  const [tags, setTags] = useState(
    recipe?.tags?.map(tag => ({ text: tag.name })) || [{ text: '' }]
  );

  const handleTagChange = (index, value) => {
    const newTags = [...tags];
    newTags[index] = { text: value };
    setTags(newTags);
  };

  const addTag = () => {
    setTags([...tags, { text: '' }]);
  };

  const removeTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags.length > 0 ? newTags : [{ text: '' }]);
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = { text: value };
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { text: '' }]);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.length > 0 ? newSteps : [{ text: '' }]);
  };

  const moveStep = (fromIndex, toIndex) => {
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    setSteps(newSteps);
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { text: value };
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { text: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients.length > 0 ? newIngredients : [{ text: '' }]);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    moveStep(fromIndex, toIndex);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      steps: steps
        .filter(step => step.text.trim() !== '')
        .map((step, index) => ({
          description: step.text,
          order: index + 1
        })),
      ingredients: ingredients
        .filter(ing => ing.text.trim() !== '')
        .map(ing => ({
          name: ing.text,
          quantity: '',
          unit: ''
        })),
      tags: tags
        .filter(tag => tag.text.trim() !== '')
        .map(tag => ({ name: tag.text }))
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="recipe-form">
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Tags</Form.Label>
        <div className="tags-container">
          {tags.map((tag, index) => (
            <div key={index} className="d-flex mb-2">
              <Form.Control
                type="text"
                placeholder="Enter tag"
                value={tag.text}
                onChange={(e) => handleTagChange(index, e.target.value)}
              />
              <Button
                variant="outline-danger"
                onClick={() => removeTag(index)}
                className="ms-2"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline-primary" onClick={addTag}>
            Add Tag
          </Button>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Ingredients</Form.Label>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="d-flex mb-2">
            <Form.Control
              type="text"
              value={ingredient.text}
              onChange={(e) => handleIngredientChange(index, e.target.value)}
              placeholder="Enter ingredient"
            />
            <Button
              variant="outline-danger"
              onClick={() => removeIngredient(index)}
              className="ms-2"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button variant="outline-primary" onClick={addIngredient}>
          Add Ingredient
        </Button>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Steps</Form.Label>
        {steps.map((step, index) => (
          <div
            key={index}
            className="d-flex mb-2 step-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="step-number">{index + 1}</div>
            <Form.Control
              type="text"
              value={step.text}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder="Enter step description"
            />
            <Button
              variant="outline-danger"
              onClick={() => removeStep(index)}
              className="ms-2"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button variant="outline-primary" onClick={addStep}>
          Add Step
        </Button>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Recipe
        </Button>
      </div>
    </Form>
  );
};

export default RecipeForm;