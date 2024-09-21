// import React, { useRef, useEffect, useState } from 'react';
// import './LandingPage.css';
// import gsap from 'gsap';
// import logo from '../assets/logo.png';
// import Uploadbutton from '../components/Uploadbutton';
// import supabase from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import ReactMarkdown from 'react-markdown';

// const LegalLensPage = () => {
//   const [query, setQuery] = useState('');
//   const [response, setResponse] = useState('');
//   const [displayedQuery, setDisplayedQuery] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasQueried, setHasQueried] = useState(false);
//   const [history, setHistory] = useState([]);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
//   const [currentChatId, setCurrentChatId] = useState(null);
//   const navigate = useNavigate();

//   const logoItem = useRef(null);
//   const logoText = useRef(null);
//   const logoTag = useRef(null);

//   const handleQueryChange = (e) => {
//     setQuery(e.target.value);
//   };

//   const handleSendQuery = async () => {
//     if (!query) return;

//     setIsLoading(true);
//     setResponse('');
//     setDisplayedQuery(query);
//     setHasQueried(true);

//     try {
//       const res = await fetch('http://localhost:5000/api/query', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           user_email: 'user@example.com', // Replace with actual user email
//           query: query,
//           chat_id: currentChatId
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }

//       const data = await res.json();
//       setResponse(data.response);
//       setCurrentChatId(data.chat_id);

//       // Update history
//       setHistory(prevHistory => [{ query, response: data.response }, ...prevHistory]);
//     } catch (error) {
//       const errorMessage = 'Error processing request: ' + error.message;
//       setResponse(errorMessage);
//       setHistory(prevHistory => [{ query, response: errorMessage }, ...prevHistory]);
//     } finally {
//       setIsLoading(false);
//       setQuery('');
//     }
//   };

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   const toggleChatSidebar = () => {
//     setIsChatSidebarOpen(!isChatSidebarOpen);
//     if (isChatSidebarOpen && history.length > 0) {
//       const previousChat = history[0];
//       setQuery(previousChat.query);
//       setResponse(previousChat.response);
//       setHasQueried(true);
//     }
//   };

//   const handleNewChat = async () => {
//     try {
//       const res = await fetch('http://localhost:5000/api/new_chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           user_email: 'user@example.com', // Replace with actual user email
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }

//       const data = await res.json();
//       setCurrentChatId(data.chat_id);
//       setQuery('');
//       setResponse('');
//       setDisplayedQuery('');
//       setHasQueried(false);
//       setHistory([]);
//     } catch (error) {
//       console.error('Error creating new chat:', error);
//     }
//   };

//   useEffect(() => {
//     gsap.to(logoItem.current, {
//       opacity: 1,
//       y: -20,
//       duration: 2,
//       ease: 'power3.out',
//       delay: 0.2,
//     });
//   }, []);

//   useEffect(() => {
//     gsap.to(logoText.current, {
//       opacity: 1,
//       y: -20,
//       duration: 2,
//       ease: 'power3.out',
//       delay: 0.2,
//     });
//   }, []);

//   useEffect(() => {
//     gsap.to(logoTag.current, {
//       opacity: 1,
//       y: -20,
//       duration: 2,
//       ease: 'power3.out',
//       delay: 0.2,
//     });
//   }, []);

//   useEffect(() => {
//     const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
//       if (event === 'SIGNED_IN') {
//         console.log('User signed in:', session.user);
//         navigate('/home');
//       }
//     });

//     return () => {
//       authListener.subscription.unsubscribe();
//     };
//   }, [navigate]);

//   return (
//     <div className="legal-lens-page">
//       <main className="main-content">
//         <button className="chat-toggle-button" onClick={toggleChatSidebar}>
//           ☰
//         </button>

//         <button onClick={async () => {
//             const { error } = await supabase.auth.signOut();
//             if (!error) {
//               navigate('/');
//             } else {
//               console.error(error);
//               navigate('/');
//             }
//           }} className="logout-button">Logout</button>

//         {isChatSidebarOpen && (
//           <div className="chat-sidebar">
//             <div className="chat-sidebar-header">
//               <button className="close-sidebar" onClick={toggleChatSidebar}>×</button>
//             </div>
//             <div className="chat-sidebar-content">
//               <button className="new-chat-button" onClick={handleNewChat}>New Chat</button>
//             </div>
//           </div>
//         )}

//         {history.length > 0 && (
//           <button className="toggle-sidebar" onClick={toggleSidebar}>
//             {isSidebarOpen ? 'Hide History' : 'Show History'}
//           </button>
//         )}

//         {isSidebarOpen && (
//           <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
//             <div className="sidebar-header">
//               <h3>Chat History</h3>
//             </div>
//             <div className="history-list">
//               {history.map((item, index) => (
//                 <div key={index} className="history-item">
//                   <strong>Query:</strong> {item.query}
//                   <br />
//                   <strong>Response:</strong> {item.response}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {hasQueried && (
//           <div className="response-section">
//             {isLoading ? (
//               <div className="loading-indicator">Loading...</div>
//             ) : (
//               <div>
//                 <h3>Query:</h3>
//                 <p>{displayedQuery}</p>
//                 <h3>Response:</h3>
//                 <ReactMarkdown>{response}</ReactMarkdown>
//               </div>
//             )}
//           </div>
//         )}

//         {!hasQueried && (
//           <>
//             <div className="icon-section">
//               <img
//                 ref={logoItem}
//                 src={logo}
//                 alt="Legal Lens Icon"
//                 className="legal-lens-icon"
//               />
//             </div>
//             <h1 ref={logoText} className="heading">
//               Legal Lens
//             </h1>
//             <p ref={logoTag} className="tagline">
//               Decoding Legal Jargon
//             </p>
//             <div className="action-buttons">
//               <button className="action-button">Summarize my contract</button>
//               <button className="action-button">Key clause identification</button>
//               <button className="action-button">Analyze legal documents</button>
//             </div>
//           </>
//         )}

//         <div className="query-section">
//           <Uploadbutton />
//           <input
//             type="text"
//             placeholder="Ask me your queries..."
//             className="query-input"
//             value={query}
//             onChange={handleQueryChange}
//             onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
//           />
//           <button onClick={handleSendQuery} className="send-button">Send</button>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default LegalLensPage;





import React, { useRef, useEffect, useState } from 'react';
import './LandingPage.css';  // You'll need to create this CSS file
import gsap from 'gsap';
import logo from '../assets/logo.png';  // Make sure this path is correct
import Uploadbutton from '../components/Uploadbutton';  // Make sure this component exists
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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
      const res = await fetch('http://localhost:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: 'user@example.com', // Replace with actual user email
          query: query,
          chat_id: currentChatId
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
      setCurrentChatId(data.chat_id);

      // Update history
      setHistory(prevHistory => [{ query, response: data.response }, ...prevHistory]);
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

  const handleNewChat = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/new_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: 'user@example.com', // Replace with actual user email
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setCurrentChatId(data.chat_id);
      setQuery('');
      setResponse('');
      setDisplayedQuery('');
      setHasQueried(false);
      setHistory([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  useEffect(() => {
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
  }, []);

  return (
    <div className="legal-lens-page">
      <main className="main-content">
        <button className="chat-toggle-button" onClick={toggleChatSidebar}>
          ☰
        </button>

        <button onClick={() => navigate('/')} className="logout-button">Logout</button>

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
              Powered by Gemini 1.5 Flash
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
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          />
          <button onClick={handleSendQuery} className="send-button">Send</button>
        </div>
      </main>
    </div>
  );
};

export default LegalLensPage;