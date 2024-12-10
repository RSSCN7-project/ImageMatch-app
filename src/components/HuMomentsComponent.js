import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HuMomentsComponent = ({ imageFilename }) => {
  const [huMoments, setHuMoments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHuMoments = async () => {
      try {
        console.log('Fetching Hu Moments for image:', imageFilename);
        
        const response = await axios.post('http://localhost:5001/calculate-feature-descriptors', {
          image: imageFilename,
          descriptor_type: 'hu_moments'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Hu Moments response:', response.data);

        if (response.data.descriptors) {
          setHuMoments(response.data.descriptors);
          setError(null);
        } else {
          setError('No Hu Moments data received');
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
      {huMoments ? (
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
                <th style={{ border: '1px solid #666', padding: '8px', color: 'white'  }}>Moment Index</th>
                <th style={{ border: '1px solid #666', padding: '8px' , color: 'white' }}>Log-Transformed Value</th>
              </tr>
            </thead>
            <tbody>
              {huMoments.map((value, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #666', padding: '8px', textAlign: 'center', color: 'white'  }}>{index + 1}</td>
                  <td style={{ border: '1px solid #666', padding: '8px', textAlign: 'right' , color: 'white' }}>
                    {value.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading Hu Moments...</p>
      )}
    </div>
  );
};

export default HuMomentsComponent;