import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import ImageManager from './components/ImageManager';
import Similarity from './components/similarite.js';

function App() {
  return (
    <GoogleOAuthProvider clientId="287952495373-lvnnfspk2m46akv9nshqo473eco2oe6i.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/image-manager" element={<ImageManager />} />
          <Route path="*" element={<Navigate to="/login" />} /> {/* Redirect unknown paths */}
          <Route path="/similarite" element={<Similarity />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
