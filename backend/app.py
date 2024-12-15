from flask import Flask, request, jsonify, send_from_directory,url_for
from werkzeug.utils import secure_filename
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import time
import traceback
from datetime import datetime, timedelta
import os
import json
import numpy as np
from PIL import Image
import cv2
import logging
from sklearn.cluster import KMeans
from scipy.spatial import distance
from collections import Counter
import os
from bson.json_util import dumps
# Set up basic logging configuration
logging.basicConfig(level=logging.DEBUG)

from relevance_feedback import RelevanceFeedbackManager
from similarity import compute_similarity_score
from image_utils import (
    calculate_color_histogram, 
    find_dominant_colors, 
    calculate_gabor_descriptors, 
    calculate_hu_moments, 
    calculate_texture_energy, 
    calculate_circularity
)
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# MongoDB connection
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client['ImageMatch']
users_collection = db.users
descriptors_collection = db['image_descriptors2']
similarity_collection = db['similarity']

# Google Client ID
CLIENT_ID = "287952495373-lvnnfspk2m46akv9nshqo473eco2oe6i.apps.googleusercontent.com"
print(f"Google CLIENT_ID: {CLIENT_ID}")

# Get the absolute path to the 'processed' folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_FOLDER = os.path.join(BASE_DIR, "processed")

# Define the directory to save processed images
UPLOAD_FOLDER = os.path.join(os.getcwd(), "processed")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure the upload folder
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Ensure the processed folder exists
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Relevance Feedback Manager
feedback_manager = RelevanceFeedbackManager()

