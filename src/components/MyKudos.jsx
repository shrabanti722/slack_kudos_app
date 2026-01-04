import { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function MyKudos() {
  const [userId, setUserId] = useState('');
  const [kudos, setKudos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('kudos_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const loadMyKudos = async () => {
    if (!userId.trim()) {
      alert('Please enter your Slack User ID');
      return;
    }

    setLoading(true);
    localStorage.setItem('kudos_user_id', userId);
    window.currentUserId = userId;

    try {
      const response = await fetch(`${API_BASE}/kudos/user/${userId}?limit=50`);
      const data = await response.json();

      if (data.success) {
        setKudos(data.data);
      } else {
        setKudos([]);
        alert('Failed to load Kudos. Please check your User ID.');
      }
    } catch (error) {
      console.error('Error loading my kudos:', error);
      setKudos([]);
      alert('Error loading Kudos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadMyKudos();
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 pb-4 border-b-4 border-primary/20 relative">
        <span className="relative">
          📬 Kudos I've Received
          <span className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-primary rounded"></span>
        </span>
      </h2>

      {/* User ID Input */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-md border border-gray-200 mb-8">
        <div className="flex gap-3 flex-wrap items-end mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-2 font-semibold text-gray-900">
              Enter Your Slack User ID:
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., U1234567890"
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
            />
          </div>
          <button
            onClick={loadMyKudos}
            disabled={loading}
            className="px-7 py-3.5 gradient-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load My Kudos'}
          </button>
        </div>
        <div className="bg-gradient-to-r from-primary/8 to-secondary/8 p-4 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-gray-700">
            💡 <strong>Tip:</strong> Find your Slack User ID by right-clicking your profile in Slack → "Copy member ID"
          </p>
        </div>
      </div>

      {/* Kudos List */}
      <div className="space-y-5">
        {loading && (
          <div className="text-center py-16 text-gray-600">
            <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
            <p className="text-lg">Loading your Kudos...</p>
          </div>
        )}

        {!loading && kudos.length === 0 && userId && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-6 opacity-40 animate-bounce">📭</div>
            <p className="text-xl mb-2">You haven't received any Kudos yet.</p>
            <p className="text-lg">Keep doing great work! 🌟</p>
          </div>
        )}

        {!loading && !userId && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-6 opacity-40">📭</div>
            <p className="text-xl">Enter your Slack User ID above to see your Kudos</p>
          </div>
        )}

        {!loading && kudos.map((k) => (
          <div
            key={k.id}
            className="bg-gradient-to-br from-primary/2 to-white p-7 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
              <div className="font-semibold text-primary text-lg flex items-center gap-2">
                <strong>From:</strong> {k.from_user_name}
              </div>
              <div className="text-gray-500 text-sm font-medium" title={formatDate(k.created_at)}>
                {getTimeAgo(k.created_at)}
              </div>
            </div>
            <div className="text-gray-800 text-base leading-relaxed mb-4">
              {k.message}
            </div>
            <div className="flex gap-4 flex-wrap">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5">
                {k.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
              </span>
              {k.sent_dm && (
                <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5">
                  📧 Sent via DM
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

