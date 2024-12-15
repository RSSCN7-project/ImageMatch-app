import cv2
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter

def normalize(arr):
    """Normalize array to [0, 1] range."""
    arr = np.array(arr)
    return (arr - np.min(arr)) / (np.max(arr) - np.min(arr)) if np.max(arr) != np.min(arr) else arr

def calculate_color_histogram(image_path):
    img = cv2.imread(image_path)
    chans = cv2.split(img)
    colors = ("b", "g", "r")
    histograms = {}
    for chan, color in zip(chans, colors):
        hist = cv2.calcHist([chan], [0], None, [256], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        histograms[color] = hist.tolist()
    return histograms

def find_dominant_colors(image_path, k=8, threshold=0.05):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.reshape((-1, 3))
    kmeans = KMeans(n_clusters=k, random_state=0).fit(img)
    counts = Counter(kmeans.labels_)
    total_pixels = sum(counts.values())
    dominant_colors = [kmeans.cluster_centers_[idx] / 255.0 for idx, count in counts.items() if count / total_pixels > threshold]
    return [color.tolist() for color in dominant_colors]

def calculate_gabor_descriptors(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    responses = []
    for theta in [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]:  # 4 orientations
        for sigma in [1, 3]:  # 2 scales
            kernel = cv2.getGaborKernel((21, 21), sigma, theta, 10, 0.5, 0, ktype=cv2.CV_32F)
            filtered_img = cv2.filter2D(img, cv2.CV_8UC3, kernel)
            responses.append(np.mean(filtered_img))
    responses = np.array(responses)
    epsilon = 1e-10
    return (responses - np.min(responses)) / (np.max(responses) - np.min(responses)+epsilon)  # Min-max normalization

def calculate_hu_moments(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    moments = cv2.moments(img)
    hu_moments = cv2.HuMoments(moments).flatten()
    hu_moments = -np.sign(hu_moments) * np.log10(np.abs(hu_moments))  # Log transform for scale invariance
    epsilon = 1e-10
    hu_moments = (hu_moments - np.min(hu_moments)) / (np.max(hu_moments) - np.min(hu_moments) + epsilon)  # Min-max normalization
    return hu_moments.tolist()

def calculate_texture_energy(image_path): 
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    energy = []
    for angle in [0, np.pi/4, np.pi/2, 3*np.pi/4]:  # Different orientations
        kernel = cv2.getGaborKernel((21, 21), 3, angle, 10, 0.5, 0, ktype=cv2.CV_32F)
        filtered_img = cv2.filter2D(img, cv2.CV_32F, kernel)
        energy.append(np.sum(filtered_img ** 2))
    return normalize(energy).tolist()

def calculate_circularity(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    _, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    largest_contour = max(contours, key=cv2.contourArea) if contours else None
    if largest_contour is not None:
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        if perimeter > 0:
            circularity = 4 * np.pi * (area / (perimeter ** 2))
            return normalize([circularity])[0]
    return 0  # If no contour is found