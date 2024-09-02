import React, { useRef, useEffect, useState } from 'react';
import { useNavigate   } from 'react-router-dom';
import './MainPage.css';
import gsap from 'gsap';
import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../assets/logo.png";
import supabase from "../supabaseClient.js";

const MainPageContent = () => {
  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);
  const navigate= useNavigate();

  useEffect(() => {
    gsap.to(logoItem.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
    });
  },[]);

  useEffect(() => {
    gsap.to(logoText.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
    });
  },[]);
  
  useEffect(() => {
    gsap.to(logoTag.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.4,
    });
  }, []);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        console.error('Login Failed:', error.message);
      } else {
        console.log('Redirecting to /home...');
        navigate('/home'); // Navigate after successful login
      }
    } catch (error) {
      console.error('Unexpected Error:', error);
    }
  };


  return (
    <div className="main-page">
      <div className="header">
        <img ref={logoItem} src={logo} alt="Legal Lens Logo" className="logo" />
        <h1 ref={logoText} className="title">Legal Lens</h1>
        <p ref={logoTag} className="tagline">Decoding Legal Jargon</p>
      </div>
      <div className="buttons">
        <button className="button signup-button" onClick={handleLogin}>Sign Up</button>
        <button className="button login-button" onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
};

export default MainPageContent;