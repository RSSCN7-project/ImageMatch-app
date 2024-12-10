import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './Auth.css'; // Import your styles
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Auth = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to handle error message
  const navigate = useNavigate();

  const handleLoginSuccess = (response) => {
    const { credential } = response;
    axios
      .post('http://127.0.0.1:5001/api/auth/google', { token: credential })
      .then((res) => {
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Save user data in localStorage
        toast.success('Google login successful!');
        navigate('/image-manager');
      })
      .catch((err) => {
        console.error('Error during Google authentication', err);
        toast.error('Google login failed. Please try again.');
      });
  };
  
  const handleLoginFailure = (error) => {
    console.error('Google Login Failed:', error);
    toast.error('Google login failed. Please try again.');
    setErrorMessage('Google login failed. Please try again.');
  };

  const handleEmailPasswordLogin = () => {
    axios
      .post('http://127.0.0.1:5001/api/auth/login', { email, password })
      .then((res) => {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Save user data in localStorage
        toast.success('Login successful!');
        navigate('/image-manager');
      })
      .catch((err) => {
        console.error('Error during email/password authentication', err);
        toast.error('Email or password is incorrect.');
      });
  };
  

  const handleSignUp = () => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    // Validate email format
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
  
    // Check if passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
  
    // Proceed with signup if validation passes
    axios
      .post('http://127.0.0.1:5001/api/auth/signup', { fullName, email, password })
      .then((res) => {
        toast.success('Sign up successful! Please log in.');
        setIsSignUp(false); // Switch to login screen
      })
      .catch((err) => {
        console.error('Error during signup', err);
        toast.error('An error occurred during signup.');
      });
  };  

  const handleForgotPassword = () => {
    axios
      .post('http://127.0.0.1:5001/api/auth/forgot-password', { email: forgotEmail })
      .then((res) => {
        alert('Password reset link sent to your email!');
      })
      .catch((err) => {
        console.error('Error during forgot password', err);
        setErrorMessage('Failed to send password reset link.');
      });
  };

  return (
    <div className="auth-wrapper">
      <ToastContainer />
      <div className="auth-box">
        <h2 className="auth-heading">Welcome</h2>
        <p className="auth-subtext">Log in to continue.</p>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {isSignUp ? (
          <div className="signup-form">
            <p>Full Name:</p>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
            />
            <p>Email:</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
            <p>Password:</p>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <p>Confirm Password:</p>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
            <button onClick={handleSignUp} className="login-btn">
              Sign Up
            </button>
            <p className="toggle-auth">
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)}>Log In</span>
            </p>
          </div>
        ) : (
          <div className="login-form">
            <div className="email-password-login">
              <p>Email:</p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <p>Password:</p>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
              <button onClick={handleEmailPasswordLogin} className="login-btn">
                Login
              </button>
            </div>

            <div className="or-separator">OR</div>

            <div className="login-button">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginFailure}
              />
            </div>

            <p className="toggle-auth">
              Don’t have an account?{' '}
              <span onClick={() => setIsSignUp(true)}>Sign Up</span>
            </p>
            <p className="forgot-password" onClick={() => setForgotEmail(email)}>
              Forgot Password?
            </p>
          </div>
        )}

        {forgotEmail && (
          <div className="forgot-password-section">
            <h3>Reset Password</h3>
            <p>Enter your email to receive the password reset link:</p>
            <input
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="input-field"
            />
            <button onClick={handleForgotPassword} className="login-btn">
              Send Reset Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
