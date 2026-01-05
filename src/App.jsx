import { useState, useEffect } from 'react';
import SendKudos from './components/SendKudos';
import MyKudos from './components/MyKudos';

function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        // Sync with legacy localStorage just in case
        localStorage.setItem('kudos_user_id', data.user.id);
        localStorage.setItem('kudos_user_name', data.user.name);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/slack';
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className="min-h-screen gradient-hero p-5">
      <div className="max-w-6xl mx-auto bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <header className="gradient-primary text-white py-16 px-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-spin-slow"></div>

          {/* User Profile / Login */}
          <div className="absolute top-6 right-6 z-20">
            {authLoading ? (
              <div className="animate-pulse bg-white/20 h-10 w-24 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 pl-4 rounded-full border border-white/20">
                <div className="text-right">
                  <div className="text-sm font-bold leading-tight">{user.name}</div>
                  <button onClick={handleLogout} className="text-xs opacity-70 hover:opacity-100 transition-opacity">Logout</button>
                </div>
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center border-2 border-white/30 text-xs">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white text-primary px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.4 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" /><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.4c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" /><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.4 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C77.7 5.8 83.5 0 90.6 0s12.9 5.8 12.9 12.9v32.3z" /><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.4c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" /></svg>
                Sign in with Slack
              </button>
            )}
          </div>

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
              className={`px-7 py-3.5 font-semibold rounded-lg transition-all duration-300 ${activeTab === 'send'
                  ? 'text-primary bg-gradient-to-br from-primary/10 to-secondary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              Send Kudos
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-7 py-3.5 font-semibold rounded-lg transition-all duration-300 ${activeTab === 'received'
                  ? 'text-primary bg-gradient-to-br from-primary/10 to-secondary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              My Kudos
            </button>
          </nav>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'send' && <SendKudos currentUser={user} />}
            {activeTab === 'received' && <MyKudos currentUser={user} />}
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

