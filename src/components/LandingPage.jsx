import React from 'react';
import './LandingPage.css'; // Import the CSS file for styling

const LegalLensPage = () => {
  return (
    <div className="legal-lens-page">
      <header className="header">
        <button className="history-button">Check history</button>
        <div className="auth-buttons">
          <button className="sign-up-button">Sign up</button>
          <button className="login-button">Login</button>
        </div>
      </header>

      <main className="main-content">
        <div className="icon-section">
          <img src="your-icon.png" alt="Legal Lens Icon" className="legal-lens-icon" />
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
