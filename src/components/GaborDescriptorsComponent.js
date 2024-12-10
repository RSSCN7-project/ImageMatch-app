import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GaborDescriptorsComponent = ({ imageFilename }) => {
  const [gaborDescriptors, setGaborDescriptors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGaborDescriptors = async () => {
      try {
        console.log('Fetching Gabor descriptors for image:', imageFilename);
        
        const response = await axios.post('http://localhost:5001/calculate-feature-descriptors', {
          image: imageFilename,
          descriptor_type: 'gabor'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Gabor descriptors response:', response.data);

        if (response.data.descriptors) {
          setGaborDescriptors(response.data.descriptors);
          setError(null);
        } else {
          setError('No Gabor descriptors data received');
        }
      } catch (error) {
        console.error('Error fetching Gabor descriptors:', error);
        setError(error.response?.data?.error || 'Failed to fetch Gabor descriptors');
      }
    };

    if (imageFilename) {
      fetchGaborDescriptors();
    }
  }, [imageFilename]);

  // Render error or loading state
  if (error) {
    return (
      <div className="tm-bg-primary-dark tm-block">
        <h2 className="tm-block-title">Gabor Descriptors</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <h2 className="tm-block-title">Gabor Descriptors</h2>
      {gaborDescriptors ? (
        <div style={{ 
          backgroundColor: '#44444400', 
          padding: '15px', 
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #666', padding: '8px' , color: 'white' }}>Index</th>
                <th style={{ border: '1px solid #666', padding: '8px', color: 'white'  }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {gaborDescriptors.map((value, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #666', padding: '8px', textAlign: 'center', color: 'white' }}>{index}</td>
                  <td style={{ border: '1px solid #666', padding: '8px', textAlign: 'right', color: 'white'  }}>
                    {value.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading Gabor descriptors...</p>
      )}
    </div>
  );
};

export default GaborDescriptorsComponent;