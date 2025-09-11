import React, { useState, useEffect } from 'react';
import './TagInput.css';

const TagInput = ({ tags, onTagsChange }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    // Fetch existing tags from the API
    fetch('http://localhost:8000/api/tags/')
      .then(response => response.json())
      .then(data => setAllTags(data))
      .catch(error => console.error('Error fetching tags:', error));
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Filter suggestions based on input
    if (value.trim()) {
      const filtered = allTags
        .filter(tag => 
          tag.name.toLowerCase().includes(value.toLowerCase()) &&
          !tags.some(t => t.name === tag.name)
        );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    }
  };

  const addTag = (name) => {
    if (!tags.some(tag => tag.name === name)) {
      onTagsChange([...tags, { name }]);
    }
    setInput('');
    setSuggestions([]);
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag.name !== tagToRemove.name));
  };

  return (
    <div className="tags-input-container">
      <div className="tags-container">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag.name}
            <button onClick={() => removeTag(tag)} type="button">&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Add a tag..."
        className="tag-input"
      />
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => addTag(suggestion.name)}
            >
              {suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;