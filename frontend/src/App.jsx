import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import History from './pages/History';
import NotFound from './pages/NotFound';

import { PredictionProvider } from './context/PredictionContext';

import './styles/global.css';
import './styles/navbar.css';
import './styles/dashboard.css';
import './styles/analyze.css';
import './styles/results.css';
import './styles/history.css';

export default function App() {
  return (
    <PredictionProvider>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </PredictionProvider>
  );
}
