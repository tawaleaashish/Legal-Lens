import React, { useRef, useEffect, useState } from 'react';
import './LandingPage.css';
import gsap from 'gsap';
import logo from '../assets/logo.png';
import Uploadbutton from '../components/Uploadbutton';
import supabase from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Import react-markdown

const API_KEY = window.env?.REACT_APP_GEMINI_API_KEY || 'AIzaSyBbTYvtNqksIeWj7NItfl8wWaTyk9D6-DQ';

const LegalLensPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSendQuery = async () => {
    if (!query) return;

    setIsLoading(true);
    setResponse('');
    setDisplayedQuery(query);
    setHasQueried(true);

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }]
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      let newResponse = 'No response generated.';
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        newResponse = data.candidates[0].content.parts[0].text;
        setResponse(newResponse);
      } else {
        setResponse(newResponse);
      }

      setHistory(prevHistory => [{ query, response: newResponse }, ...prevHistory]);
    } catch (error) {
      const errorMessage = 'Error processing request: ' + error.message;
      setResponse(errorMessage);
      setHistory(prevHistory => [{ query, response: errorMessage }, ...prevHistory]);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChatSidebar = () => {
    setIsChatSidebarOpen(!isChatSidebarOpen);
    if (isChatSidebarOpen && history.length > 0) {
      const previousChat = history[0];
      setQuery(previousChat.query);
      setResponse(previousChat.response);
      setHasQueried(true);
    }
  };

  const handleNewChat = () => {
    setQuery('');
    setResponse('');
    setDisplayedQuery('');
    setHasQueried(false);
  };

  useEffect(() => {
    gsap.to(logoItem.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
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

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        navigate('/home');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="legal-lens-page">
      <main className="main-content">
        {/* Small square button to open the chat sidebar */}
        <button className="chat-toggle-button" onClick={toggleChatSidebar}>
          ☰
        </button>

        <button onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) {
              navigate('/');
            } else {
              console.error(error);
              navigate('/');
            }
          }} className="logout-button">Logout</button>

        {isChatSidebarOpen && (
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <button className="close-sidebar" onClick={toggleChatSidebar}>×</button>
            </div>
            <div className="chat-sidebar-content">
              <button className="new-chat-button" onClick={handleNewChat}>New Chat</button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <button className="toggle-sidebar" onClick={toggleSidebar}>
            {isSidebarOpen ? 'Hide History' : 'Show History'}
          </button>
        )}

        {isSidebarOpen && (
          <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3></h3>
            </div>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <strong></strong> {item.query}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasQueried && (
          <div className="response-section">
            {isLoading ? (
              <div className="loading-indicator">Loading...</div>
            ) : (
              <div>
                <h3>Query:</h3>
                <p>{displayedQuery}</p>
                <h3>Response:</h3>
                <ReactMarkdown>{response}</ReactMarkdown> {/* Render Markdown here */}
              </div>
            )}
          </div>
        )}

        {!hasQueried && (
          <>
            <div className="icon-section">
              <img
                ref={logoItem}
                src={logo}
                alt="Legal Lens Icon"
                className="legal-lens-icon"
              />
            </div>
            <h1 ref={logoText} className="heading">
              Legal Lens
            </h1>
            <p ref={logoTag} className="tagline">
              Decoding Legal Jargon
            </p>
            <div className="action-buttons">
              <button className="action-button">Summarize my contract</button>
              <button className="action-button">Key clause identification</button>
              <button className="action-button">Analyze legal documents</button>
            </div>
          </>
        )}

        <div className="query-section">
          <Uploadbutton />
          <input
            type="text"
            placeholder="Ask me your queries..."
            className="query-input"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()} // Trigger send on Enter
          />
          <button onClick={handleSendQuery} className="send-button">Send</button>
        </div>
      </main>
    </div>
  );
};

export default LegalLensPage;
