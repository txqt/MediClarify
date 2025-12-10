import React from 'react';
import { useMedical } from '../context/MedicalContext';
import { HistoryItem, Language } from '../types';
import { useNavigate } from 'react-router-dom';

const HistoryView: React.FC = () => {
  const { history, deleteHistoryItem, compareItems, setCompareItems, loadHistoryItem, language } = useMedical();
  const navigate = useNavigate();

  const toggleSelection = (item: HistoryItem) => {
    const isSelected = compareItems.some(i => i.id === item.id);
    
    if (isSelected) {
      setCompareItems(compareItems.filter(i => i.id !== item.id));
    } else {
      if (compareItems.length >= 2) {
        // If 2 are selected, remove the first one and add new one to keep it user friendly
        const [first, ...rest] = compareItems;
        setCompareItems([...rest, item]);
      } else {
        setCompareItems([...compareItems, item]);
      }
    }
  };

  // Validation Logic
  const isSelectionValid = compareItems.length === 2;
  const isTypeMismatch = isSelectionValid && compareItems[0].documentType !== compareItems[1].documentType;

  const handleCompare = () => {
    if (isSelectionValid && !isTypeMismatch) {
      navigate('/compare');
    }
  };

  const handleViewDetails = (id: string) => {
    loadHistoryItem(id);
    navigate('/');
  };

  // Sort by date descending
  const sortedHistory = [...history].sort((a, b) => b.date - a.date);

  if (history.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700">
            {language === 'en' ? 'No Analysis History' : 'Chưa có lịch sử phân tích'}
        </h2>
        <p className="text-slate-500 mt-2">
            {language === 'en' 
             ? 'Upload documents to build your health history.' 
             : 'Tải lên tài liệu để tạo lịch sử sức khỏe của bạn.'}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {language === 'en' ? 'History' : 'Lịch sử'}
          </h2>
          <p className="text-slate-500 text-sm">
            {language === 'en' ? 'Select 2 items to compare progress.' : 'Chọn 2 mục để so sánh tiến độ.'}
          </p>
        </div>

        <button
          onClick={handleCompare}
          disabled={!isSelectionValid || isTypeMismatch}
          className={`px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2
            ${(!isSelectionValid || isTypeMismatch) 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
          {language === 'en' ? 'Compare' : 'So sánh'}
        </button>
      </div>

      {isTypeMismatch && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3 animate-fade-in">
           <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <span className="text-red-700 font-medium text-sm">
             {language === 'en' 
               ? 'Cannot compare different document types. Please select two similar documents (e.g., 2 Blood Tests).' 
               : 'Không thể so sánh các loại tài liệu khác nhau. Vui lòng chọn 2 tài liệu giống nhau (ví dụ: 2 Xét nghiệm máu).'}
           </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedHistory.map((item) => {
          const isSelected = compareItems.some(i => i.id === item.id);
          const typeColor = {
             'Blood Test': 'bg-red-100 text-red-800',
             'Urinalysis': 'bg-yellow-100 text-yellow-800',
             'Prescription': 'bg-blue-100 text-blue-800',
             'Radiology Report': 'bg-gray-100 text-gray-800',
          }[item.documentType] || 'bg-slate-100 text-slate-800';

          return (
            <div 
              key={item.id}
              onClick={() => toggleSelection(item)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group flex flex-col
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

              <div className="flex gap-4 mb-4">
                 {/* Thumbnail Placeholder */}
                 <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                 </div>
                 
                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 inline-block ${typeColor}`}>
                         {item.documentType}
                       </span>
                       <button 
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors"
                        title={language === 'en' ? 'Delete' : 'Xóa'}
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                           <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                         </svg>
                       </button>
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.fileName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                       <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                         Score: {item.data.overallRiskScore}
                       </div>
                       {item.data.overallRiskLevel === 'critical' || item.data.overallRiskLevel === 'high' ? (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                       ) : null}
                    </div>
                 </div>
              </div>
              
              {/* View Details Button */}
              <div className="mt-auto pt-2 border-t border-slate-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent toggling selection
                    handleViewDetails(item.id);
                  }}
                  className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {language === 'en' ? 'View Full Analysis' : 'Xem chi tiết kết quả'}
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