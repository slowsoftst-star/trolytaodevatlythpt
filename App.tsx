import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import QuizGenerator from './components/QuizGenerator';

enum Tab {
  CHAT = 'chat',
  QUIZ = 'quiz'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#00796B" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">Trợ lý Vật lý THPT</h1>
              <p className="text-teal-200 text-xs">Chương trình GDPT 2018</p>
              <p className="text-teal-100 text-lg mt-1" style={{ fontFamily: "'Dancing Script', cursive" }}>Thầy Trần Minh Thuận</p>
            </div>
          </div>
          
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab(Tab.CHAT)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                activeTab === Tab.CHAT
                  ? 'bg-teal-900 text-white shadow-inner'
                  : 'text-teal-100 hover:bg-teal-600'
              }`}
            >
              Trợ lý Chat
            </button>
            <button
              onClick={() => setActiveTab(Tab.QUIZ)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                activeTab === Tab.QUIZ
                  ? 'bg-teal-900 text-white shadow-inner'
                  : 'text-teal-100 hover:bg-teal-600'
              }`}
            >
              Tạo Đề Ôn
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 h-[calc(100vh-80px)]">
        {activeTab === Tab.CHAT ? (
          <div className="h-full max-w-5xl mx-auto">
            <ChatInterface />
          </div>
        ) : (
          <div className="h-full max-w-6xl mx-auto">
             <QuizGenerator />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;