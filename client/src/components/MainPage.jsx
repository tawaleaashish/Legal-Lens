import React, { useRef, useEffect } from 'react';
// import React from 'react';
import './MainPage.css';
import gsap from 'gsap'; // Import GSAP

import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../assets/logo.png";
 // Assuming you have a logo image in the same directory

 const MainPage = () => {
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
      <div className="main-page">
        <header className="header">
          <img
          ref={logoItem}
          src={logo} alt="Legal Lens Logo" className="logo" />
          <h1 
          ref={logoText}
          className="title">Legal Lens</h1>
          <p 
          ref={logoTag}
          className="tagline">Decoding Legal Jargon</p>
        </header>
        <div className="buttons">
          <button className="button signup-button">Sign Up</button>
          <button className="button login-button">Login</button>
        </div>
      </div>
    );
  }
  
  export default MainPage;