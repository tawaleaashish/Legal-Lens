import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { gsap } from 'gsap';
import './LandingPage.css';
import logo from '../assets/logo.png';
import Uploadbutton from '../components/Uploadbutton';
import supabase from '../supabaseClient';

const API_BASE_URL =  import.meta.env.DEV ? 'http://localhost:8000/api' : "https://legal-lens-production.up.railway.app/api";


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
  const [userChats, setUserChats] = useState([]);
  const responseRef = useRef(null);

  const navigate = useNavigate();

  const logoItem = useRef(null);
  const logoText = useRef(null);
  const logoTag = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
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
        fetchUserChats(user.email);
        navigate('/home'); // Navigate to /home on reload
      } else {
        navigate('/login');
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
        fetchUserChats(user.email);
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserChats = async (email) => {
    setIsLoadingChats(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user_chats`, {
        params: { user_email: email }
      });
      setUserChats(response.data.chats);
    } catch (error) {
      console.error('Error fetching user chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

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

      if (res.data.chat_name) {
        setUserChats(prevChats => [...prevChats, { chat_id: res.data.chat_id, chat_name: res.data.chat_name }]);
      }

      // Fetch updated chat history
      fetchChatHistory(res.data.chat_id);
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage = 'Error processing request: ' + error.message;
      setResponse(errorMessage);
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
    let chat_id
    try {
      const res = await axios.post(`${API_BASE_URL}/new_chat`, {
        user_email: userEmail,
      });
      // console.log(res.data.chat_id)
      chat_id=res.data.chat_id
      setCurrentChatId(res.data.chat_id);
      setQuery('');
      setResponse('');
      setDisplayedQuery('');
      setHasQueried(false);
      setHistory([]);
      navigate('/home')
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
    return(chat_id[0])
    
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !userEmail) return;
    let new_chat_id;
    if (!currentChatId) {
      new_chat_id=await handleNewChat();
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('chat_id', currentChatId??new_chat_id);
    formData.append('file',file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload_file`, formData, {
        
      });
      
      setUploadedFile(response.data.file_name);
      console.log('File uploaded:', response.data.file_name);
      setResponse(response.data.message);
      navigate('/home');
    } catch (error) {
      console.error('Error uploading file:', error);
      setResponse(`Error uploading file: ${error.message}`);
      setHasQueried(true);
    } finally {
      setIsLoading(false);
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
      setHasQueried(true);
      setCurrentChatId(chatId);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const scrollToBottom = () => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

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
            </div>
          </div>
        )}

        {history.length >= 0 && (
          <button className="toggle-sidebar" onClick={toggleSidebar}>
            {isSidebarOpen ? 'Hide History' : 'Show History'}
          </button>
        )}

         {isSidebarOpen && (
          <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
            </div>
            <div className="history-list">
              {userChats.map((chat) => (
                <div
                  key={chat.chat_id}
                  className={`history-item ${chat.chat_id === currentChatId ? 'active' : ''}`}
                  onClick={() => fetchChatHistory(chat.chat_id)}
                >
                  {chat.chat_name}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasQueried && (
          <div className="response-section" ref={responseRef}>
            {isLoading ? (
              <div className="loading-indicator">Loading...</div>
            ) : (
              <div className="chat-history">
                {history.map((item, index) => (
                  <div key={index} className={`chat-item ${item.query_response ? 'query' : 'response'}`}>
                    <strong>{item.query_response ? 'Query:' : 'Response:'}</strong>
                    <ReactMarkdown>{item.data.content}</ReactMarkdown>
                  </div>
                ))}
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
              <button className="action-button" onClick={() => setQuery("Summarize my contract")}>Summarize my contract</button>
              <button className="action-button" onClick={() => setQuery("Identify key clauses")}>Key clause identification</button>
              <button className="action-button" onClick={() => setQuery("Analyze legal documents")}>Analyze legal documents</button>
            </div>
            
          </>
        )}

        <div className="query-section">
          <Uploadbutton fileHandler={handleFileUpload} />
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