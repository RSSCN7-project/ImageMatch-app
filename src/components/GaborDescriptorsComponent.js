import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GaborFilterComponent = ({ imageFilename }) => {
  const [gaborImageUrl, setGaborImageUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGaborImage = async () => {
      try {
        console.log('Fetching Gabor-filtered image for:', imageFilename);

        const response = await axios.post('http://localhost:5001/calculate-gabor', {
          image: imageFilename
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Gabor image response:', response.data);

        if (response.data.gabor_image_url) {
          setGaborImageUrl(response.data.gabor_image_url);
          setError(null);
        } else {
          setError('Failed to fetch Gabor-filtered image URL.');
        }
      } catch (error) {
        console.error('Error fetching Gabor-filtered image:', error);
        setError(error.response?.data?.error || 'Failed to fetch Gabor-filtered image.');
      }
    };

    if (imageFilename) {
      fetchGaborImage();
    }
  }, [imageFilename]);

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <h2 className="tm-block-title">Gabor Filter</h2>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : gaborImageUrl ? (
        <div style={{ textAlign: 'center' }}>
          <img 
            src={gaborImageUrl} 
            alt="Gabor Filtered" 
            style={{ maxWidth: '600px', height: '300px', borderRadius: '8px' }} 
          />
        </div>
      ) : (
        <p>Loading Gabor-filtered image...</p>
      )}
    </div>
  );
};

export default GaborFilterComponent;