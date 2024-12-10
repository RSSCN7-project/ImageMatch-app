import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HistogramComponent = ({ imageFilename }) => {
  const [histogramData, setHistogramData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistogram = async () => {
      try {
        console.log('Fetching histogram for image:', imageFilename);
        
        const response = await axios.post('http://localhost:5001/calculate-histogram', {
          image: imageFilename
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Histogram response:', response.data);

        if (response.data.histogram) {
          setHistogramData(response.data.histogram);
          setError(null);
        } else {
          setError('No histogram data received');
        }
      } catch (error) {
        console.error('Error fetching histogram:', error);
        setError(error.response?.data?.error || 'Failed to fetch histogram');
      }
    };

    if (imageFilename) {
      fetchHistogram();
    }
  }, [imageFilename]);

  const prepareChartData = () => {
    if (!histogramData) return null;

    const labels = Array.from({ length: 256 }, (_, i) => i.toString());

    return {
      labels,
      datasets: [
        {
          label: 'Red Channel',
          data: histogramData.red,
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        },
        {
          label: 'Green Channel',
          data: histogramData.green,
          backgroundColor: 'rgba(0, 255, 0, 0.5)',
          borderColor: 'rgb(0, 255, 0)',
          borderWidth: 1
        },
        {
          label: 'Blue Channel',
          data: histogramData.blue,
          backgroundColor: 'rgba(0, 0, 255, 0.5)',
          borderColor: 'rgb(0, 0, 255)',
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Image Color Histogram'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Pixel Intensity'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Pixel Count'
        }
      }
    }
  };

  // Render error or loading state
  if (error) {
    return (
      <div className="tm-bg-primary-dark tm-block">
        <h2 className="tm-block-title">Histogram</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
      <div style={{ width: '600px', height: '100%' }}>
        {histogramData ? (
          <Bar 
            data={prepareChartData()} 
            options={chartOptions} 
            style={{ width: '480px', height: '780px' }}
          />
        ) : (
          <p>Loading histogram...</p>
        )}
      </div>
    
  );
};

export default HistogramComponent;