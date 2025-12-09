import React from 'react';
import { AnalysisData, Language, MedicalTestResult } from '../types';
import { useMedical } from '../context/MedicalContext';

interface AnalysisResultsProps {
  data: AnalysisData;
  language: Language;
}

const SeverityBadge: React.FC<{ severity?: MedicalTestResult['severity']; status: string }> = ({ severity, status }) => {
  // Fallback if severity is missing but status is normal
  if (status === 'normal' && !severity) severity = 'none';

  const styles = {
    none: 'bg-green-100 text-green-700 border-green-200',
    mild: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    moderate: 'bg-orange-100 text-orange-800 border-orange-200',
    concerning: 'bg-red-100 text-red-700 border-red-200',
    unknown: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  const labels = {
    none: 'Normal',
    mild: 'Mild',
    moderate: 'Moderate',
    concerning: 'Concerning',
    unknown: 'Unknown'
  };

  const key = (severity as keyof typeof styles) || 'unknown';
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[key]}`}>
      {labels[key]}
    </span>
  );
};

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
  let color = 'bg-red-400';
  if (score > 80) color = 'bg-green-400';
  else if (score > 50) color = 'bg-yellow-400';

  return (
    <div className="flex items-center gap-1" title={`AI Confidence: ${score}%`}>
      <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }}></div>
      </div>
      <span className="text-[10px] text-slate-400">{score}%</span>
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, language }) => {
  const { setPrefilledMessage } = useMedical();

  return (
    <div className="space-y-6 w-full">
      
      {/* Disclaimer Banner (Small internal one) */}
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 text-center">
        {language === 'en' 
          ? "AI generated. Not a diagnosis. Consult a doctor." 
          : "Được tạo bởi AI. Không phải chẩn đoán. Hãy hỏi bác sĩ."}
      </div>

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

      {/* Errors / Warnings Detected */}
      {data.errorsDetected && data.errorsDetected.length > 0 && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6 animate-fade-in">
           <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center">
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             {language === 'en' ? 'Data Quality Warnings' : 'Cảnh báo dữ liệu'}
           </h3>
           <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
             {data.errorsDetected.map((err, i) => <li key={i}>{err}</li>)}
           </ul>
        </div>
      )}

      {/* Attention Needed */}
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
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {language === 'en' ? 'Detailed Results' : 'Kết quả chi tiết'}
          </h2>
          <span className="text-xs text-slate-400">Confidence Score</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.results.map((item, index) => (
            <div 
              key={index} 
              className="p-6 hover:bg-slate-50 transition-colors stagger-item group"
              style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 text-lg">{item.test}</h4>
                    <SeverityBadge severity={item.severity} status={item.status} />
                    <ConfidenceIndicator score={item.confidence} />
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{item.explanation}</p>
                  {item.notes && (
                    <p className="text-xs text-amber-600 font-medium flex items-center bg-amber-50 inline-block px-2 py-1 rounded">
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[140px] md:text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    {language === 'en' ? 'Value' : 'Giá trị'}
                  </p>
                  <p className={`font-bold text-lg break-words ${item.status !== 'normal' ? 'text-blue-900' : 'text-slate-800'}`}>
                    {item.value}
                  </p>
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
            <div>
              <h3 className="text-lg font-bold text-blue-800">
                {language === 'en' ? 'Questions for your Doctor' : 'Câu hỏi cho Bác sĩ'}
              </h3>
              <p className="text-xs text-blue-600 mt-0.5">
                 {language === 'en' ? 'Click to ask AI assistant' : 'Bấm vào để hỏi AI'}
              </p>
            </div>
          </div>
        <ul className="space-y-3">
          {data.suggestedQuestions.map((q, idx) => (
            <li 
              key={idx} 
              onClick={() => setPrefilledMessage(q)}
              className="flex items-start text-blue-900 bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer stagger-item group active:scale-[0.99]"
              style={{ animationDelay: `${0.6 + (idx * 0.1)}s` }}
            >
              <span className="font-bold mr-3 text-blue-300 group-hover:text-blue-500 transition-colors">{idx + 1}.</span>
              <span className="flex-1">{q}</span>
              <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisResults;