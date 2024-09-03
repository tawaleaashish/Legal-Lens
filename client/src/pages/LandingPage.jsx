//                                 GEMINI-1.5-FLASH MODEL--> QUERY RESPONSE TIME-5 SECONDS
import React, { useRef, useEffect, useState } from 'react';
import './LandingPage.css';
import gsap from 'gsap';
import logo from '../assets/logo.png';
import Uploadbutton from '../components/Uploadbutton';

// Define your API key here or use window.env if you're injecting it at runtime
const API_KEY = window.env?.REACT_APP_GEMINI_API_KEY || 'AIzaSyBbTYvtNqksIeWj7NItfl8wWaTyk9D6-DQ';

const LegalLensPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSendQuery = async () => {
    console.log("Send button clicked");
    if (!query) {
      console.log("Query is empty, not sending request");
      return;
    }

    setIsLoading(true);
    setResponse('');

    console.log("Sending query:", query);

    try {
      console.log("Using API Key:", API_KEY.substring(0, 5) + '...');  // Log first 5 chars of API key
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }]
        }),
      });

      console.log("API response status:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("API response data:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        setResponse(data.candidates[0].content.parts[0].text);
      } else {
        setResponse('No response generated.');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      setResponse('Error processing request: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="query-section">
        <Uploadbutton/>
          <input
            type="text"
            placeholder="Ask me your queries..."
            className="query-input"
            value={query}
            onChange={handleQueryChange}
          />
          <button onClick={handleSendQuery} className="send-button">Send</button>
        </div>

        {isLoading && (
          <div className="loading-indicator">Loading...</div>
        )}

        {response && (
          <div className="response-section">
            <h3>Response:</h3>
            <p>{response}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LegalLensPage;