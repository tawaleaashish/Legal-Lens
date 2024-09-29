import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPageContent from './components/MainPage.jsx';
import LegalLensPage from './pages/newLanding.jsx';

function App() {
 

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPageContent />} />
        <Route path="/home" element={<LegalLensPage />} />
        
      </Routes>
    </Router>
  )
}

export default App