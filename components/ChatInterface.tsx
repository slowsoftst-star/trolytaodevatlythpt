import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import MathMarkdown from './MathMarkdown';
import { Content } from '@google/genai';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<Content[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Xin chào! Mình là Trợ lý Vật lý THPT. Bạn có thể dán ảnh bài tập (Ctrl+V), gửi file PDF, Word hoặc đặt câu hỏi trực tiếp tại đây.",
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();
      setAttachedFileName(file.name);

      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setSelectedImage(base64String.split(',')[1]);
          setFileContent(null);
        };
        reader.readAsDataURL(file);
      } else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
        setFileContent(`[Người dùng đã đính kèm tệp: ${file.name}]`);
        setSelectedImage(null);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setSelectedImage(base64String.split(',')[1]);
            setAttachedFileName("Ảnh từ Clipboard");
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage && !fileContent) || isLoading) return;

    const fullMessageText = fileContent ? `${inputText}\n\n${fileContent}` : inputText;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: fullMessageText,
      timestamp: new Date(),
      images: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    const tempImage = selectedImage;
    setSelectedImage(null);
    setAttachedFileName(null);
    setFileContent(null);
    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(chatHistoryRef.current, userMsg.text, userMsg.images);

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);

      const userParts: any[] = [];
      if (tempImage) {
        userParts.push({ inlineData: { mimeType: 'image/jpeg', data: tempImage } });
      }
      userParts.push({ text: userMsg.text });
      chatHistoryRef.current.push({ role: 'user', parts: userParts });
      chatHistoryRef.current.push({ role: 'model', parts: [{ text: responseText }] });
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = () => {
    setSelectedImage(null);
    setAttachedFileName(null);
    setFileContent(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`msg-row ${msg.role === 'user' ? 'msg-row--user' : 'msg-row--model'}`}>
            <div className={`msg-bubble ${msg.role === 'user' ? 'msg-bubble--user' : 'msg-bubble--model'}`}>
              {msg.images && msg.images.length > 0 && (
                <div style={{marginBottom:'0.5rem'}}>
                  <img src={`data:image/jpeg;base64,${msg.images[0]}`} alt="User uploaded" className="msg-image" />
                </div>
              )}
              <div className={msg.role === 'user' ? '' : 'tex2jax_process'}>
                {msg.role === 'user' ? (
                  <p className="msg-text">{msg.text}</p>
                ) : (
                  <MathMarkdown content={msg.text} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="msg-row msg-row--model">
            <div className="msg-bubble msg-bubble--model">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {attachedFileName && (
          <div className="attachment-tag">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:16,height:16,color:'var(--teal-600)'}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94a3 3 0 114.243 4.243L8.567 17.822a1.5 1.5 0 01-2.122-2.122L15.3 6.812" />
            </svg>
            <span>{attachedFileName}</span>
            <button onClick={removeAttachment} className="attachment-remove" title="Gỡ bỏ">×</button>
          </div>
        )}

        <div className="chat-input-row">
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.docx" className="hidden-input" />
            <button onClick={() => fileInputRef.current?.click()} className="btn-attach" title="Đính kèm tệp (Ảnh, PDF, Word)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          <div className="chat-textarea-wrap">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập câu hỏi, dán ảnh (Ctrl+V) hoặc đính kèm file..."
              className="chat-textarea"
              rows={1}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !selectedImage && !fileContent) || isLoading}
            className="btn-send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <div className="chat-footer">
          <span className="hint">Hỗ trợ: PDF, Word, JPEG, PNG, Clipboard</span>
          <span className="author">Thầy Trần Minh Thuận</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
