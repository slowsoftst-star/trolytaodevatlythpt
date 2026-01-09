
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        // For PDF/DOCX in a real web environment, we would use libraries like pdf.js or mammoth.js
        // Here we simulate extracting text or informing the AI about the file content
        setFileContent(`[Người dùng đã đính kèm tệp: ${file.name}]`);
        setSelectedImage(null);
        // Note: In a production app, you'd extract the text here and append to inputText
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
    
    // Clear attachments
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

      const userParts = [];
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
        text: "Xin lỗi, đã có lỗi xảy ra khi xử lý tệp hoặc tin nhắn. Vui lòng thử lại.",
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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-teal-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-white text-teal-900 border border-teal-100 rounded-bl-none'
              }`}
            >
              {msg.images && msg.images.length > 0 && (
                <div className="mb-2">
                  <img 
                    src={`data:image/jpeg;base64,${msg.images[0]}`} 
                    alt="User uploaded" 
                    className="max-h-64 rounded-lg border border-teal-200"
                  />
                </div>
              )}
              <div className={msg.role === 'user' ? '' : 'tex2jax_process'}>
                {msg.role === 'user' ? (
                   <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                   <MathMarkdown content={msg.text} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-teal-100 shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-teal-100">
        {attachedFileName && (
          <div className="flex items-center space-x-2 mb-2 p-2 bg-teal-50 rounded-lg inline-flex border border-teal-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94a3 3 0 114.243 4.243L8.567 17.822a1.5 1.5 0 01-2.122-2.122L15.3 6.812" />
            </svg>
            <span className="text-sm text-teal-700 font-medium truncate max-w-[200px]">{attachedFileName}</span>
            <button 
              onClick={removeAttachment}
              className="text-red-500 hover:text-red-700 font-bold px-1 transition-colors"
              title="Gỡ bỏ"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="relative">
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
              title="Đính kèm tệp (Ảnh, PDF, Word)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          <div className="flex-1 bg-teal-50 rounded-2xl p-2 border border-teal-200 focus-within:ring-2 focus-within:ring-teal-300 focus-within:border-transparent transition-all">
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
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-slate-700 placeholder-teal-400"
              rows={1}
              style={{ minHeight: '44px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !selectedImage && !fileContent) || isLoading}
            className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed shadow-md transition-all transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <div className="text-center mt-2 flex justify-center items-center space-x-4">
            <span className="text-[10px] text-teal-400 font-medium">Hỗ trợ: PDF, Word, JPEG, PNG, Clipboard</span>
            <span className="text-[10px] text-teal-300 italic">Thầy Trần Minh Thuận</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
