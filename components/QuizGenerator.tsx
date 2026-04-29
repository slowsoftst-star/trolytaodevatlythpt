import React, { useState } from 'react';
import { GradeLevel, QuizType, Difficulty, QuizConfig, QuizResult, QuizRequestItem } from '../types';
import { PHYSICS_CURRICULUM } from '../constants';
import { generateQuizQuestions } from '../services/geminiService';
import MathMarkdown from './MathMarkdown';

declare global {
  interface Window {
    temml?: {
      renderToString: (tex: string, options?: any) => string;
    };
  }
}

const QuizGenerator: React.FC = () => {
  const [config, setConfig] = useState<QuizConfig>({
    grade: GradeLevel.GRADE_10,
    chapterId: '',
    lessonId: '',
    type: QuizType.MULTIPLE_CHOICE,
    quantity: 5,
    difficulty: Difficulty.UNDERSTAND
  });

  const [requestItems, setRequestItems] = useState<QuizRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

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
    const newItem: QuizRequestItem = { ...config, id: Date.now().toString(), chapterName, lessonName };
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

  const processTextForWord = (text: string): string => {
    if (!text) return '';
    return text.replace(/\$\$([\s\S]*?)\$\$|\$((?:\\.|[^$])*)\$/g, (match, p1, p2) => {
      const tex = p1 || p2;
      try {
        if (window.temml) return window.temml.renderToString(tex, { displayMode: !!p1 });
        return match;
      } catch (e) { return match; }
    });
  };

  const exportToWord = () => {
    if (!result) return;
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns:m='http://schemas.microsoft.com/office/2004/12/omml' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${result.title}</title>
      <style>body{font-family:'Times New Roman',serif;font-size:12pt}p{margin:6px 0}.question{margin-bottom:12px}.options{margin-left:20px}.section-title{font-weight:bold;font-size:14pt;margin-top:20px;margin-bottom:10px;text-transform:uppercase}</style>
      </head><body>
      <h1 style="text-align:center">${result.title}</h1>
      <p style="text-align:center"><b>Môn:</b> Vật lý - <b>Chương trình GDPT 2018</b></p><hr/>
      <div class="section-title">PHẦN 1: NỘI DUNG ĐỀ THI</div>`;

    result.questions.forEach((q, idx) => {
      const cleanContent = processTextForWord(q.content);
      htmlContent += `<div class="question"><p><b>Câu ${idx + 1}:</b> ${cleanContent}</p><div class="options">`;
      if (q.type === QuizType.MULTIPLE_CHOICE && q.options) {
        q.options.forEach((opt, optIdx) => {
          const label = String.fromCharCode(65 + optIdx);
          const isCorrect = label === q.correctAnswer;
          let cleanOptText = opt.trim().replace(/^[a-dA-D][\.\\)]\s*/, '');
          cleanOptText = processTextForWord(cleanOptText);
          htmlContent += `<p>${isCorrect ? '*' + label : label}. ${cleanOptText}</p>`;
        });
      } else if (q.type === QuizType.TRUE_FALSE && q.options) {
        const labels = ['a', 'b', 'c', 'd'];
        q.options.forEach((opt, optIdx) => {
          const cleanOpt = opt.trim().replace(/^[a-dA-D][)\.]\s*/, '');
          htmlContent += `<p>${labels[optIdx]}) ${processTextForWord(cleanOpt)}</p>`;
        });
        htmlContent += `<p style="margin-top:5px"><b>*Đáp án: ${processTextForWord(q.correctAnswer)}</b></p>`;
      } else if (q.type === QuizType.SHORT_ANSWER) {
        htmlContent += `<p style="margin-top:5px"><b>*Đáp án: ${processTextForWord(q.correctAnswer)}</b></p>`;
      }
      htmlContent += `</div></div>`;
    });

    htmlContent += `<br clear=all style='mso-special-character:line-break;page-break-before:always'><div class="section-title">PHẦN 2: HƯỚNG DẪN GIẢI CHI TIẾT</div>`;
    result.questions.forEach((q, idx) => {
      htmlContent += `<p><b>Câu ${idx + 1}:</b></p><p>Đáp án: <b>${processTextForWord(q.correctAnswer)}</b></p>`;
      htmlContent += `<p><i>Lời giải:</i> ${processTextForWord(q.explanation || 'Chưa có lời giải chi tiết.')}</p><hr style="border:0;border-top:1px dashed #ccc"/>`;
    });
    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Vat_Ly_Tong_Hop_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="quiz-container">
      {/* Top Section: Form and Summary */}
      <div className="quiz-form-section">
        <h2 className="quiz-form-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Thiết lập Đề Ôn Tập
        </h2>

        <div className="quiz-grid">
          {/* Left Column */}
          <div className="quiz-left">
            <h3 className="quiz-section-heading">1. Chọn Thông Số</h3>
            <div className="form-group">
              <label>Khối lớp</label>
              <select className="form-select" value={config.grade}
                onChange={(e) => setConfig({ ...config, grade: Number(e.target.value) as GradeLevel, chapterId: '', lessonId: '' })}>
                <option value={10}>Lớp 10</option>
                <option value={11}>Lớp 11</option>
                <option value={12}>Lớp 12</option>
              </select>
            </div>
            <div className="form-group">
              <label>Chương</label>
              <select className="form-select" value={config.chapterId}
                onChange={(e) => setConfig({ ...config, chapterId: e.target.value, lessonId: '' })}>
                <option value="">-- Chọn Chương --</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bài học</label>
              <select className="form-select" value={config.lessonId} disabled={!config.chapterId}
                onChange={(e) => setConfig({ ...config, lessonId: e.target.value })}>
                <option value="">-- Chọn Bài --</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hình thức</label>
                <select className="form-select" value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value as QuizType })}>
                  <option value={QuizType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                  <option value={QuizType.TRUE_FALSE}>Đúng / Sai</option>
                  <option value={QuizType.SHORT_ANSWER}>Tự luận/Trả lời ngắn</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mức độ</label>
                <select className="form-select" value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}>
                  <option value={Difficulty.KNOW}>Biết</option>
                  <option value={Difficulty.UNDERSTAND}>Hiểu</option>
                  <option value={Difficulty.APPLY}>Vận dụng</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Số lượng câu</label>
              <select className="form-select" value={config.quantity}
                onChange={(e) => setConfig({ ...config, quantity: Number(e.target.value) })}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} câu</option>)}
              </select>
            </div>
            <div style={{paddingTop:'0.5rem'}}>
              <button onClick={handleAddToQueue} disabled={!config.lessonId} className="btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Thêm vào đề
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="quiz-right">
            <h3 className="quiz-section-heading">2. Bảng Thống Kê Đề Thi</h3>
            <div className="quiz-table-wrap">
              <div className="quiz-table-scroll">
                <table className="quiz-table">
                  <thead>
                    <tr>
                      <th>Tên Bài</th>
                      <th style={{width:80}}>Mức độ</th>
                      <th style={{width:96}}>Hình thức</th>
                      <th style={{width:64,textAlign:'center'}}>SL</th>
                      <th style={{width:40}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestItems.length === 0 ? (
                      <tr><td colSpan={5} className="empty-cell">Chưa có câu hỏi nào. Hãy chọn thông số và ấn "Thêm vào đề".</td></tr>
                    ) : (
                      requestItems.map((item) => (
                        <tr key={item.id}>
                          <td className="col-name" title={item.lessonName}>{item.lessonName}</td>
                          <td className="col-diff">{item.difficulty}</td>
                          <td className="col-type">{item.type}</td>
                          <td className="col-qty">{item.quantity}</td>
                          <td className="col-action">
                            <button onClick={() => handleRemoveFromQueue(item.id)} className="btn-remove" title="Xóa">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {requestItems.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{textAlign:'right',padding:'0.5rem 0.75rem'}}>Tổng câu hỏi:</td>
                        <td style={{textAlign:'center',padding:'0.5rem 0.75rem'}}>{requestItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <button onClick={handleCreateQuiz} disabled={isLoading || requestItems.length === 0} className="btn-create">
              {isLoading ? (<><div className="spinner"></div>Đang khởi tạo đề thi...</>) : "Tạo Đề Ngay"}
            </button>
          </div>
        </div>
      </div>

      {/* Result Area */}
      <div className="quiz-results">
        {result ? (
          <div className="quiz-results-inner">
            <div className="quiz-results-header">
              <h3 className="quiz-results-title">{result.title}</h3>
              <button onClick={exportToWord} className="btn-export">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Tải về Word</span>
              </button>
            </div>

            <div className="questions-list">
              {result.questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div className="question-header">
                    <span>Câu {idx + 1}:</span>
                    <MathMarkdown content={q.content} />
                  </div>
                  <div className="question-options">
                    {q.type === QuizType.MULTIPLE_CHOICE && q.options && (
                      <div className="options-grid">
                        {q.options.map((opt, i) => {
                          const label = String.fromCharCode(65 + i);
                          const isCorrect = label === q.correctAnswer;
                          return (
                            <div key={i} className={`option-item ${isCorrect ? 'option-item--correct' : ''}`}>
                              <span className="option-label">{isCorrect ? `*${label}` : label}.</span>
                              <MathMarkdown content={opt} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.type === QuizType.TRUE_FALSE && q.options && (
                      <div className="tf-options">
                        {q.options.map((opt, i) => {
                          const labels = ['a', 'b', 'c', 'd'];
                          const cleanOpt = opt.trim().replace(/^[a-dA-D][)\.]\s*/, '');
                          return (
                            <div key={i} className="tf-item">
                              <span className="tf-label">{labels[i]})</span>
                              <MathMarkdown content={cleanOpt} />
                            </div>
                          );
                        })}
                        <div className="answer-box">
                          <span>Đáp án:</span> {q.correctAnswer}
                        </div>
                      </div>
                    )}
                    {q.type === QuizType.SHORT_ANSWER && (
                      <div className="answer-box">
                        <span>*Đáp án:</span> <MathMarkdown content={q.correctAnswer} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="solutions-divider">
              <span className="solutions-divider-label">LỜI GIẢI CHI TIẾT</span>
            </div>

            <div className="solutions-list">
              {result.questions.map((q, idx) => (
                <div key={`sol-${q.id}`} className="solution-card">
                  <div className="solution-header">Câu {idx + 1}: Đáp án {q.correctAnswer}</div>
                  <div className="solution-body">
                    <MathMarkdown content={q.explanation || "Chưa có lời giải chi tiết."} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <p>1. Chọn thông số ở cột trái<br/>2. Bấm "Thêm vào đề"<br/>3. Bấm "Tạo Đề Ngay" để AI sinh nội dung</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGenerator;