# Helper Functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Authentication Routes
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    try:
        id_info = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        user_id = id_info['sub']
        email = id_info['email']
        return jsonify({"message": "Authentication successful", "user_id": user_id, "email": email})
    except ValueError as e:
        return jsonify({"error": "Invalid token"}), 401

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400
        data['password'] = generate_password_hash(data['password'])
        result = users_collection.insert_one(data)
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        email = request.json.get('email')
        password = request.json.get('password')
        user = users_collection.find_one({"email": email})
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401
        return jsonify({
            "message": "Login successful",
            "user": {"fullName": user['fullName'], "email": user['email']}
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    return jsonify({"message": "Password reset link sent to {}".format(email)}), 200

@app.route("/processed/<filename>")
def serve_processed_image(filename):
    try:
        return send_from_directory(PROCESSED_FOLDER, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route("/get-images", methods=["GET", "OPTIONS"])
def get_images():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        files = os.listdir(PROCESSED_FOLDER)
        return jsonify({"images": files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# function for finding similar images and feedback
def find_similar_images(query_descriptors, top_k=10, weights=None):
    # If no specific weights provided, use default
    if weights is None:
        weights = feedback_manager.current_weights
    print(f"Using weights: {weights}")
    
    # Fetch all descriptors from MongoDB
    all_descriptors = list(descriptors_collection.find())
    print(f"Total descriptors found in DB: {len(all_descriptors)}")
    
    similarities = []

    for doc in all_descriptors:
        try:
            # Ensure all descriptors exist, use empty list as fallback
            descriptors = {
                "histogram": doc.get('histogram', []),
                "dominant_colors": doc.get('dominant_colors', []),
                "gabor_descriptors": doc.get('gabor_descriptors', []),
                "hu_moments": doc.get('hu_moments', []),
                "texture_energy": doc.get('texture_energy', []),
                "circularity": doc.get('circularity', []),
            }

            # Log missing descriptors
            for key, value in descriptors.items():
                if not value:
                    print(f"Missing or empty descriptor for {doc.get('image_name')}: {key}")

            # Check if any descriptor is empty
            if all(len(desc) == 0 for desc in descriptors.values()):
                print(f"Skipping {doc.get('image_name')} - No descriptors found")
                continue


            similarity_score = compute_similarity_score(
                query_descriptors,
                descriptors,
                weights
            )
            print(f"Similarity score for {doc.get('image_name')}: {similarity_score}")
            
            similarities.append({
                'category': doc['category'],
                'image_name': doc['image_name'],
                'similarity_score': similarity_score
            })
        except Exception as e:
            print(f"Error processing descriptor for {doc.get('image_name')}: {e}")

    # Sort by similarity score (lower score means more similar)
    similarities = sorted(similarities, key=lambda x: x['similarity_score'])[:top_k]
    print(f"Top {top_k} similar images: {similarities}")

    # Resolve local file paths for each similar image
    for sim in similarities:
        sim['image_path'] = f"/static/dataset/{sim['category']}/{sim['image_name']}"
        print(f"Resolved image path: {sim['image_path']}")
        
    return similarities
@app.route('/save-image', methods=['POST'])
def save_image():
    try:
        # Check if the request contains a file
        if 'file' not in request.files:
            print("No file part in the request")
            return jsonify({'message': 'No file part in the request'}), 400

        file = request.files['file']

        # Check if the file is valid
        if file.filename == '':
            print("No selected file")
            return jsonify({'message': 'No selected file'}), 400

        # Save the file to the backend/processed folder
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        print(f"Saving file to {filepath}")
        file.save(filepath)

        # Clear previous global query_descriptors to avoid data pollution
        global query_descriptors
        query_descriptors = {}  # Clear previous descriptors

        # Compute descriptors for the uploaded image
        query_descriptors = {
            "histogram": calculate_color_histogram(filepath),
            "dominant_colors": find_dominant_colors(filepath),
            "gabor_descriptors": calculate_gabor_descriptors(filepath),
            "hu_moments": calculate_hu_moments(filepath),
            "texture_energy": calculate_texture_energy(filepath),
            "circularity": calculate_circularity(filepath)
        }
        print(f"Computed descriptors: {query_descriptors}")

        # Check if descriptors are empty
        if not any(query_descriptors.values()):
            return jsonify({'message': 'Error: Descriptors are empty'}), 400
        

        # Find similar images based on the descriptors
        similar_images = find_similar_images(query_descriptors)

        return jsonify({
            'message': 'Image uploaded successfully',
            'filePath': f"processed/{file.filename}",
            'similar_images': similar_images
        })
    except Exception as e:
        print(f"Error saving image: {e}")
        return jsonify({'message': 'Error saving image'}), 500
@app.route('/backend/processed/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    # Parse incoming feedback data
    feedback_data = request.json
    logging.debug(f"Received feedback data: {feedback_data}")
    
    # Check if query_descriptors are already available in the feedback data
    if feedback_data.get('query_descriptors') and len(feedback_data['query_descriptors']) > 0:
        query_descriptors = feedback_data['query_descriptors']
        logging.debug("Using query_descriptors from feedback data")
    else:
        # If no query_descriptors, attempt to find the original uploaded image
        uploaded_files = os.listdir(app.config['UPLOAD_FOLDER'])
        image_files = [f for f in uploaded_files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
        
        if not image_files:
            logging.error("No uploaded image found in the processed folder")
            return jsonify({
                "status": "error", 
                "message": "No original image found"
            }), 400
        
        # Use the most recently added image file
        latest_image = max([os.path.join(app.config['UPLOAD_FOLDER'], f) for f in image_files], key=os.path.getctime)
        
        try:
            # Recalculate descriptors
            query_descriptors = {
                "histogram": calculate_color_histogram(latest_image),
                "dominant_colors": find_dominant_colors(latest_image),
                "gabor_descriptors": calculate_gabor_descriptors(latest_image),
                "hu_moments": calculate_hu_moments(latest_image),
                "texture_energy": calculate_texture_energy(latest_image),
                "circularity": calculate_circularity(latest_image)
            }
            logging.debug(f"Recalculated query_descriptors: {query_descriptors}")
        except Exception as e:
            logging.error(f"Error calculating descriptors: {e}")
            return jsonify({
                "status": "error", 
                "message": f"Error processing image: {str(e)}"
            }), 500

    # Rest of the existing submit_feedback logic remains the same
    # Enrich feedback items with descriptors from the database
    for item in feedback_data.get('feedback_items', []):
        logging.debug(f"Processing feedback item: {item}")
        
        # Find the matching document in the database
        doc = descriptors_collection.find_one({
            'image_name': item.get('image_name'),
            'category': item.get('category')
        })
        
        if doc:
            # Populate descriptors from the database document
            item['descriptors'] = {
                "histogram": doc.get('histogram', []),
                "dominant_colors": doc.get('dominant_colors', []),
                "gabor_descriptors": doc.get('gabor_descriptors', []),
                "hu_moments": doc.get('hu_moments', []),
                "texture_energy": doc.get('texture_energy', []),
                "circularity": doc.get('circularity', [])
            }
            logging.debug(f"Enriched item with descriptors: {item['descriptors']}")
        else:
            logging.warning(f"No matching document found for item: {item}")
    
    # Process feedback and get updated weights
    try:
        logging.debug("Updating weights based on feedback...")
        new_weights = feedback_manager.update_weights(
            query_descriptors=query_descriptors,
            feedback_data=feedback_data.get('feedback_items', [])
        )
        logging.debug(f"Updated weights: {new_weights}")
        
        # Find similar images with the new weights
        logging.debug("Finding similar images based on updated weights...")
        matches = find_similar_images(
            query_descriptors=query_descriptors,
            weights=new_weights
        )
        logging.debug(f"Found similar images: {matches}")
        
        # Persist the new weights
        feedback_manager.save_feedback_history()
        logging.debug("Feedback history saved.")
        
        return jsonify({
            "status": "success", 
            "new_weights": new_weights,
            "similar_images": matches
        })
    
    except Exception as e:
        logging.error(f"Error processing feedback: {e}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500


# function for histogramm display
@app.route('/calculate-histogram', methods=['POST'])
def calculate_histogram():
    try:
        data = request.get_json()
        image_filename = data.get('image')
        print(image_filename)
        if not image_filename:
            return jsonify({"error": "Image filename not provided"}), 400
        
        # Load the image
        image_path = os.path.join(image_filename)
        if not os.path.exists(image_path):
            return jsonify({"error": "Image not found"}), 404
        
        print(image_path)

        image = cv2.imread(image_path)
        if image is None:
            return jsonify({"error": "Failed to load image"}), 500

        # Calculate histograms for R, G, B channels
        histogram = {
            'red': cv2.calcHist([image], [2], None, [256], [0, 256]).flatten().tolist(),
            'green': cv2.calcHist([image], [1], None, [256], [0, 256]).flatten().tolist(),
            'blue': cv2.calcHist([image], [0], None, [256], [0, 256]).flatten().tolist(),
        }

        # Construct the image URL
        image_url = f"http://localhost:5001/{image_filename}"

        return jsonify({
            "histogram": histogram,
            "image_url": image_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/calculate-dominant-colors', methods=['POST'])
def calculate_dominant_colors():
    try:
        data = request.get_json()
        image_filename = data.get('image')

        if not image_filename:
            return jsonify({"error": "Image filename not provided"}), 400

        # Use the provided image path directly without appending IMAGE_DIR
        image_path = os.path.join(image_filename)
        if not os.path.exists(image_path):
            return jsonify({"error": f"Image not found at path: {image_path}"}), 404

        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            return jsonify({"error": "Failed to load image"}), 500

        # Resize the image to speed up processing (optional)
        resized_image = cv2.resize(image, (150, 150), interpolation=cv2.INTER_AREA)

        # Reshape the image to a 2D array of pixels
        pixels = resized_image.reshape(-1, 3)

        # Apply K-means clustering to find dominant colors
        kmeans = KMeans(n_clusters=5, random_state=42)
        kmeans.fit(pixels)

        # Get the cluster centers (dominant colors)
        dominant_colors = kmeans.cluster_centers_.astype(int).tolist()

        return jsonify({"dominant_colors": dominant_colors})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# Directory to save processed images
GABOR_OUTPUT_FOLDER = os.path.join(os.getcwd(), "gabor_processed")
os.makedirs(GABOR_OUTPUT_FOLDER, exist_ok=True)

@app.route('/calculate-gabor', methods=['POST'])
def calculate_gabor():
    try:
        data = request.get_json()
        image_filename = data.get('image')

        if not image_filename:
            return jsonify({"error": "Image filename not provided"}), 400

        # Use the provided image path directly
        image_path = os.path.join(image_filename)
        if not os.path.exists(image_path):
            return jsonify({"error": f"Image not found at path: {image_path}"}), 404

        # Load the image in grayscale
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if image is None:
            return jsonify({"error": "Failed to load image"}), 500

        # Apply Gabor filter
        kernel = cv2.getGaborKernel((21, 21), 8.0, np.pi / 4, 10.0, 0.5, 0, ktype=cv2.CV_32F)
        gabor_filtered = cv2.filter2D(image, cv2.CV_8UC3, kernel)

        # Save the Gabor-filtered image
        gabor_filename = os.path.join(GABOR_OUTPUT_FOLDER, f"gabor_{os.path.basename(image_filename)}")
        cv2.imwrite(gabor_filename, gabor_filtered)

        # Return the URL of the filtered image
        gabor_image_url = f"http://localhost:5001/gabor/{os.path.basename(gabor_filename)}"
        return jsonify({"gabor_image_url": gabor_image_url})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint to serve Gabor-filtered images
@app.route('/gabor/<path:filename>', methods=['GET'])
def serve_gabor_image(filename):
    try:
        return send_from_directory(GABOR_OUTPUT_FOLDER, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404


# Directory to save processed images
HUMOMENTS_OUTPUT_FOLDER = os.path.join(os.getcwd(), "humoments_processed")
os.makedirs(HUMOMENTS_OUTPUT_FOLDER, exist_ok=True)

def calculate_hu_momentss(image_path):
    """Calculate Hu Moments for an image and return an image with visualized moments."""
    # Load the image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Apply binary thresholding to the image (for better moment calculation)
    _, binary_img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

    # Calculate Hu Moments
    moments = cv2.moments(binary_img)
    huMoments = cv2.HuMoments(moments).flatten()

    # Visualize the moments on the image (for illustration)
    img_with_moments = cv2.cvtColor(binary_img, cv2.COLOR_GRAY2BGR)
    

    return huMoments, img_with_moments

@app.route('/calculate-hu-moments', methods=['POST'])
def calculate_hu():
    try:
        data = request.get_json()
        image_filename = data.get('image')

        if not image_filename:
            return jsonify({"error": "Image filename not provided"}), 400

        # Use the provided image path directly
        image_path = os.path.join(image_filename)
        if not os.path.exists(image_path):
            return jsonify({"error": f"Image not found at path: {image_path}"}), 404

        # Compute Hu Moments and the image with moments visualized
        huMoments, img_with_moments = calculate_hu_momentss(image_path)

        # Save the visualized image for display
        humoments_image_filename = os.path.join(HUMOMENTS_OUTPUT_FOLDER, f"hu_moments_{os.path.basename(image_filename)}")
        cv2.imwrite(humoments_image_filename, img_with_moments)

        # Return the Hu Moments and the image URL
        humoments_image_url = f"http://localhost:5001/humoments/{os.path.basename(humoments_image_filename)}"
        return jsonify({
            "hu_moments": huMoments.tolist(),
            "humoments_image_url": humoments_image_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to serve Hu Moments visualized images
@app.route('/humoments/<path:filename>', methods=['GET'])
def serve_hu_moments_image(filename):
    try:
        return send_from_directory(HUMOMENTS_OUTPUT_FOLDER, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404
    

# Endpoint to serve images
@app.route('/<path:filename>', methods=['GET'])
def serve_image(filename):
    try:
        return send_from_directory(filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5001)
