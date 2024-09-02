import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage.jsx';
import LegalLensPage from './pages/LandingPage.jsx';

function App() {
 

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/home" element={<LegalLensPage />} />
        
      </Routes>
    </Router>
  )
}

export default App

