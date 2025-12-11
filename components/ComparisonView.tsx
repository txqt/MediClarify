import React from 'react';
import { useMedical } from '../context/MedicalContext';
import { useNavigate } from 'react-router-dom';
import { MedicalTestResult } from '../types';
import { translations } from '../utils/translations';

const ComparisonView: React.FC = () => {
  const { compareItems, language } = useMedical();
  const navigate = useNavigate();
  const t = translations[language];

  if (compareItems.length !== 2) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{t.selectCompare}</p>
        <button 
          onClick={() => navigate('/history')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t.history}
        </button>
      </div>
    );
  }

  // Sort items by date: Oldest on Left (Before), Newest on Right (After)
  const [oldItem, newItem] = [...compareItems].sort((a, b) => a.date - b.date);

  // Merge Data for Table
  // Create a map of all unique test names found in both documents
  const allTestNames = Array.from(new Set([
    ...oldItem.data.results.map(r => r.test),
    ...newItem.data.results.map(r => r.test)
  ]));

  const getTestResult = (results: MedicalTestResult[], name: string) => {
    return results.find(r => r.test === name);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/history')}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t.backHistory}
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {t.compareTitle}
        </h1>
        <div className="w-24"></div> {/* Spacer for center alignment */}
      </div>

      {/* Top Cards Comparison */}
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        {/* Old Card */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
             {t.previous}
           </div>
           <h3 className="font-bold text-lg text-slate-800 mb-1">{formatDate(oldItem.date)}</h3>
           <p className="text-xs text-slate-500 truncate mb-4">{oldItem.fileName}</p>
           
           <div className="flex items-center gap-3">
             <div className="text-2xl font-bold text-slate-700">{oldItem.data.overallRiskScore}</div>
             <div className="text-xs text-slate-400">/ 100 Risk Score</div>
           </div>
        </div>

        {/* New Card */}
        <div className="bg-white p-6 rounded-xl border-2 border-blue-500 shadow-md relative">
           <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
             {t.latest}
           </div>
           <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
             {t.current}
           </div>
           <h3 className="font-bold text-lg text-slate-900 mb-1">{formatDate(newItem.date)}</h3>
           <p className="text-xs text-slate-500 truncate mb-4">{newItem.fileName}</p>
           
           <div className="flex items-center gap-3">
             <div className={`text-2xl font-bold ${
               newItem.data.overallRiskScore < oldItem.data.overallRiskScore ? 'text-green-600' : 
               newItem.data.overallRiskScore > oldItem.data.overallRiskScore ? 'text-red-600' : 'text-slate-700'
             }`}>
               {newItem.data.overallRiskScore}
             </div>
             <div className="text-xs text-slate-400">/ 100 Risk Score</div>
             {newItem.data.overallRiskScore < oldItem.data.overallRiskScore && (
               <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{t.improved}</span>
             )}
           </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-1/3">{t.testName}</th>
                <th className="px-6 py-4 w-1/4">{formatDate(oldItem.date)}</th>
                <th className="px-6 py-4 w-1/4 text-blue-700 font-bold">{formatDate(newItem.date)}</th>
                <th className="px-6 py-4 w-1/6">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allTestNames.map((testName, idx) => {
                const oldResult = getTestResult(oldItem.data.results, testName);
                const newResult = getTestResult(newItem.data.results, testName);

                // Determine change direction if numeric
                let changeIcon = null;
                if (oldResult?.numericValue && newResult?.numericValue) {
                   const diff = newResult.numericValue - oldResult.numericValue;
                   if (diff > 0) changeIcon = <span className="text-red-400">↑</span>;
                   if (diff < 0) changeIcon = <span className="text-green-500">↓</span>;
                   if (diff === 0) changeIcon = <span className="text-slate-300">-</span>;
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{testName}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {oldResult ? (
                        <span>{oldResult.value} <span className="text-xs opacity-50">{oldResult.unit}</span></span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                       {newResult ? (
                        <>
                          <span>{newResult.value} <span className="text-xs opacity-50">{newResult.unit}</span></span>
                          {changeIcon}
                        </>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {newResult && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          newResult.status === 'normal' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {newResult.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
        <h3 className="font-bold text-blue-800 mb-2">AI Summary of Changes</h3>
        <p className="text-blue-700 text-sm">
          {newItem.data.overallRiskScore < oldItem.data.overallRiskScore
             ? t.better
             : newItem.data.overallRiskScore > oldItem.data.overallRiskScore
             ? t.worse
             : t.stable
          }
        </p>
      </div>

    </div>
  );
};

export default ComparisonView;