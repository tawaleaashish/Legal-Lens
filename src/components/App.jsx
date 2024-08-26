import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';

function App() {
 

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        
      </Routes>
    </Router>
  )
}

export default App
