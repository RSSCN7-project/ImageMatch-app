import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HuMomentsComponent = ({ imageFilename }) => {
  const [humomentsImageUrl, setHumomentsImageUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHuMoments = async () => {
      try {
        console.log('Fetching Hu Moments for image:', imageFilename);

        const response = await axios.post('http://localhost:5001/calculate-hu-moments', {
          image: imageFilename
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Hu Moments response:', response.data);

        if (response.data.humoments_image_url) {
          setHumomentsImageUrl(response.data.humoments_image_url);
          setError(null);
        } else {
          setError('No Hu Moments image URL received');
        }
      } catch (error) {
        console.error('Error fetching Hu Moments:', error);
        setError(error.response?.data?.error || 'Failed to fetch Hu Moments');
      }
    };

    if (imageFilename) {
      fetchHuMoments();
    }
  }, [imageFilename]);

  // Render error or loading state
  if (error) {
    return (
      <div className="tm-bg-primary-dark tm-block">
        <h2 className="tm-block-title">Hu Moments</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <h2 className="tm-block-title">Hu Moments</h2>
      {humomentsImageUrl ? (
        <div style={{ marginTop: '20px' }}>
          <img 
            src={humomentsImageUrl} 
            alt="Hu Moments Visualized" 
            style={{ maxWidth: '600px', height: '300px', borderRadius: '8px' }} 
          />
        </div>
      ) : (
        <p>Loading Hu Moments visualized image...</p>
      )}
    </div>
  );
};

export default HuMomentsComponent;