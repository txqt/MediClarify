import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MedicalProvider, useMedical } from './context/MedicalContext';
import AnalyzerView from './components/AnalyzerView';

// --- About Page Component ---
const AboutPage: React.FC = () => (
  <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">About MediClarify</h2>
      <div className="prose prose-slate lg:prose-lg">
        <p>
          MediClarify is designed to bridge the gap between complex medical reports and patient understanding. 
          By leveraging Google's advanced Gemini 3 Pro AI model, we can analyze lab results, prescriptions, and medical notes instantly.
        </p>
        <h3 className="text-xl font-bold mt-6 mb-3">How it works</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Secure Analysis:</strong> Your documents are processed in memory and are not permanently stored on our servers.</li>
          <li><strong>Multimodal AI:</strong> We use OCR and vision capabilities to read both PDFs and images of physical documents.</li>
          <li><strong>Plain Language:</strong> The AI is specifically prompted to avoid medical jargon and explain results in terms a 5th grader could understand.</li>
        </ul>
        <h3 className="text-xl font-bold mt-6 mb-3">Disclaimer</h3>
        <p className="text-slate-600 italic">
          This tool is for educational purposes only. It does not replace professional medical advice. Always consult your doctor regarding your results.
        </p>
      </div>
    </div>
  </div>
);

// --- Navbar Component ---
const Navbar: React.FC = () => {
  const { language, setLanguage, isAnalyzing, resetApp } = useMedical();
  const location = useLocation();

  const toggleLanguage = () => {
    if (isAnalyzing) return;
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MediClarify</h1>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Analyzer
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
           {/* Mobile Nav Link (simplified) */}
           <Link to="/about" className="md:hidden text-sm text-slate-600 font-medium">About</Link>

           <button
            onClick={toggleLanguage}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 transition-all text-sm font-medium 
              ${isAnalyzing 
                ? 'opacity-50 cursor-not-allowed bg-slate-50' 
                : 'hover:bg-slate-50 hover:border-slate-300 active:scale-95'}
            `}
          >
            <span className={language === 'en' ? 'text-blue-600 font-bold' : 'text-slate-400'}>EN</span>
            <span className="text-slate-300">|</span>
            <span className={language === 'vi' ? 'text-blue-600 font-bold' : 'text-slate-400'}>VI</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// --- Floating Status Component ---
// Shows when analysis is running in background but user is on another page
const FloatingStatus: React.FC = () => {
  const { isAnalyzing, error } = useMedical();
  const location = useLocation();

  // If we are on the home page, the main UI shows the status, so hide this
  if (location.pathname === '/') return null;

  if (isAnalyzing) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <div className="bg-white rounded-lg shadow-lg border border-blue-100 p-4 flex items-center gap-4 max-w-sm">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Analyzing Document...</p>
            <p className="text-xs text-slate-500">You can keep browsing</p>
          </div>
          <Link to="/" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            View
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <div className="bg-white rounded-lg shadow-lg border border-red-100 p-4 flex items-center gap-4 max-w-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div>
            <p className="font-semibold text-red-800 text-sm">Analysis Failed</p>
            <p className="text-xs text-slate-500">Check analyzer for details</p>
          </div>
          <Link to="/" className="text-xs font-bold text-red-600 hover:text-red-800">
            View
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

// --- Main App Layout ---
const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AnalyzerView />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <FloatingStatus />
    </div>
  );
};

function App() {
  return (
    <Router>
      <MedicalProvider>
        <AppContent />
      </MedicalProvider>
    </Router>
  );
}

export default App;