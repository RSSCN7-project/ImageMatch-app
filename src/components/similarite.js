import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // Assuming you're using toast for notifications
import ImageUploading from "react-images-uploading";
import "react-toastify/dist/ReactToastify.css";
import "./similarite.css";
import "./animated.css";
import "./bootstrap.min.css";
import HistogramComponent from './HistogramComponent'; 
import DominantColorsComponent from './DominantColorsComponent';
import GaborDescriptorsComponent from './GaborDescriptorsComponent';
import HuMomentsComponent from './HuMomentsComponent';

const Similarity = () => {
  const [similarImages, setSimilarImages] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null); // To store the uploaded image URL
  const [userName, setUserName] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const analysisTypes = [
    { key: 'histogram', label: 'Histogram', component: HistogramComponent },
    { key: 'dominant_colors', label: 'Dominant Colors', component: DominantColorsComponent },
    { key: 'gabor_descriptors', label: 'Gabor Descriptors', component: GaborDescriptorsComponent },
    { key: 'hu_moments', label: 'Hu Moments', component: HuMomentsComponent }
  ];

  // Function to handle the file upload
  const onUpload = async (imageList) => {
    try {
      const formData = new FormData();
      formData.append("file", imageList[0].file);

      // Send the image to the backend
      const uploadResponse = await axios.post("http://localhost:5001/save-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Successfully uploaded
      toast.success("Image uploaded successfully!");

      // Store similar images in state
      if (uploadResponse.data.similar_images) {
        setSimilarImages(uploadResponse.data.similar_images);
      }

      // Optionally, store the uploaded image URL
      setUploadedImage(uploadResponse.data.uploaded_image_url); // URL for the uploaded image

    } catch (error) {
      toast.error("Error uploading image. Please try again.");
      console.error(error);
    }
  };
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Get user data from localStorage
    if (user && user.fullName) {
      setUserName(user.fullName); // Set the user's full name
    }
  }, []);
  useEffect(() => {
    // Fetch similar images from the backend API
    fetch("http://localhost:5001/get-similar-images")
      .then((response) => {
        console.log("DEBUG: API response status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("DEBUG: API response data:", data);
        if (data.similar_images) {
          setSimilarImages(data.similar_images);
        } else {
          console.warn("DEBUG: No 'similar_images' field in API response.");
        }
      })
      .catch((error) => {
        console.error("DEBUG: Error fetching similar images:", error);
      });
  }, []); // Run once on mount

  useEffect(() => {
    console.log("DEBUG: Current state of similarImages:", similarImages);
  }, [similarImages]); // Log when similarImages updates

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

            {similarImages.length > 0 && similarImages[0].filename && (
              selectedAnalysis === 'histogram' ? (
                <HistogramComponent imageFilename={similarImages[0].filename} />
              ) : selectedAnalysis === 'dominant_colors' ? (
                <DominantColorsComponent imageFilename={similarImages[0].filename} />
              ) : selectedAnalysis === 'gabor_descriptors' ? (
                <GaborDescriptorsComponent imageFilename={similarImages[0].filename} />
              ) : (
                <HuMomentsComponent imageFilename={similarImages[0].filename} />
              )
            )}
          </div>
        </div>


                <div className="col-sm-12 col-md-12 col-lg-6 col-xl-6 tm-block-col">
          <div className="tm-bg-primary-dark tm-block">


            <h2 className="tm-block-title">Uploaded Image</h2>
            <div >
              {similarImages.length > 0 && similarImages[0].filename ? (
                <img
                  src={`http://localhost:5001/processed/${similarImages[0].filename}`}
                  alt="Uploaded"
                  style={{
                    minHeight: '250px',
                    height: '350px',
                    maxWidth: "350px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <p>No similar images found. Upload an image to see similar results.</p>
              )}
                </div>
                </div>
                </div>
                <div className="col-12 tm-block-col">
  <div className="tm-bg-primary-dark tm-block tm-block-taller">
    <h2 className="tm-block-title">Similar Images</h2>

    <div class="tm-notification-items">
                            <div class="media tm-notification-item">
    <div id="pieChartContainer">
      <div
        className="results-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around", // Adjust to space items evenly
          gap: "20px",
          padding: "10px", // Adding padding for spacing between images
        }}
      >
        {similarImages.length > 0 ? (
          similarImages.map((image, index) => (
            <div
              key={image.image_name || index}
              style={{
                padding: "10px", // Added padding for spacing inside the box
                width: "200px", // Set the width for the image card
                height: "300px", // Set the height for the image card
                textAlign: "center",
                border: "1px solid #8d8d8d59", // Border around each image box
                borderRadius: "8px", // Rounded corners for each image box
                backgroundColor: "#8d8d8d59", // Background color for the box
              }}
              className="image-card"
            >
              <img
                src={`http://localhost:5001/static/dataset/${image.category}/${image.image_name}`}
                alt={image.image_name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "180px", // Limit the image height
                  objectFit: "cover", // Ensure the image fits in the box
                  borderRadius: "5px", // Optional: rounded corners for the image
                }}
              />
              <p style={{ fontSize: "14px", marginTop: "10px" ,color: '#fff'}}>Category: {image.category}</p>
              <p style={{ fontSize: "14px", fontWeight: "bold" ,color: '#fff' }}>
                Similarity Score: {image.similarity_score?.toFixed(4)}
              </p>
            </div>
          ))
        ) : (
          <p>No similar images found. Upload an image to see similar results.</p>
        )}
      </div>
    </div>
  </div>
</div>



</div>
</div>
</div>
</div>
  );
};

export default Similarity;

