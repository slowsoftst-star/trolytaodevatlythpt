import React, { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
  onClose?: () => void;
  isRequired: boolean;
}

const ApiKeyModal: React.FC<Props> = ({ onSave, onClose, isRequired }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Vui lòng nhập API Key.');
      return;
    }
    if (trimmed.length < 10) {
      setError('API Key không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    setError('');
    onSave(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:24,height:24}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
          Thiết lập API Key
        </div>
        <div className="modal-desc">
          Để sử dụng ứng dụng, bạn cần nhập Gemini API Key.<br /><br />
          👉 Lấy API Key miễn phí tại:{' '}
          <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="modal-link">
            aistudio.google.com/api-keys
          </a>
          <br /><br />
          <em style={{fontSize:'0.8rem',color:'#64748b'}}>
            Nếu hết quota, hãy tạo API key từ một tài khoản Gmail khác hoặc chờ đến ngày hôm sau.
          </em>
        </div>
        <input
          type="password"
          className="modal-input"
          placeholder="Dán API Key vào đây..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {error && <div className="modal-error">{error}</div>}
        <button className="btn-modal-save" onClick={handleSave}>
          Lưu API Key
        </button>
        {!isRequired && onClose && (
          <button className="btn-modal-close" onClick={onClose}>
            Đóng
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModal;
