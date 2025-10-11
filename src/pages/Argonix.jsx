import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Argonix() {
  const navigate = useNavigate();

  useEffect(() => {
    // Open Argonix in a new tab/window instead of redirecting
    const newWindow = window.open('https://argonix.vercel.app/', '_blank');
    
    // If the new window was opened successfully, redirect back to home
    if (newWindow) {
      navigate('/');
    } else {
      // If popup was blocked, show fallback message
      console.log('Popup blocked, showing fallback');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-semibold mb-2">Opening Argonix Workshop...</h2>
        <p className="text-gray-300 text-sm mb-4">
          The workshop should open in a new tab. If it doesn't open automatically, 
          <a 
            href="https://argonix.vercel.app/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline ml-1"
          >
            click here
          </a>
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
        >
          Back to Luma
        </button>
      </div>
    </div>
  );
}
