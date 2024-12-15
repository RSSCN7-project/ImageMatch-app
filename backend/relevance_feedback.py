import json
import os
import numpy as np

class RelevanceFeedbackManager:
    def __init__(self, weights_file='weights_config.json', learning_rate=0.1):
        """
        Initialize the Relevance Feedback Manager
        
        :param weights_file: Path to store/load feature weights
        :param learning_rate: Learning rate for weight updates
        """
        self.weights_file = weights_file
        self.learning_rate = learning_rate
        
        
        
        # Load existing weights or use defaults
        self.current_weights = self.load_weights()
        
        # History to track weight changes
        self.weights_history = []

    def load_weights(self):
        """
        Load weights from a JSON file or return default weights
        
        :return: Dictionary of feature weights
        """
        try:
            if os.path.exists(self.weights_file):
                with open(self.weights_file, 'r') as f:
                    return json.load(f)
            return self.default_weights.copy()
        except (FileNotFoundError, json.JSONDecodeError):
            return self.default_weights.copy()

    def save_weights(self, weights):
        """
        Save weights to a JSON file
        
        :param weights: Dictionary of feature weights to save
        """
        with open(self.weights_file, 'w') as f:
            json.dump(weights, f, indent=4)

    def update_weights(self, query_descriptors, feedback_data):
        """
        Update feature weights based on user feedback
        
        :param query_descriptors: Descriptors of the query image
        :param feedback_data: List of feedback items with image details and feedback
        :return: Updated weights dictionary
        """
        # Create a copy of current weights to modify
        updated_weights = self.current_weights.copy()
        
        # Track total adjustments to ensure weights remain normalized
        total_adjustment = 0
        feature_adjustments = {feature: 0 for feature in updated_weights}
        
        # Process each feedback item
        for item in feedback_data:
            # Skip items marked as 'neutral'
            if item['feedback'] == 'neutral':
                continue
            
            # Compute adjustment direction and magnitude
            if item['feedback'] == 'relevant':
                # Increase weights of features that helped find relevant images
                adjustment = self.learning_rate
            elif item['feedback'] == 'irrelevant':
                # Decrease weights of features that led to irrelevant results
                adjustment = -self.learning_rate
            
            # You could add more sophisticated weight update logic here
            # For now, we'll do a simple linear adjustment
            for feature in updated_weights:
                # Small adjustment based on feature consistency
                feature_adjustment = adjustment * self._compute_feature_contribution(
                    query_descriptors, 
                    item.get('descriptors', {}), 
                    feature
                )
                feature_adjustments[feature] += feature_adjustment
                total_adjustment += abs(feature_adjustment)
        
        # Apply adjustments to weights
        for feature in updated_weights:
            updated_weights[feature] += feature_adjustments[feature]
        
        # Normalize weights to ensure they sum to 1
        self._normalize_weights(updated_weights)
        
        # Save updated weights
        self.save_weights(updated_weights)
        
        # Update current weights and history
        self.current_weights = updated_weights
        self.weights_history.append(updated_weights.copy())
        
        return updated_weights

    def _compute_feature_contribution(self, query_descriptors, image_descriptors, feature):
        """
        Compute a simple contribution score for a specific feature
        
        :param query_descriptors: Descriptors of query image
        :param image_descriptors: Descriptors of compared image
        :param feature: Feature name to compute contribution for
        :return: Contribution score
        """
        # Placeholder for feature-specific contribution computation
        # In a real-world scenario, you'd implement more sophisticated logic
        try:
            if feature in query_descriptors and feature in image_descriptors:
                # Simple magnitude difference as a proxy for contribution
                return np.linalg.norm(
                    np.array(query_descriptors[feature]) - 
                    np.array(image_descriptors[feature])
                )
            return 0
        except Exception:
            return 0

    def _normalize_weights(self, weights, min_threshold=0.05):
        """
        Normalize weights to ensure they sum to 1, are non-negative,
        and are above a minimum threshold.
        
        :param weights: Dictionary of feature weights to normalize
        :param min_threshold: Minimum allowable weight for any feature
        """
        # Ensure all weights are above the minimum threshold
        for feature in weights:
            if weights[feature] < min_threshold:
                weights[feature] = min_threshold
        
        # Normalize weights to sum to 1
        total = sum(weights.values())
        if total > 0:
            for feature in weights:
                weights[feature] /= total


    def save_feedback_history(self):
        """
        Save the history of weight updates to a file
        """
        history_file = 'weights_history.json'
        with open(history_file, 'w') as f:
            json.dump(self.weights_history, f, indent=4)

    def reset_weights(self):
        """
        Reset weights to default configuration
        """
        self.current_weights = self.default_weights.copy()
        self.save_weights(self.current_weights)