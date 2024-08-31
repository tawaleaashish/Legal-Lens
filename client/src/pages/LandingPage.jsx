import React, { useRef, useEffect } from 'react';
import './LandingPage.css';
import backgroundImage from '../assets/background-image.jpg';
<<<<<<< HEAD
import gsap from 'gsap'; // Import GSAP
import logo from '../assets/logo.png';
import FileUpload from '../components/FileUpload'; // Ensure this path is correct
import Uploadbutton from '../components/Uploadbutton';
import Sendbutton from '../components/Sendbutton';
=======
import legal_lens_logo from '../assets/logo.png'
>>>>>>> 32b7616fc90c8cacd1a2997aceee1e7047ad687c
const LegalLensPage = () => {
  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);

  useEffect(() => {
    gsap.to(logoItem.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
    });
  }, []);

  useEffect(() => {
    gsap.to(logoText.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
    });
  }, []);

  useEffect(() => {
    gsap.to(logoTag.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
    });
  }, []);

  return (
    <div className="legal-lens-page">
      <main className="main-content">
        <div className="icon-section">
<<<<<<< HEAD
          <img
            ref={logoItem}
            src={logo}
            alt="Legal Lens Icon"
            className="legal-lens-icon"
          />
=======
          <img src={legal_lens_logo} alt="Legal Lens Icon" className="legal-lens-icon" />
>>>>>>> 32b7616fc90c8cacd1a2997aceee1e7047ad687c
        </div>
        <h1 ref={logoText} className="heading">Legal Lens</h1>
        <p ref={logoTag} className="tagline">Decoding Legal Jargon</p>
        <p className="instruction">Upload your documents to summarize and analyze</p>

       

        {/* <button className="upload-button">Upload Document</button> */}
        <Uploadbutton/>

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
           
          {/* <button className="query-submit-button">↩︎</button> */}
          <Sendbutton/>
        </div>
      </main>
    </div>
  );
};

export default LegalLensPage;
