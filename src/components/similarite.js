import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ImageUploading from "react-images-uploading";
import "react-toastify/dist/ReactToastify.css";
import "./similarite.css";
import "./animated.css";
import "./bootstrap.min.css";
import HistogramComponent from './HistogramComponent'; 
import DominantColorsComponent from './DominantColorsComponent';
import GaborDescriptorsComponent from './GaborDescriptorsComponent';
import HuMomentsComponent from './HuMomentsComponent';

const Similarite = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [similarImages, setSimilarImages] = useState([]);
  const [queryDescriptors, setQueryDescriptors] = useState({});
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [userName, setUserName] = useState(""); // For storing the user's name
  const analysisTypes = [
    { key: 'histogram', label: 'Histogram', component: HistogramComponent },
    { key: 'dominant_colors', label: 'Dominant Colors', component: DominantColorsComponent },
    { key: 'gabor_descriptors', label: 'Gabor Descriptors', component: GaborDescriptorsComponent },
    { key: 'hu_moments', label: 'Hu Moments', component: HuMomentsComponent }
  ];
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Get user data from localStorage
    if (user && user.fullName) {
      setUserName(user.fullName); // Set the user's full name
    }
  }, []);

  useEffect(() => {
    // Retrieve the uploaded image path and similar images from localStorage
    const uploadedImageData = localStorage.getItem("uploadedImage");
    const similarImagesData = localStorage.getItem("similarImages");
    const queryDescriptorsData = localStorage.getItem("queryDescriptors");

    if (uploadedImageData) {
      setUploadedImage(uploadedImageData);
    }

    if (similarImagesData) {
      setSimilarImages(JSON.parse(similarImagesData));
    }

    if (queryDescriptorsData) {
      setQueryDescriptors(JSON.parse(queryDescriptorsData));
    }
  }, []);

  const handleFeedbackChange = (index, event) => {
    const newSimilarImages = [...similarImages];
    const feedback = event.target.value;

    // Update the feedback state
    newSimilarImages[index].feedback = feedback;
    setSimilarImages(newSimilarImages);

    // Store the feedback in the feedbackItems array
    const updatedFeedbackItems = [...feedbackItems];
    updatedFeedbackItems[index] = {
      image_name: newSimilarImages[index].image_name,
      category: newSimilarImages[index].category,
      feedback: feedback
    };
    setFeedbackItems(updatedFeedbackItems);
  };

  const handleSubmitFeedback = async () => {
    const validFeedbackItems = feedbackItems.filter(
      item => item && item.image_name && item.category && item.feedback
    );
  
    if (validFeedbackItems.length === 0) {
      console.error("No valid feedback items found.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5001/submit_feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_descriptors: queryDescriptors,
          feedback_items: validFeedbackItems,
        }),
      });
  
      const data = await response.json();
      if (data.status === "success") {
        // Update similarImages state with the new matches
        if (data.similar_images) {
          // Convert numpy.float64 to regular number if needed
          const processedSimilarImages = data.similar_images.map(img => ({
            ...img,
            similarity_score: Number(img.similarity_score)
          }));

          setSimilarImages(processedSimilarImages);
          
          // Update localStorage with new similar images
          localStorage.setItem("similarImages", JSON.stringify(processedSimilarImages));
        }
        console.log("Feedback submitted successfully.");
        
        // Reset feedback items after submission
        setFeedbackItems([]);
      } else {
        console.error("Error submitting feedback:", data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <div className="image-manager">
      {/* Header Section */}
      <header className="header-area header-sticky">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-6">
              <div className="welcome-message">
                {userName ? `Welcome, ${userName}` : "Welcome, Guest"}
              </div>
            </div>
            <div className="col">
              <nav className="main-navv">
                <a className="logoo"></a>
              </nav>
            </div>
          </div>
        </div>
      </header>


      <div className="row tm-content-row">
        <div className="col-sm-12 col-md-12 col-lg-6 col-xl-6 tm-block-col">
          <div className="tm-bg-primary-dark tm-block">
            
          <div className="row mt-3">
             <div className="col-12">
             <div className="analysis-buttons d-flex justify-content-start" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
             {analysisTypes.map(type => (
  <button
    key={type.key}
    className={`btn ${selectedAnalysis === type.key ? 'btn-primary' : 'btn-secondary'} mr-2`}
    onClick={() => setSelectedAnalysis(type.key)}
    disabled={!similarImages.length}
    style={{
      width: '135px', // Fixed width for buttons
      height: '40px', // Fixed height for buttons
      flexShrink: 0,
      marginRight: '10px', // Space between buttons
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden', // Hide overflowing content
    }}
  >
    <span 
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '140px', // Slightly less than button width to prevent scrollbars
        textAlign: 'center'
      }}
    >
      {type.label}
    </span>
  </button>
))}
                </div>
              </div>
            </div>
            {uploadedImage && (
  selectedAnalysis === 'histogram' ? (
    <HistogramComponent imageFilename={`http://localhost:5001/${uploadedImage}`} />
  ) : selectedAnalysis === 'dominant_colors' ? (
    <DominantColorsComponent imageFilename={`http://localhost:5001/${uploadedImage}`} />
  ) : selectedAnalysis === 'gabor_descriptors' ? (
    <GaborDescriptorsComponent imageFilename={`http://localhost:5001/${uploadedImage}`} />
  ) : (
    <HuMomentsComponent imageFilename={`http://localhost:5001/${uploadedImage}`} />
  )
)}
          </div>
        </div>


                <div className="col-sm-12 col-md-12 col-lg-6 col-xl-6 tm-block-col">
          <div className="tm-bg-primary-dark tm-block">


            <h2 className="tm-block-title">Uploaded Image</h2>
            <div >
            {uploadedImage ? (
        <img
          src={`http://localhost:5001/${uploadedImage}`}
          alt="Uploaded"
          style={{
            maxWidth: "300px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        />
      ) : (
        <p>No uploaded image to display.</p>
      )}
                </div>
                </div>
                </div>
                <div className="col-12 tm-block-col"
                style={{
                  maxheight: "880px",
                }}>
  <div
  className="tm-bg-primary-dark tm-block tm-block-taller"
  style={{
    height: "1000px",
    maxHeight: "1550px", // Set the maximum height for the container
    overflowY: "auto", // Optional: Add scroll if content exceeds height
  }}
>
  <h2 className="tm-block-title">Similar Images</h2>

  <div className="tm-notification-items">
    <div className="media tm-notification-item">
      <div id="pieChartContainer">
        <div
          className="results-container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around", // Ensures even spacing
            gap: "20px", // Space between cards
            padding: "20px", // Adds overall padding for the container
            backgroundColor: "#033761", // Optional: Background color for better contrast
          }}
        >
          {similarImages.length > 0 ? (
            similarImages.map((image, index) => (
              <div
                key={image.image_name || index}
                className="image-card"
                style={{
                  padding: "10px", // Space inside the card
                  width: "200px", // Consistent card width
                  textAlign: "center",
                  border: "1px solid rgba(141, 141, 141, 0.35)", // Subtle border
                  borderRadius: "8px", // Rounded corners for a polished look
                  backgroundColor: "rgba(141, 141, 141, 0.35)", // Semi-transparent background
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Slight shadow for depth
                }}
              >
                <img
                  src={`http://localhost:5001/static/dataset/${image.category}/${image.image_name}`}
                  alt={image.image_name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "500px", // Adjusted height for larger images
                    objectFit: "cover", // Ensures the image doesn't stretch
                    borderRadius: "5px", // Slight rounding for the image
                  }}
                />
                <p style={{ fontSize: "14px", marginTop: "10px", color: "#fff" }}>
                  Category: {image.category}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    margin: "5px 0",
                    color: "#fff",
                  }}
                >
                  Similarity Score: {image.similarity_score?.toFixed(4)}
                </p>
                <label htmlFor={`feedback-${index}`}>Feedback</label>
                <select
                className="feedback-dropdown"
                style={{
                  width: "100%",
                  padding: "5px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontSize: "14px",
                }}
                  id={`feedback-${index}`}
                  value={image.feedback || "neutral"}  // Default to neutral if no feedback
                  onChange={(event) => handleFeedbackChange(index, event)}
                >
                  <option value="neutral">Neutral</option>
                  <option value="irrelevant">Irrelevant</option>
                  <option value="relevant">Relevant</option>
                </select>
              </div>
            ))
          ) : (
            <p style={{ color: "#fff", textAlign: "center" }}>
              No similar images found. Upload an image to see similar results.
            </p>
          )}
        </div>

        {/* Feedback section */}
        <div 
                  id="feedback-message" 
                  style={{ 
                    textAlign: "center", 
                    marginTop: "20px" 
                  }}
                >
                </div>
                
                <button
        onClick={handleSubmitFeedback}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit Feedback
      </button>
      </div>
    </div>
  </div>
</div>
</div>
</div>
    </div>
  );
};

export default Similarite;