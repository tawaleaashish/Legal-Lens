import React from 'react';
import './LandingPage.css'; // Import the CSS file for styling
import backgroundImage from '../assets/background-image.jpg';
import legal_lens_logo from '../assets/logo.png'
const LegalLensPage = () => {
  return (
    <div className="legal-lens-page">
      <header className="header">
        <div className="header-buttons">
          <button className="sign-up-button" onClick={() => navigate('/create-campaign')}>
            Sign Up
          </button>
          <button className="login-button" onClick={() => navigate('/microinsurance')}>
            Login
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="icon-section">
          <img src={legal_lens_logo} alt="Legal Lens Icon" className="legal-lens-icon" />
        </div>
        <h1>Legal Lens</h1>
        <p className="tagline">Decoding Legal Jargon</p>
        <p className="instruction">Upload your document to summarize and analyse</p>
        
        <button className="upload-button">Upload Document</button>

        <div className="action-buttons">
          <button className="action-button">Summarize my contract</button>
          <button className="action-button">Key clause identification</button>
          <button className="action-button">Analyze legal documents</button>
        </div>

        <div className="query-section">
          <input
            type="text"
            placeholder="Ask me your queries..."
            className="query-input"
          />
          <button className="query-submit-button">↩︎</button>
        </div>
      </main>
    </div>
  );
};

export default LegalLensPage;
