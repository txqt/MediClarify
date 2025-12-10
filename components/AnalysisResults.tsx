import React, { useState } from 'react';
import { AnalysisData, Language, MedicalTestResult } from '../types';
import { useMedical } from '../context/MedicalContext';

interface AnalysisResultsProps {
  data: AnalysisData;
  language: Language;
}

// --- Helper Components ---

const SeverityBadge: React.FC<{ severity?: MedicalTestResult['severity']; status: string }> = ({ severity, status }) => {
  if (status === 'normal' && !severity) severity = 'none';

  const styles = {
    none: 'bg-green-100 text-green-700 border-green-200',
    mild: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    moderate: 'bg-orange-100 text-orange-800 border-orange-200',
    concerning: 'bg-red-100 text-red-700 border-red-200',
    critical: 'bg-red-200 text-red-800 border-red-300 font-bold',
    unknown: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  const labels = {
    none: 'Normal',
    mild: 'Mild',
    moderate: 'Moderate',
    concerning: 'High',
    critical: 'Critical',
    unknown: 'Unknown'
  };

  const key = (severity as keyof typeof styles) || 'unknown';
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[key]} whitespace-nowrap`}>
      {labels[key]}
    </span>
  );
};

// Visual Bar Chart for Ranges
const RangeVisualizer: React.FC<{ item: MedicalTestResult }> = ({ item }) => {
  const { numericValue: val, rangeLow: low, rangeHigh: high } = item;
  
  // Need valid numbers to render chart
  if (val === undefined || low === undefined || high === undefined || high === 0) return null;

  // Calculate visualization bounds (adds 20% padding around the range)
  const rangeSpan = high - low;
  const minVis = Math.max(0, low - (rangeSpan * 0.5));
  const maxVis = high + (rangeSpan * 0.5);
  const totalVisSpan = maxVis - minVis;

  // Percentages for CSS
  const toPercent = (v: number) => Math.min(100, Math.max(0, ((v - minVis) / totalVisSpan) * 100));
  
  const leftPct = toPercent(low);
  const widthPct = toPercent(high) - leftPct;
  const valPct = toPercent(val);

  const isOutOfRange = val < low || val > high;
  const dotColor = isOutOfRange ? 'bg-red-500 ring-red-200' : 'bg-green-600 ring-green-200';

  return (
    <div className="mt-3 w-full max-w-xs">
      <div className="relative h-2 w-full bg-slate-100 rounded-full mb-1">
        {/* Normal Range Bar (Grey/Green) */}
        <div 
          className="absolute h-full bg-slate-300 rounded-full opacity-50"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        ></div>
        
        {/* Value Dot */}
        <div 
          className={`absolute top-1/2 w-3 h-3 rounded-full shadow-sm ring-2 ${dotColor} transition-all duration-500`}
          style={{ left: `${valPct}%`, transform: 'translate(-50%, -50%)' }}
        ></div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
        <span>{low}</span>
        <span className={isOutOfRange ? 'text-red-500 font-bold' : 'text-slate-500'}>{val}</span>
        <span>{high}</span>
      </div>
    </div>
  );
};

// --- Main Component ---

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, language }) => {
  const { setPrefilledMessage } = useMedical();
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');

  // Risk Level Colors
  const riskColor = {
    low: 'bg-green-100 text-green-800 border-green-200',
    moderate: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    high: 'bg-orange-50 text-orange-800 border-orange-200',
    critical: 'bg-red-50 text-red-800 border-red-200',
  }[data.overallRiskLevel] || 'bg-slate-100 text-slate-800';

  const riskLabel = {
    low: language === 'en' ? 'Low Risk' : 'Nguy cơ thấp',
    moderate: language === 'en' ? 'Moderate Risk' : 'Nguy cơ trung bình',
    high: language === 'en' ? 'High Risk' : 'Nguy cơ cao',
    critical: language === 'en' ? 'Critical Attention Needed' : 'Cần chú ý khẩn cấp',
  }[data.overallRiskLevel];

  // Check for critical 10x errors
  const suspiciousValues = data.results.filter(r => r.notes?.includes('10x') || r.status === 'critical');

  return (
    <div className="space-y-6 w-full">
      
      {/* 1. Overall Risk Meter & Toggle Header */}
      <div className={`rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in ${riskColor}`}>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
            {language === 'en' ? 'Overall Health Snapshot' : 'Tổng quan sức khỏe'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{riskLabel}</div>
            <div className="hidden sm:block h-6 w-px bg-current opacity-20"></div>
            {/* Simple Score Gauge */}
            <div className="flex items-center gap-2" title="Aggregate Health Score">
              <div className="w-24 h-2.5 bg-white/50 rounded-full overflow-hidden border border-black/5">
                <div 
                  className="h-full bg-current transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(100, data.overallRiskScore)}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold">{data.overallRiskScore}/100</span>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-white/50 p-1 rounded-lg border border-black/5 self-start md:self-center">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'simple' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {language === 'en' ? 'Patient View' : 'Người bệnh'}
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'technical' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {language === 'en' ? 'Doctor View' : 'Bác sĩ'}
          </button>
        </div>
      </div>

      {/* 2. Verification Alert (Hackathon "Safety" Feature) */}
      {suspiciousValues.length > 0 && (
        <div className="bg-white border-l-4 border-red-500 shadow-md p-4 rounded-r-lg animate-pulse-ring relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-800">
                {language === 'en' ? 'Data Verification Required' : 'Cần xác minh dữ liệu'}
              </h3>
              <p className="text-sm text-red-700 mb-2">
                {language === 'en' 
                  ? 'We detected potential errors or biologically impossible values. Please verify these specific results against your original document.'
                  : 'Phát hiện giá trị bất thường hoặc không thể xảy ra. Vui lòng kiểm tra lại so với tài liệu gốc.'
                }
              </p>
              <div className="flex flex-wrap gap-2">
                {suspiciousValues.map((v, i) => (
                   <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-mono border border-red-200">
                     {v.test}: {v.value}
                   </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Summary Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
           <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           {language === 'en' ? 'Summary' : 'Tóm tắt'}
        </h2>
        <p className="text-slate-600 leading-relaxed text-base">
          {data.summary}
        </p>
      </div>

      {/* 4. Detailed Results Grid with Charts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">
            {language === 'en' ? 'Detailed Analysis' : 'Phân tích chi tiết'}
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.results.map((item, index) => (
            <div 
              key={index} 
              className="p-5 hover:bg-slate-50 transition-colors stagger-item group"
              style={{ animationDelay: `${0.2 + (index * 0.05)}s` }}
            >
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                
                {/* Left: Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900">{item.test}</h4>
                    <SeverityBadge severity={item.severity} status={item.status} />
                  </div>
                  
                  {/* Toggle Logic for Explanations */}
                  <div className="text-sm leading-relaxed">
                    {viewMode === 'simple' ? (
                      <p className="text-slate-600">{item.explanation}</p>
                    ) : (
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-slate-700 text-xs font-medium">
                        <span className="text-blue-600 font-bold block mb-1 uppercase tracking-wider text-[10px]">Clinical Context</span>
                        {item.technicalExplanation || item.explanation}
                      </div>
                    )}
                  </div>
                  
                  {/* Warnings */}
                  {item.notes && (
                    <div className="text-xs font-medium text-amber-700 flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {item.notes}
                    </div>
                  )}
                </div>

                {/* Right: Value, Range & Chart */}
                <div className="md:w-48 flex-shrink-0 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50 md:bg-transparent md:border-0 md:p-0">
                  <div className="flex justify-between md:flex-col md:items-end gap-1">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Value</span>
                      <span className={`font-bold ${item.status !== 'normal' ? 'text-blue-700' : 'text-slate-800'}`}>
                        {item.value} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </span>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Range</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {item.normalRange}
                      </span>
                    </div>
                  </div>
                  
                  {/* The Chart (Hackathon feature) */}
                  <RangeVisualizer item={item} />
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Suggested Questions */}
      <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          {language === 'en' ? 'Ask Your Doctor' : 'Hỏi bác sĩ'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.suggestedQuestions.map((q, idx) => (
            <button 
              key={idx} 
              onClick={() => setPrefilledMessage(q)}
              className="text-left text-sm text-blue-800 bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md hover:bg-blue-50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;