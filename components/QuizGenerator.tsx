import React, { useState } from 'react';
import { GradeLevel, QuizType, Difficulty, QuizConfig, QuizResult, QuizRequestItem } from '../types';
import { PHYSICS_CURRICULUM } from '../constants';
import { generateQuizQuestions } from '../services/geminiService';
import MathMarkdown from './MathMarkdown';

// Declare Temml on window
declare global {
  interface Window {
    temml?: {
      renderToString: (tex: string, options?: any) => string;
    };
  }
}

const QuizGenerator: React.FC = () => {
  // Current form state
  const [config, setConfig] = useState<QuizConfig>({
    grade: GradeLevel.GRADE_10,
    chapterId: '',
    lessonId: '',
    type: QuizType.MULTIPLE_CHOICE,
    quantity: 5,
    difficulty: Difficulty.UNDERSTAND
  });

  // Queue state
  const [requestItems, setRequestItems] = useState<QuizRequestItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Derived state for dropdowns
  const chapters = PHYSICS_CURRICULUM[config.grade] || [];
  const selectedChapter = chapters.find(c => c.id === config.chapterId);
  const lessons = selectedChapter ? selectedChapter.lessons : [];

  const handleAddToQueue = () => {
    if (!config.chapterId || !config.lessonId) {
      alert("Vui lòng chọn đầy đủ Chương và Bài học.");
      return;
    }

    const chapterName = selectedChapter?.name || '';
    const lessonName = lessons.find(l => l.id === config.lessonId)?.name || '';

    const newItem: QuizRequestItem = {
      ...config,
      id: Date.now().toString(),
      chapterName,
      lessonName
    };

    setRequestItems(prev => [...prev, newItem]);
  };

  const handleRemoveFromQueue = (id: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateQuiz = async () => {
    if (requestItems.length === 0) {
      alert("Vui lòng thêm ít nhất một yêu cầu vào bảng thống kê.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const quizResult = await generateQuizQuestions(requestItems);
      setResult(quizResult);
    } catch (error) {
      alert("Lỗi khi tạo đề: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert LaTeX in string to MathML for Word
  const processTextForWord = (text: string): string => {
    if (!text) return '';
    
    // Regex to find LaTeX patterns: $$...$$ (display) or $...$ (inline)
    return text.replace(/\$\$([\s\S]*?)\$\$|\$((?:\\.|[^$])*)\$/g, (match, p1, p2) => {
      const tex = p1 || p2;
      try {
        if (window.temml) {
          // Use Temml to render MathML string
          return window.temml.renderToString(tex, { displayMode: !!p1 });
        }
        return match;
      } catch (e) {
        console.warn("Temml render error", e);
        return match;
      }
    });
  };

  const exportToWord = () => {
    if (!result) return;
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns:m='http://schemas.microsoft.com/office/2004/12/omml'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${result.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; }
          p { margin: 6px 0; }
          .question { margin-bottom: 12px; }
          .options { margin-left: 20px; }
          .section-title { font-weight: bold; font-size: 14pt; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
      <h1 style="text-align: center;">${result.title}</h1>
      <p style="text-align: center;"><b>Môn:</b> Vật lý - <b>Chương trình GDPT 2018</b></p>
      <hr/>
      
      <div class="section-title">PHẦN 1: NỘI DUNG ĐỀ THI</div>
    `;

    // Render Questions
    result.questions.forEach((q, idx) => {
      // 1. Process Question Content (LaTeX -> MathML)
      const cleanContent = processTextForWord(q.content);
      
      htmlContent += `<div class="question">`;
      htmlContent += `<p><b>Câu ${idx + 1}:</b> ${cleanContent}</p>`;
      htmlContent += `<div class="options">`;
      
      if (q.type === QuizType.MULTIPLE_CHOICE && q.options) {
        // --- XỬ LÝ TRẮC NGHIỆM 4 ĐÁP ÁN ---
        q.options.forEach((opt, optIdx) => {
          const label = String.fromCharCode(65 + optIdx); // A, B, C...
          const isCorrect = label === q.correctAnswer;
          
          let cleanOptText = opt.trim().replace(/^[a-dA-D][\.\)]\s*/, '');
          cleanOptText = processTextForWord(cleanOptText);

          const displayLabel = isCorrect ? `*${label}` : label;
          htmlContent += `<p>${displayLabel}. ${cleanOptText}</p>`;
        });
      } else if (q.type === QuizType.TRUE_FALSE && q.options) {
         // --- XỬ LÝ ĐÚNG/SAI 4 Ý (a, b, c, d) ---
         // Hiển thị 4 ý a), b), c), d)
         const labels = ['a', 'b', 'c', 'd'];
         q.options.forEach((opt, optIdx) => {
             const label = labels[optIdx] || '-';
             let cleanOptText = opt.trim();
             cleanOptText = processTextForWord(cleanOptText);
             htmlContent += `<p>${label}) ${cleanOptText}</p>`;
         });
         // Hiển thị dòng đáp án
         htmlContent += `<p style="margin-top: 5px;"><b>*Đáp án: ${processTextForWord(q.correctAnswer)}</b></p>`;
      } else if (q.type === QuizType.SHORT_ANSWER) {
         // --- XỬ LÝ TỰ LUẬN / TRẢ LỜI NGẮN ---
         htmlContent += `<p style="margin-top: 5px;"><b>*Đáp án: ${processTextForWord(q.correctAnswer)}</b></p>`;
      } else {
         // Fallback
         htmlContent += `<p>...</p>`;
      }
      htmlContent += `</div></div>`;
    });

    // Page break before solutions
    htmlContent += `
      <br clear=all style='mso-special-character:line-break;page-break-before:always'>
      <div class="section-title">PHẦN 2: HƯỚNG DẪN GIẢI CHI TIẾT</div>
    `;

    // Render Solutions
    result.questions.forEach((q, idx) => {
       const rawExpl = q.explanation || 'Chưa có lời giải chi tiết.';
       const cleanExpl = processTextForWord(rawExpl);
       
       htmlContent += `<p><b>Câu ${idx + 1}:</b></p>`;
       if (q.type === QuizType.MULTIPLE_CHOICE || q.type === QuizType.TRUE_FALSE) {
           htmlContent += `<p>Đáp án: <b>${processTextForWord(q.correctAnswer)}</b></p>`;
       } else if (q.type === QuizType.SHORT_ANSWER) {
           htmlContent += `<p>Đáp án: <b>${processTextForWord(q.correctAnswer)}</b></p>`;
       }
       
       htmlContent += `<p><i>Lời giải:</i> ${cleanExpl}</p>`;
       htmlContent += `<hr style="border: 0; border-top: 1px dashed #ccc;"/>`;
    });

    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `De_Vat_Ly_Tong_Hop_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
      {/* Top Section: Form and Summary */}
      <div className="p-6 bg-teal-50 border-b border-teal-100">
        <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Thiết lập Đề Ôn Tập
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-3 border-r border-teal-200 pr-4">
             <h3 className="font-semibold text-teal-700 mb-2">1. Chọn Thông Số</h3>
             
             {/* Grade */}
            <div>
              <label className="text-xs font-semibold text-teal-600 uppercase">Khối lớp</label>
              <select
                className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                value={config.grade}
                onChange={(e) => {
                  setConfig({ 
                    ...config, 
                    grade: Number(e.target.value) as GradeLevel,
                    chapterId: '', 
                    lessonId: '' 
                  });
                }}
              >
                <option value={10}>Lớp 10</option>
                <option value={11}>Lớp 11</option>
                <option value={12}>Lớp 12</option>
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="text-xs font-semibold text-teal-600 uppercase">Chương</label>
              <select
                className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                value={config.chapterId}
                onChange={(e) => setConfig({ ...config, chapterId: e.target.value, lessonId: '' })}
              >
                <option value="">-- Chọn Chương --</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Lesson */}
            <div>
              <label className="text-xs font-semibold text-teal-600 uppercase">Bài học</label>
              <select
                className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                value={config.lessonId}
                onChange={(e) => setConfig({ ...config, lessonId: e.target.value })}
                disabled={!config.chapterId}
              >
                <option value="">-- Chọn Bài --</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
               {/* Type */}
               <div>
                <label className="text-xs font-semibold text-teal-600 uppercase">Hình thức</label>
                <select
                  className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value as QuizType })}
                >
                  <option value={QuizType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                  <option value={QuizType.TRUE_FALSE}>Đúng / Sai</option>
                  <option value={QuizType.SHORT_ANSWER}>Tự luận/Trả lời ngắn</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-semibold text-teal-600 uppercase">Mức độ</label>
                <select
                  className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
                >
                  <option value={Difficulty.KNOW}>Biết</option>
                  <option value={Difficulty.UNDERSTAND}>Hiểu</option>
                  <option value={Difficulty.APPLY}>Vận dụng</option>
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-semibold text-teal-600 uppercase">Số lượng câu</label>
              <select
                className="w-full p-2 mt-1 text-sm border border-teal-300 rounded focus:ring-teal-500 bg-white"
                value={config.quantity}
                onChange={(e) => setConfig({ ...config, quantity: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} câu</option>
                ))}
              </select>
            </div>

             <div className="pt-2">
               <button
                  onClick={handleAddToQueue}
                  disabled={!config.lessonId}
                  className="w-full py-2 bg-teal-100 text-teal-800 border border-teal-300 rounded hover:bg-teal-200 transition-colors font-medium flex justify-center items-center disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Thêm vào đề
                </button>
             </div>
          </div>

          {/* Right Column: Summary Table */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <h3 className="font-semibold text-teal-700 mb-2">2. Bảng Thống Kê Đề Thi</h3>
            <div className="flex-1 bg-white border border-teal-200 rounded-lg overflow-hidden flex flex-col">
              <div className="overflow-y-auto max-h-[250px] flex-1">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-teal-600 text-white sticky top-0">
                     <tr>
                       <th className="px-3 py-2">Tên Bài</th>
                       <th className="px-3 py-2 w-20">Mức độ</th>
                       <th className="px-3 py-2 w-24">Hình thức</th>
                       <th className="px-3 py-2 w-16 text-center">SL</th>
                       <th className="px-3 py-2 w-10"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {requestItems.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                           Chưa có câu hỏi nào. Hãy chọn thông số và ấn "Thêm vào đề".
                         </td>
                       </tr>
                     ) : (
                       requestItems.map((item, idx) => (
                         <tr key={item.id} className="border-b border-teal-50 hover:bg-teal-50">
                           <td className="px-3 py-2 font-medium text-teal-900 truncate max-w-[150px]" title={item.lessonName}>
                             {item.lessonName}
                           </td>
                           <td className="px-3 py-2 text-slate-600">{item.difficulty}</td>
                           <td className="px-3 py-2 text-slate-600 truncate">{item.type}</td>
                           <td className="px-3 py-2 text-center font-bold text-teal-700">{item.quantity}</td>
                           <td className="px-3 py-2 text-right">
                             <button 
                               onClick={() => handleRemoveFromQueue(item.id)}
                               className="text-red-400 hover:text-red-600"
                               title="Xóa"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                             </button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                   {requestItems.length > 0 && (
                      <tfoot className="bg-teal-50 font-semibold text-teal-800">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right">Tổng câu hỏi:</td>
                          <td className="px-3 py-2 text-center">
                            {requestItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                   )}
                 </table>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleCreateQuiz}
                disabled={isLoading || requestItems.length === 0}
                className="w-full py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-bold transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-wide"
              >
                {isLoading ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Đang khởi tạo đề thi...
                   </>
                ) : (
                  "Tạo Đề Ngay"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {result ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-teal-900">{result.title}</h3>
              <button
                onClick={exportToWord}
                className="flex items-center space-x-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-md hover:bg-teal-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Tải về Word</span>
              </button>
            </div>

            {/* Questions Section */}
            <div className="space-y-8 mb-12">
              {result.questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="font-semibold text-lg text-teal-900 mb-2 flex">
                    <span className="mr-2">Câu {idx + 1}:</span>
                    <MathMarkdown content={q.content} />
                  </div>
                  
                  <div className="ml-4 space-y-2 mt-3">
                    {/* TRẮC NGHIỆM */}
                    {q.type === QuizType.MULTIPLE_CHOICE && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, i) => {
                           const label = String.fromCharCode(65 + i);
                           const isCorrect = label === q.correctAnswer;
                           return (
                             <div key={i} className={`flex items-start p-2 rounded ${isCorrect ? 'bg-teal-200 border border-teal-300' : ''}`}>
                               <span className="font-bold mr-2 w-6">{isCorrect ? `*${label}` : label}.</span>
                               <MathMarkdown content={opt} />
                             </div>
                           );
                        })}
                      </div>
                    )}

                    {/* ĐÚNG / SAI KIỂU MỚI */}
                    {q.type === QuizType.TRUE_FALSE && q.options && (
                       <div className="space-y-2">
                         <div className="grid grid-cols-1 gap-2">
                           {q.options.map((opt, i) => {
                             const labels = ['a', 'b', 'c', 'd'];
                             return (
                               <div key={i} className="flex items-start p-2 rounded bg-white border border-teal-100">
                                 <span className="font-bold mr-2">{labels[i]})</span>
                                 <MathMarkdown content={opt} />
                               </div>
                             );
                           })}
                         </div>
                         <div className="mt-3 p-3 bg-teal-100 rounded text-teal-900 font-bold border border-teal-200">
                           <span className="mr-2">Đáp án:</span> {q.correctAnswer}
                         </div>
                       </div>
                    )}

                    {/* TỰ LUẬN / TRẢ LỜI NGẮN */}
                    {q.type === QuizType.SHORT_ANSWER && (
                      <div className="mt-3 p-3 bg-teal-100 rounded text-teal-900 font-bold border border-teal-200">
                          <span className="mr-2">*Đáp án:</span> <MathMarkdown content={q.correctAnswer} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t-4 border-double border-teal-200 my-10 relative">
               <span className="absolute top-[-15px] left-1/2 transform -translate-x-1/2 bg-white px-4 text-teal-700 font-bold text-lg">
                 LỜI GIẢI CHI TIẾT
               </span>
            </div>

             {/* Detailed Solutions Section */}
             <div className="space-y-6">
               {result.questions.map((q, idx) => (
                 <div key={`sol-${q.id}`} className="bg-white p-4 border-l-4 border-teal-500 shadow-sm">
                   <div className="font-bold text-teal-900 mb-2">Câu {idx + 1}: Đáp án {q.correctAnswer}</div>
                   <div className="text-slate-700">
                     <MathMarkdown content={q.explanation || "Chưa có lời giải chi tiết."} />
                   </div>
                 </div>
               ))}
             </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-lg text-center">
              1. Chọn thông số ở cột trái <br/>
              2. Bấm "Thêm vào đề" <br/>
              3. Bấm "Tạo Đề Ngay" để AI sinh nội dung
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGenerator;