import React from 'react';
import { useMedical } from '../context/MedicalContext';
import FileUpload from './FileUpload';
import AnalysisResults from './AnalysisResults';
import QAChat from './QAChat';

// --- Sub-components moved from App.tsx ---

const HeroSection: React.FC = () => (
  <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 px-4 rounded-3xl mb-12 animate-fade-in border border-blue-50">
    <div className="max-w-4xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-blue-700 text-sm font-medium mb-6 hover:bg-blue-200 transition-colors cursor-default">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Powered by Gemini 3 Pro
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Understand Your Medical Results
        <span className="block text-blue-600 mt-2">In Plain Language</span>
      </h1>
      
      <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
        Upload your lab results or medical reports. We use advanced AI to translate complex medical terms into simple explanations you can actually understand.
      </p>
      
      {/* Trust indicators */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Private & Secure
        </div>
        <div className="flex items-center gap-2">
           <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Free to Use
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
          Multilingual Support
        </div>
      </div>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse mt-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
           <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
           <div className="space-y-3">
             <div className="h-4 bg-slate-200 rounded w-full"></div>
             <div className="h-4 bg-slate-200 rounded w-11/12"></div>
             <div className="h-4 bg-slate-200 rounded w-4/5"></div>
           </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
           <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
           {[1, 2, 3].map((i) => (
             <div key={i} className="flex justify-between items-center mb-6 last:mb-0">
                <div className="space-y-2 w-2/3">
                  <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded w-20"></div>
             </div>
           ))}
        </div>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 h-64"></div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 h-96"></div>
      </div>
    </div>
  </div>
);

const DisclaimerBanner: React.FC<{ language: string }> = ({ language }) => (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-lg shadow-sm animate-fade-in">
    <div className="flex items-start">
      <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="font-bold text-amber-800 text-sm">
          {language === 'en' ? 'Important Medical Disclaimer' : 'Lưu ý Y tế Quan trọng'}
        </p>
        <p className="text-amber-700 text-sm mt-1 leading-relaxed">
          {language === 'en' 
            ? 'This analysis is generated by AI and may contain errors. It is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult with your doctor.'
            : 'Phân tích này được tạo bởi AI và có thể chứa sai sót. Thông tin chỉ mang tính chất tham khảo và KHÔNG thay thế cho lời khuyên y tế chuyên nghiệp. Hãy luôn tham khảo ý kiến bác sĩ của bạn.'
          }
        </p>
      </div>
    </div>
  </div>
);

const AnalyzerView: React.FC = () => {
  const { 
    fileData, 
    analysisData, 
    isAnalyzing, 
    error, 
    language, 
    handleFileUpload, 
    resetApp, 
    setLanguage 
  } = useMedical();

  return (
    <div className="animate-fade-in">
      {/* Intro Section (only show if no file uploaded) */}
      {!fileData && <HeroSection />}

      {/* Upload Area */}
      {!analysisData && !isAnalyzing && (
        <div className={`transition-all duration-500 ease-in-out transform ${fileData ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'}`}>
            <FileUpload onFileUpload={handleFileUpload} disabled={!!fileData} />
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {language === 'en' ? 'Analyzing Document...' : 'Đang phân tích tài liệu...'}
            </h3>
            <p className="text-slate-500">
              {language === 'en' 
                ? 'AI is reading your document and translating medical terms.' 
                : 'AI đang đọc tài liệu và dịch các thuật ngữ y tế.'}
            </p>
            </div>
            <LoadingSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm animate-fade-in">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-800 font-semibold mb-1 text-lg">{language === 'en' ? 'Analysis Failed' : 'Phân tích thất bại'}</p>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={resetApp}
            className="px-6 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium shadow-sm transition-all hover:shadow"
          >
            {language === 'en' ? 'Try Another File' : 'Thử tệp khác'}
          </button>
        </div>
      )}

      {/* Results Dashboard */}
      {analysisData && fileData && (
        <div className="animate-fade-in">
          
          <DisclaimerBanner language={language} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Analysis (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              <AnalysisResults data={analysisData} language={language} />
            </div>

            {/* Right Column: Original File Preview & Chat (1/3 width) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* File Preview */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                    {language === 'en' ? 'Uploaded Document' : 'Tài liệu đã tải lên'}
                  </h3>
                </div>
                
                {fileData.mimeType === 'application/pdf' ? (
                    <div className="w-full h-48 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2 text-slate-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-xs font-medium">PDF Document</span>
                    </div>
                ) : (
                  <div className="relative group cursor-pointer overflow-hidden rounded-lg">
                    <img 
                      src={fileData.previewUrl} 
                      alt="Uploaded medical document" 
                      className="w-full h-auto max-h-64 object-contain rounded-lg border border-slate-200 bg-slate-50 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                  </div>
                )}
                <button 
                  onClick={resetApp}
                  className="w-full mt-4 py-2.5 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors border border-slate-200 font-medium"
                >
                  {language === 'en' ? 'Analyze New Document' : 'Phân tích tài liệu mới'}
                </button>
              </div>

              {/* Chat Interface */}
              <div className="sticky top-24">
                <QAChat initialLanguage={language} analysisData={analysisData} />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;