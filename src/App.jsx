import { useState } from 'react';
import SendKudos from './components/SendKudos';
import MyKudos from './components/MyKudos';

function App() {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="min-h-screen gradient-hero p-5">
      <div className="max-w-6xl mx-auto bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <header className="gradient-primary text-white py-16 px-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-spin-slow"></div>
          <h1 className="text-5xl font-bold mb-3 relative z-10 drop-shadow-lg">
            🎉 Slack Kudos Portal
          </h1>
          <p className="text-xl opacity-95 relative z-10">
            Recognize and celebrate your team members!
          </p>
        </header>

        {/* Main Content */}
        <main className="p-10">
          {/* Navigation Tabs */}
          <nav className="flex gap-2 mb-10 pb-5 border-b-2 border-gray-200 relative">
            <div 
              className="absolute bottom-0 h-0.5 bg-gradient-primary transition-all duration-300 rounded-t"
              style={{
                width: '120px',
                left: activeTab === 'send' ? '0' : '120px'
              }}
            />
            <button
              onClick={() => setActiveTab('send')}
              className={`px-7 py-3.5 font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'send'
                  ? 'text-primary bg-gradient-to-br from-primary/10 to-secondary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              Send Kudos
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-7 py-3.5 font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'received'
                  ? 'text-primary bg-gradient-to-br from-primary/10 to-secondary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              My Kudos
            </button>
          </nav>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'send' && <SendKudos />}
            {activeTab === 'received' && <MyKudos />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 py-8 text-center text-gray-600 border-t border-gray-200">
          <p>Built with ❤️ for team recognition</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

