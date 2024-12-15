import numpy as np
from scipy.spatial import distance
import cv2
import json 

def bhattacharyya_distance(hist1, hist2):
    return sum(cv2.compareHist(np.array(hist1[color], dtype=np.float32),
                               np.array(hist2[color], dtype=np.float32),
                               cv2.HISTCMP_BHATTACHARYYA) for color in ("b", "g", "r"))

def dominant_color_distance(colors1, colors2):
    # Pad or truncate to match the same number of dominant colors
    max_len = max(len(colors1), len(colors2))
    colors1 = np.pad(colors1, ((0, max_len - len(colors1)), (0, 0)), mode='constant')[:max_len]
    colors2 = np.pad(colors2, ((0, max_len - len(colors2)), (0, 0)), mode='constant')[:max_len]
    return distance.cdist(np.array(colors1), np.array(colors2), 'euclidean').mean()

def gabor_distance(gabor1, gabor2):
    return distance.euclidean(np.array(gabor1), np.array(gabor2))

def hu_moments_distance(hu1, hu2):
    return distance.euclidean(np.array(hu1), np.array(hu2))

def texture_energy_distance(te1, te2):
    return np.linalg.norm(np.array(te1) - np.array(te2))

def circularity_distance(ci1, ci2):
    return np.linalg.norm(np.array(ci1) - np.array(ci2))

def compute_similarity_score(query_descriptors, database_descriptors, weights=None):
    """
    Compute similarity score between two sets of descriptors with optional custom weights loaded from a JSON file.
    
    :param query_descriptors: Descriptors of query image
    :param database_descriptors: Descriptors of database image
    :param weights: Dictionary of feature weights (optional, overrides JSON if provided)
    :param weights_json_path: Path to the JSON file containing weights (optional)
    :return: Weighted similarity score
    """
    weights_json_path='weights_config.json'
    # Load weights from JSON if no weights are provided
    if weights is None and weights_json_path:
        with open(weights_json_path, 'r') as f:
            weights = json.load(f)
    
    # Fallback default weights if neither weights nor weights_json_path are provided
    if weights is None:
        weights = {
            "histogram": 0.3,
            "dominant_colors": 0.1,
            "gabor_descriptors": 0.2,
            "hu_moments": 0.1,
            "texture_energy": 0.395,
            "circularity": 0.005
        }
    
    # Compute individual feature distances
    distances = {
        "histogram": bhattacharyya_distance(query_descriptors["histogram"], database_descriptors["histogram"]),
        "dominant_colors": dominant_color_distance(query_descriptors["dominant_colors"], database_descriptors["dominant_colors"]),
        "gabor_descriptors": gabor_distance(query_descriptors["gabor_descriptors"], database_descriptors["gabor_descriptors"]),
        "hu_moments": hu_moments_distance(query_descriptors["hu_moments"], database_descriptors["hu_moments"]),
        "texture_energy": texture_energy_distance(query_descriptors["texture_energy"], database_descriptors["texture_energy"]),
        "circularity": circularity_distance(query_descriptors["circularity"], database_descriptors["circularity"])
    }
    
    # Compute weighted similarity score
    return sum(weights[feature] * distances[feature] for feature in distances)