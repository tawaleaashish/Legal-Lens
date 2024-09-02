import React, { useRef, useEffect ,useState } from 'react';
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
  const [session, setSession] = useState(null);

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

  
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        // Navigate to home or any other page
        navigate('/home'); // Make sure '/home' is the correct route
      } else if (event === 'SIGNED_OUT') {
        setSession(null); // Clear session state on sign-out
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home` // Ensure redirect to a valid route
      }
    });

    if (error) {
      console.error('Login Failed:', error.message);
      // Handle login error
    }
    // No need to handle navigation here; handled in auth state listener
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