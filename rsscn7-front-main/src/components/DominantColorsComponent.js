import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DominantColorsComponent = ({ imageFilename }) => {
  const [dominantColors, setDominantColors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDominantColors = async () => {
      try {
        console.log('Fetching dominant colors for image:', imageFilename);
        
        const response = await axios.post('http://localhost:5001/calculate-dominant-colors', {
          image: imageFilename
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Dominant colors response:', response.data);

        if (response.data.dominant_colors) {
          setDominantColors(response.data.dominant_colors);
          setError(null);
        } else {
          setError('No dominant colors data received');
        }
      } catch (error) {
        console.error('Error fetching dominant colors:', error);
        setError(error.response?.data?.error || 'Failed to fetch dominant colors');
      }
    };

    if (imageFilename) {
      fetchDominantColors();
    }
  }, [imageFilename]);

  // Render error or loading state
  if (error) {
    return (
      <div className="tm-bg-primary-dark tm-block">
        <h2 className="tm-block-title">Dominant Colors</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <h2 className="tm-block-title">Dominant Colors</h2>
      {dominantColors ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {dominantColors.map((color, index) => (
            <div 
              key={index} 
              style={{ 
                width: '100px', 
                height: '100px', 
                backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              RGB: {color[0]}, {color[1]}, {color[2]}
            </div>
          ))}
        </div>
      ) : (
        <p>Loading dominant colors...</p>
      )}
    </div>
  );
};

export default DominantColorsComponent;