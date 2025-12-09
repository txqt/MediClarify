import React from 'react';
import { AnalysisData, Language, MedicalTestResult } from '../types';

interface AnalysisResultsProps {
  data: AnalysisData;
  language: Language;
}

const StatusBadge: React.FC<{ status: MedicalTestResult['status'] }> = ({ status }) => {
  const colors = {
    normal: 'bg-green-100 text-green-700 border-green-200',
    high: 'bg-red-100 text-red-700 border-red-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    abnormal: 'bg-red-100 text-red-700 border-red-200',
    borderline: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.normal}`}>
      {label}
    </span>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, language }) => {
  return (
    <div className="space-y-6 w-full">
      
      {/* Summary Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {language === 'en' ? 'Summary' : 'Tóm tắt'}
          </h2>
        </div>
        <p className="text-slate-600 leading-relaxed text-lg">
          {data.summary}
        </p>
      </div>

      {/* Abnormal Findings (if any) */}
      {data.abnormalFindings.length > 0 && (
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-4">
             <div className="p-2 bg-red-100 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-800">
              {language === 'en' ? 'Attention Needed' : 'Cần chú ý'}
            </h3>
          </div>
          <ul className="list-disc list-inside space-y-2 text-red-700">
            {data.abnormalFindings.map((finding, idx) => (
              <li key={idx} className="stagger-item" style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Results Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {language === 'en' ? 'Detailed Results' : 'Kết quả chi tiết'}
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.results.map((item, index) => (
            <div 
              key={index} 
              className="p-6 hover:bg-slate-50 transition-colors stagger-item"
              style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 text-lg">{item.test}</h4>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{item.explanation}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[140px] md:text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    {language === 'en' ? 'Value' : 'Giá trị'}
                  </p>
                  <p className="font-bold text-slate-800 text-lg break-words">{item.value}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'en' ? 'Range: ' : 'Phạm vi: '} {item.normalRange}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
         <div className="flex items-center mb-4">
             <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-800">
              {language === 'en' ? 'Questions for your Doctor' : 'Câu hỏi cho Bác sĩ'}
            </h3>
          </div>
        <ul className="space-y-3">
          {data.suggestedQuestions.map((q, idx) => (
            <li 
              key={idx} 
              className="flex items-start text-blue-900 bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-default stagger-item"
              style={{ animationDelay: `${0.6 + (idx * 0.1)}s` }}
            >
              <span className="font-bold mr-3 text-blue-500">{idx + 1}.</span>
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisResults;