import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { gsap } from 'gsap';
import './LandingPage.css';
import logo from '../assets/logo.png';
import Uploadbutton from '../components/Uploadbutton';
import supabase from '../supabaseClient';

const API_BASE_URL = 'http://localhost:8000/api';


const LegalLensPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const navigate = useNavigate();

  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);

  const ensureUserTable = async (email) => {
    try {
      // This endpoint will create the table if it doesn't exist
      await axios.post(`${API_BASE_URL}/new_chat`, { user_email: email });
      console.log(`Ensured table exists for user: ${email}`);
    } catch (error) {
      console.error('Error ensuring user table exists:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        await ensureUserTable(user.email);
      } else {
        navigate('/login'); // Redirect to login page if user is not authenticated
      }
    };

    checkUser();

    gsap.to(logoItem.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.2,
    });

    gsap.to(logoText.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.4,
    });

    gsap.to(logoTag.current, {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power3.out',
      delay: 0.6,
    });

    // Set up Supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUserEmail(session.user.email);
        await ensureUserTable(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSendQuery = async () => {
    if (!query || !userEmail) return;

    setIsLoading(true);
    setResponse('');
    setDisplayedQuery(query);
    setHasQueried(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/query`, {
        user_email: userEmail,
        query: query,
        chat_id: currentChatId
      });

      setResponse(res.data.response);
      setCurrentChatId(res.data.chat_id);

      // Update history
      setHistory(prevHistory => [{ query, response: res.data.response }, ...prevHistory]);
    } catch (error) {
      console.error('Error processing request:', error);
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
  };

  const handleNewChat = async () => {
    if (!userEmail) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/new_chat`, {
        user_email: userEmail,
      });

      setCurrentChatId(res.data.chat_id);
      setQuery('');
      setResponse('');
      setDisplayedQuery('');
      setHasQueried(false);
      setHistory([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!userEmail) return;
    if (!currentChatId) {
      await handleNewChat();
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/upload_file`, formData, {
        params: {
          user_email: userEmail,
          chat_id: currentChatId,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const fetchChatHistory = async (chatId) => {
    if (!userEmail) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/chat_history`, {
        params: {
          user_email: userEmail,
          chat_id: chatId,
        },
      });
      setHistory(res.data.history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!userEmail) {
    return <div>Loading...</div>;
  }

  return (
    <div className="legal-lens-page">
      <main className="main-content">
        <button className="chat-toggle-button" onClick={toggleChatSidebar}>
          ☰
        </button>

        <button onClick={handleLogout} className="logout-button">Logout</button>

        {isChatSidebarOpen && (
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <button className="close-sidebar" onClick={toggleChatSidebar}>×</button>
            </div>
            <div className="chat-sidebar-content">
              <button className="new-chat-button" onClick={handleNewChat}>New Chat</button>
              {history.map((chat, index) => (
                <div key={index} className="chat-item" onClick={() => fetchChatHistory(chat.chat_id)}>
                  {chat.chat_name}
                </div>
              ))}
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
              <h3>Chat History</h3>
            </div>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <strong>Query:</strong> {item.query}
                  <br />
                  <strong>Response:</strong> {item.response}
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
                <ReactMarkdown>{response}</ReactMarkdown>
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
              Powered by Gemini 1.5 Pro
            </p>
            <div className="action-buttons">
              <button className="action-button" onClick={() => setQuery("Summarize my contract")}>Summarize my contract</button>
              <button className="action-button" onClick={() => setQuery("Identify key clauses")}>Key clause identification</button>
              <button className="action-button" onClick={() => setQuery("Analyze legal documents")}>Analyze legal documents</button>
            </div>
          </>
        )}

        <div className="query-section">
          <Uploadbutton onFileUpload={handleFileUpload} />
          <input
            type="text"
            placeholder="Ask me your queries..."
            className="query-input"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          />
          <button onClick={handleSendQuery} className="send-button">Send</button>
        </div>
      </main>
    </div>
  );
};

export default LegalLensPage;