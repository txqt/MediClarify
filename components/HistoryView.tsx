import React, { useMemo, useEffect } from 'react';
import { useMedical } from '../context/MedicalContext';
import { HistoryItem, Language } from '../types';
import { useNavigate } from 'react-router-dom';
import { translations } from '../utils/translations';

const HistoryView: React.FC = () => {
  const { 
    history, 
    deleteHistoryItem, 
    compareItems, 
    setCompareItems, 
    loadHistoryItem, 
    language,
    prepareComparison,
    isAnalyzing,
    resetApp
  } = useMedical();
  
  const navigate = useNavigate();
  const t = translations[language];

  // Clear active session on mount to ensure Navbar language selector 
  // doesn't trigger analysis of a stale file.
  useEffect(() => {
    resetApp();
  }, []); // Run once on mount

  // Language Flags/Labels
  const langLabels: Record<Language, string> = {
    en: "🇺🇸 EN",
    vi: "🇻🇳 VI",
    zh: "🇨🇳 ZH",
    ru: "🇷🇺 RU",
    fr: "🇫🇷 FR"
  };

  // Group History Items by Base64 (Source File)
  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    
    history.forEach(item => {
      // Use base64 as unique identifier for the document content
      // Fallback to fileName for legacy support (though base64 should exist)
      const key = item.base64 || item.fileName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // Convert to array and sort by the date of the *latest* item in each group
    return Object.values(groups).sort((groupA, groupB) => {
      const maxDateA = Math.max(...groupA.map(i => i.date));
      const maxDateB = Math.max(...groupB.map(i => i.date));
      return maxDateB - maxDateA;
    });
  }, [history]);

  const toggleSelection = (group: HistoryItem[]) => {
    // When selecting for comparison, we select the LATEST item from the group
    // This allows the user to click the "Card" to toggle
    const latestItem = group.sort((a, b) => b.date - a.date)[0];
    const isSelected = compareItems.some(i => i.id === latestItem.id);
    
    if (isSelected) {
      setCompareItems(compareItems.filter(i => i.id !== latestItem.id));
    } else {
      if (compareItems.length >= 2) {
        // If 2 are selected, remove the first one and add new one (FIFO-ish for UX)
        const [first, ...rest] = compareItems;
        setCompareItems([...rest, latestItem]);
      } else {
        setCompareItems([...compareItems, latestItem]);
      }
    }
  };

  // Validation Logic
  const isSelectionValid = compareItems.length === 2;
  const isTypeMismatch = isSelectionValid && compareItems[0].documentType !== compareItems[1].documentType;

  const handleCompare = async () => {
    if (isSelectionValid && !isTypeMismatch && !isAnalyzing) {
      // Prepare comparisons checks if selected items match the current app language.
      // If not, it analyzes/translates them on the fly.
      const success = await prepareComparison(compareItems, language);
      if (success) {
        navigate('/compare');
      }
    }
  };

  const handleViewDetails = (id: string) => {
    loadHistoryItem(id);
    navigate('/');
  };

  const handleDeleteGroup = (group: HistoryItem[]) => {
    // Delete all items in the group
    if (window.confirm("Are you sure you want to delete this document and all its translations?")) {
      group.forEach(item => deleteHistoryItem(item.id));
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700">
            {t.noHistory}
        </h2>
        <p className="text-slate-500 mt-2">
            {t.noHistorySub}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {t.history}
          </h2>
          <p className="text-slate-500 text-sm">
            {t.selectCompare}
          </p>
        </div>

        <button
          onClick={handleCompare}
          disabled={!isSelectionValid || isTypeMismatch || isAnalyzing}
          className={`px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2
            ${(!isSelectionValid || isTypeMismatch || isAnalyzing) 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}
          `}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.analyzing}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              {t.compare}
            </>
          )}
        </button>
      </div>

      {isTypeMismatch && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3 animate-fade-in">
           <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <span className="text-red-700 font-medium text-sm">
             {t.typeMismatch}
           </span>
        </div>
      )}

      {isAnalyzing && (
         <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-center gap-3 animate-pulse">
           <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <span className="text-blue-700 font-medium text-sm">
             {t.analyzingSub}
           </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupedHistory.map((group) => {
          // Identify the 'primary' item for this group (latest analysis)
          // Sort descending by date
          const sortedGroupItems = [...group].sort((a, b) => b.date - a.date);
          const latestItem = sortedGroupItems[0];
          
          // Determine unique languages available
          const availableLanguages = Array.from(new Set(sortedGroupItems.map(i => i.language || 'en')));

          const isSelected = compareItems.some(i => i.id === latestItem.id);
          const typeColor = {
             'Blood Test': 'bg-red-100 text-red-800',
             'Urinalysis': 'bg-yellow-100 text-yellow-800',
             'Prescription': 'bg-blue-100 text-blue-800',
             'Radiology Report': 'bg-gray-100 text-gray-800',
          }[latestItem.documentType] || 'bg-slate-100 text-slate-800';

          return (
            <div 
              key={latestItem.base64 || latestItem.fileName}
              onClick={() => toggleSelection(group)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group flex flex-col h-full
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-white bg-white shadow-sm hover:border-blue-200 hover:shadow-md'}
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <div className="flex gap-4 mb-2">
                 {/* Thumbnail Placeholder */}
                 <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 relative">
                    {latestItem.previewUrl ? (
                      <img src={latestItem.previewUrl} alt="doc" className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 inline-block ${typeColor}`}>
                         {latestItem.documentType}
                       </span>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); }}
                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors"
                        title={t.deleteAll}
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                           <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                         </svg>
                       </button>
                    </div>
                    <h3 className="font-bold text-slate-800 truncate" title={latestItem.fileName}>{latestItem.fileName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(latestItem.date).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                       <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                         Score: {latestItem.data.overallRiskScore}
                       </div>
                       {latestItem.data.overallRiskLevel === 'critical' || latestItem.data.overallRiskLevel === 'high' ? (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                       ) : null}
                    </div>
                 </div>
              </div>

              {/* Language Versions (New Feature) */}
              <div className="bg-slate-50 rounded-lg p-2.5 mb-2 mt-auto border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">{t.availableLangs}</span>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map(lang => {
                    // Find specific ID for this language
                    // If multiple exist for same language, take the newest one
                    const specificItem = sortedGroupItems.find(i => (i.language || 'en') === lang);
                    if (!specificItem) return null;

                    return (
                      <button
                        key={lang}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(specificItem.id);
                        }}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm"
                      >
                        {langLabels[lang] || lang.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* View Latest Details Button */}
              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent toggling selection
                    handleViewDetails(latestItem.id);
                  }}
                  className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.viewFull}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryView;