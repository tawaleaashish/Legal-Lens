import React, { useRef, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useNavigate   } from 'react-router-dom';
import './MainPage.css';
import gsap from 'gsap';
import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../assets/logo.png";

const MainPageContent = () => {
  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);
  const nav= useNavigate();

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

  const handleLoginSuccess = (tokenResponse) => {
    console.log('Login Success:', tokenResponse);
    nav('/home')
  //   return (
  //     <Router>
  //       <Routes>
  //         <Route path="/home" element={<LegalLensPage />} />
  //       </Routes>
  //     </Router>
  // );
  };

  const handleLoginError = (error) => {
    console.error('Login Failed:', error);
    // Implement error handling, e.g., show an error message to the user
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
  });

  return (
    <div className="main-page">
      <div className="header">
        <img ref={logoItem} src={logo} alt="Legal Lens Logo" className="logo" />
        <h1 ref={logoText} className="title">Legal Lens</h1>
        <p ref={logoTag} className="tagline">Decoding Legal Jargon</p>
      </div>
      <div className="buttons">
        <button className="button signup-button" onClick={() => login()}>Sign Up</button>
        <button className="button login-button" onClick={() => login()}>Login</button>
      </div>
    </div>
  );
};

const MainPage = () => (
  <GoogleOAuthProvider clientId="324834956157-qf295eru01eiiv82fapvuv52taie6mls.apps.googleusercontent.com">
    <MainPageContent />
  </GoogleOAuthProvider>
);

export default MainPage;