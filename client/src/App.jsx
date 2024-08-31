import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage.jsx';

function App() {
 

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        
        
      </Routes>
    </Router>
  )
}

export default App

