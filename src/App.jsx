import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import AIInteraction from './pages/AIInteraction';
import LiquidEther from './pages/LiquidEther';
import Argonix from './pages/Argonix';

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/ai-interaction" element={<AIInteraction />} />
        <Route path="/liquid-ether" element={<LiquidEther />} />
        <Route path="/argonix" element={<Argonix />} />
      </Routes>
    </Router>
  );
}

export default App;
