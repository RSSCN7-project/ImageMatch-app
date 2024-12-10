import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ImageUploading from "react-images-uploading";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ImageManager.css";
import "./animated.css";
import "./bootstrap.min.css";
import "./bootstrap.min.css.map";
import { useNavigate } from "react-router-dom";
import expertImage1 from './images/expert5.png';
import expertImage2 from './images/expert7.png';
import expertImage3 from './images/expert6.png';
import aboutImage from './images/about-dec.png';
import histogram from './images/service-icon-01.png';
import method from './images/service-icon-02.png';
import bock from './images/service-icon-03.png';
import histogram1 from './images/histogramm.png';
import method1 from './images/Feature_Re-weighting.png';
import bock1 from './images/gabor.png';

const ImageManager = () => {
  const [images, setImages] = useState([]); // For selected images
  const [uploadedImages, setUploadedImages] = useState([]); // For successfully uploaded images
  const [clickedImage, setClickedImage] = useState(null); // To track clicked image
  const carouselRef = useRef(null); // Reference to the carousel
  const [userName, setUserName] = useState(""); // For storing the user's name
  const maxNumber = 10; // Maximum number of images allowed
  const [similarImages, setSimilarImages] = useState([]);
  const navigate = useNavigate();

  // Fetch the list of uploaded images from the server
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get("http://localhost:5001/get-images");
        setUploadedImages(response.data.images); // Set the images from server
      } catch (error) {
        toast.error("Error fetching images from the server.");
      }
    };

    fetchImages();
  }, []); // Only fetch once on component mount

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Get user data from localStorage
    if (user && user.fullName) {
      setUserName(user.fullName); // Set the user's full name
    }
  }, []);

  const experts = [
    {
      ame: 'Marouan Daghmoumi',
      image: expertImage1,
      linkedin: 'https://www.linkedin.com/in/marouan-daghmoumi-b75b4921a/',
      github: 'https://github.com/Marouan19',
      email: 'marouan.daghmoumi@etu.uae.ac.ma',
    },
    {
      name: 'mohammed Aachabi',
      image: expertImage2,
      image: expertImage2,
      linkedin: 'https://www.linkedin.com/in/mohammed-aachabi-85a4b6254/',
      github: 'https://github.com/mohammed-stalin',
      email: 'mohammed.achabi@etu.uae.ac.ma',
    },
    {
      name: 'Abdelmajid Benjelloun',
      image: expertImage3,
      image: expertImage3,
      linkedin: 'https://www.linkedin.com/in/abdelmajid-benjelloun-538649218/',
      github: 'https://github.com/AbdelmajidBen',
      email: 'abdelmajid.benjelloun@etu.uae.ac.ma',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const servicesData = [
    {
      title: "Color Histogram & Dominant Colors",
      description:
        "Analyze image color distribution through comprehensive histogram analysis, identifying dominant color palettes and extracting precise color characteristics for advanced image processing and recognition.",
      img: histogram,
      img1: histogram1,
      ticks: ["Color Distribution Mapping", "Palette Extraction", "Color Frequency Analysis"],
    },
    {
      title: "Feature Re-weighting",
      description:
        "Advanced machine learning technique that dynamically adjusts feature importance, optimizing model performance by emphasizing critical attributes and reducing noise in complex data representations.",
      img: method,
      img1: method1,
      ticks: ["Dynamic Feature Scoring", "Model Optimization", "Noise Reduction"],
    },
    {
      title: "Gabor Filter and Hu Moment",
      description:
        "Sophisticated image processing technique combining Gabor filters for texture analysis and Hu moments for shape recognition, providing robust feature extraction in computer vision applications.",
      img: bock,
      img1: bock1,
      ticks: ["Texture Analysis", "Shape Invariant Features", "Image Characterization"],
    },
  ];

  const handleIconClick = (index) => {
    setActiveIndex(index);
  };

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
  
      // Store similar images in localStorage
      if (uploadResponse.data.similar_images) {
        localStorage.setItem('similarImages', JSON.stringify(uploadResponse.data.similar_images));
      }
  
      // Optionally, you can still update state or do other actions
      const similarImages = uploadResponse.data.similar_images;
      setSimilarImages(similarImages);
  
      // Navigate to the Similarity page
      navigate("/similarite");
  
    } catch (error) {
      toast.error("Error uploading image. Please try again.");
      console.error(error);
    }
  };
  // Handle image click
  const handleImageClick = async (image) => {
    setClickedImage(image); // Set the clicked image
  };

  // Handle "Back" button click to reset to previous state (all images visible)
  const handleBackClick = () => {
    setClickedImage(null); // Reset to show all images
  };

  // Move the first image to the end when it exits
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current && uploadedImages.length > 1) {
        const firstImage = uploadedImages[0];
        setUploadedImages((prevImages) => [...prevImages.slice(1), firstImage]);
      }
    }, 3000); // Adjust the speed of movement here

    return () => clearInterval(interval); // Cleanup on unmount
  }, [uploadedImages]);
  
  const handleConfirm = async () => {
    if (!clickedImage || !clickedImage.file) {
      toast.error("No image selected to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", clickedImage.file); // Append the selected file
  
    try {
      const uploadResponse = await axios.post("http://localhost:5001/save-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // Successfully uploaded
      toast.success("Image uploaded successfully!");
  
      // Store similar images in localStorage
      if (uploadResponse.data.similar_images) {
        localStorage.setItem("similarImages", JSON.stringify(uploadResponse.data.similar_images));
      }
  
      // Optionally, you can still update state or do other actions
      const similarImages = uploadResponse.data.similar_images;
      setSimilarImages(similarImages);
  
      // Navigate to the Similarity page
      navigate("/similarite");
  
    } catch (error) {
      toast.error("Error uploading image. Please try again.");
      console.error(error);
    }
  };
  
    
  return (
    <div className="image-manager">
      {/* Header Section */}
      <header className="header-area header-sticky">
  <div className="container">
    <div className="row align-items-center">
      <div className="col-6">
        {/* Welcome User Section */}
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
      {/* Main Banner */}
      <div className="main-banner">
        <div className="container">
          <div className="row">
            <div className="col-lg-10 offset-lg-1">
              <div className="header-text">
                <h2>
                  Discover Similar <em>Images</em> &amp; Enhance Your Search with{" "}
                  <em>Relevance Feedback</em>
                </h2>
                <p>
                  Our application empowers you to upload, manage, and search images
                  with precision. Easily find similar images using content-based
                  retrieval methods and refine your results with relevance feedback.
                </p>
                <div className="buttons">
                  <div className="big-border-button">
                    <ImageUploading
                      value={images}
                      onChange={(imageList) => {
                        setImages(imageList); // Update image list
                        onUpload(imageList); // Upload the image
                      }}
                      maxNumber={1}
                      dataURLKey="data_url"
                    >
                      {({ onImageUpload }) => (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default link behavior
                            onImageUpload(); // Trigger the image upload on click
                          }}
                        >
                          Upload Image from browser
                        </a>
                      )}
                    </ImageUploading>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Image Uploading Component */}
      <ImageUploading
        value={images}
        onChange={(imageList) => {
          setImages(imageList); // Update image list
          onUpload(imageList); // Upload the image
        }}
        maxNumber={10}
        dataURLKey="data_url"
      >
        {({ onImageUpload }) => (
          <>
            <button onClick={onImageUpload}>Choose Image</button>
          </>
        )}
      </ImageUploading>

      {/* Horizontal Carousel for Uploaded Images */}
      <section className="featured-items">
        <div className="image-carousel" ref={carouselRef}>
          {uploadedImages.map((image, index) => (
            <div
              key={index}
              className="item"
              onClick={() => handleImageClick(image)} // Handle image click
              style={{
                display:
                  clickedImage === null || clickedImage === image
                    ? "block"
                    : "none", // Show only the clicked image or all if none clicked
              }}
            >
              <div className="thumb">
                <img
                  src={`http://localhost:5001/processed/${image}`}
                  alt={image}
                  className="carousel-image"
                />
                <div className="hover-effect">
                  <div className="content">
                    <h4>
                      Click to choose image <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i> <span>(4.5)</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      

      {/* Buttons for Back and Search */}
      {clickedImage && (
  <div className="action-buttons">
    <button 
      onClick={handleBackClick} 
      className="back-button"
      style={{
        color: 'white',  // White text color
        backgroundColor: '#333', // Dark background for contrast
        border: '1px solid #666', // Border style for consistency
        padding: '10px 20px', // Padding for the buttons
        margin: '5px', // Margin for spacing between buttons
        cursor: 'pointer', // Pointer cursor on hover
      }}
    >
      Choose another image
    </button>
    <button 
      onClick={handleConfirm}
      className="search-button"
      style={{
        color: 'white',  // White text color
        backgroundColor: '#333', // Dark background for contrast
        border: '1px solid #666', // Border style for consistency
        padding: '10px 20px', // Padding for the buttons
        margin: '5px', // Margin for spacing between buttons
        cursor: 'pointer', // Pointer cursor on hover
      }}
    >
      Confirm
    </button>
  </div>
)}


       {/* About Us Section */}
       <div id="about" className="about section">
  <div className="container">
    <div className="row">
      <div className="col-lg-12">
        <div className="row">
          <div className="col-lg-6">
            <div className="about-left-image wow fadeInLeft" data-wow-duration="1s" data-wow-delay="0.5s">
              <img src={aboutImage} alt="About Us Decoration" />
            </div>
          </div>
          <div className="col-lg-6 align-self-center wow fadeInRight" data-wow-duration="1s" data-wow-delay="0.5s">
            <div className="about-right-content">
              <div className="section-heading">
                <h6>About this project</h6>
                <h4>what <em>ImageMatch</em> can do</h4>
                <div className="line-dec"></div>
              </div>
              <p>
                The goal of this web application is to implement basic image indexing and search functionalities based on content. The application enables image uploads, organization by categories, and the creation of new images through transformations like cropping and scaling.
              </p>
              <p>
                The system also supports searching for similar images based on various descriptors such as color, texture, and shape, leveraging advanced feature re-weighting methods for relevance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="services" className="services section">
      <div className="container">
        <div className="section-heading">
          <h6>Our Services</h6>
          <h4>
            What Our website <em>Provides</em>
          </h4>
          <div className="line-dec"></div>
        </div>
        <div className="naccs">
          <div className="menu">
            {servicesData.map((service, index) => (
              <div
                key={index}
                className={`thumb ${activeIndex === index ? "active" : ""}`}
                onClick={() => handleIconClick(index)}
              >
                <span className="icon">
                  <img src={service.img} alt="Service Icon" />
                </span>
                {service.title}
              </div>
            ))}
          </div>
          <ul className="nacc">
            {servicesData.map((service, index) => (
              <li
                key={index}
                className={activeIndex === index ? "active" : ""}
              >
                <div className="thumb">
                  <div className="row">
                    <div className="col-lg-6 align-self-center">
                      <div className="left-text">
                        <h4>{service.title}</h4>
                        <p>{service.description}</p>
                        <div className="ticks-list">
                          {service.ticks.map((tick, i) => (
                            <span key={i}>
                              <i className="fa fa-check"></i> {tick}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 align-self-center">
                      <div className="right-image">
                        <img src={service.img1} alt="Service Illustration" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

      <div className="responsive-container-block outer-container">
      <div className="responsive-container-block inner-container">
        <p className="text-blk section-head-text">
          Meet Our Project Team
        </p>
        <p className="text-blk section-subhead-text">
          Our team of AI and data science student.
        </p>
        <div className="responsive-container-block">
          {experts.map((expert, index) => (
            <div
              key={index}
              className="responsive-cell-block wk-desk-3 wk-ipadp-3 wk-tab-6 wk-mobile-12 team-card-container"
            >
              <div className="team-card">
                <div className="img-wrapper">
                  <img
                    className="team-img"
                    src={expert.image}
                    alt={`Image of ${expert.name}`}
                  />
                </div>
                <p className="text-blk name">{expert.name}</p>
                <div className="social-media-links">
                  <a href={expert.linkedin} target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
                      alt="LinkedIn"
                      style={{ width: '30px', height: '30px' }}
                    />
                  </a>
                  <a href={expert.github} target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
                      alt="GitHub"
                      style={{ width: '30px', height: '30px' }}
                    />
                  </a>
                  <a href={`mailto:${expert.email}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/gray-mail.svg"
                      alt="Email"
                      style={{ width: '30px', height: '30px' }}
                    />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <footer>
    <div class="container">
      <div class="row">
        <div class="col-lg-12">
          <p>Copyright © 2022 DigiMedia Co., Ltd. All Rights Reserved. 
          Design: <a href="https://templatemo.com" target="_parent" title="free css templates">TemplateMo</a></p>
        </div>
      </div>
    </div>
  </footer>
    </div>

  );
};

export default ImageManager;