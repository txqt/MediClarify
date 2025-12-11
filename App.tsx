import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MedicalProvider, useMedical } from './context/MedicalContext';
import AnalyzerView from './components/AnalyzerView';
import HistoryView from './components/HistoryView';
import ComparisonView from './components/ComparisonView';
import { translations } from './utils/translations';
import { Language } from './types';

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
  const { language, setLanguage, isAnalyzing, analysisData } = useMedical();
  const location = useLocation();
  const t = translations[language];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const isActive = (path: string) => location.pathname === path;

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
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              {analysisData ? (language === 'en' ? 'View Results' : t.view) : 'Analyzer'}
            </Link>
            <Link 
              to="/history" 
              className={`text-sm font-medium transition-colors ${isActive('/history') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              {t.history}
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
           {/* Mobile Nav Link (simplified) */}
           <Link to="/history" className="md:hidden text-sm text-slate-600 font-medium">{t.history}</Link>

           <div className="relative">
             <select
               value={language}
               onChange={handleLanguageChange}
               disabled={isAnalyzing}
               className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <option value="en">English 🇺🇸</option>
               <option value="vi">Tiếng Việt 🇻🇳</option>
               <option value="zh">中文 🇨🇳</option>
               <option value="ru">Русский 🇷🇺</option>
               <option value="fr">Français 🇫🇷</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
};

// --- Floating Status Component ---
const FloatingStatus: React.FC = () => {
  const { isAnalyzing, error, analysisData, language } = useMedical();
  const location = useLocation();
  const t = translations[language];

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
            <p className="font-semibold text-slate-800 text-sm">
              {t.analyzing}
            </p>
            <p className="text-xs text-slate-500">
              {language === 'en' ? 'You can keep browsing' : '...'}
            </p>
          </div>
          <Link to="/" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            {t.view}
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
            <p className="font-semibold text-red-800 text-sm">
              {t.analysisFailed}
            </p>
            <p className="text-xs text-slate-500">Check analyzer for details</p>
          </div>
          <Link to="/" className="text-xs font-bold text-red-600 hover:text-red-800">
            {t.view}
          </Link>
        </div>
      </div>
    );
  }

  if (analysisData) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <Link 
          to="/" 
          className="bg-white rounded-lg shadow-lg border border-emerald-100 p-4 flex items-center gap-4 max-w-sm hover:shadow-xl transition-all group"
        >
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {t.resultsAvailable}
            </p>
            <p className="text-xs text-slate-500">
              {t.clickToView}
            </p>
          </div>
        </Link>
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
          <Route path="/history" element={<HistoryView />} />
          <Route path="/compare" element={<ComparisonView />} />
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