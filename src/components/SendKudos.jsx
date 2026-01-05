import { useState, useEffect } from 'react';
import SuccessMessage from './SuccessMessage';

const API_BASE = '/api';
const EMOJI_OPTIONS = [
  { value: '🎉', label: '🎉 Party' },
  { value: '👏', label: '👏 Clap' },
  { value: '🌟', label: '🌟 Star' },
  { value: '💯', label: '💯 100' },
  { value: '🔥', label: '🔥 Fire' },
  { value: '✨', label: '✨ Sparkles' },
  { value: '🙌', label: '🙌 Praise' },
  { value: '💪', label: '💪 Strong' },
  { value: '🚀', label: '🚀 Rocket' },
  { value: '⭐', label: '⭐ Star' },
];

export default function SendKudos() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    message: '',
    emoji: '🎉',
    visibility: 'public',
    sendDm: true,
    postInChannel: false,
    channelId: '',
  });
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    loadTeamMembers();
    loadChannels();
    loadStoredUserInfo();
  }, []);

  const loadChannels = async () => {
    setChannelsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/channels`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.data);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setChannelsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE}/team-members`);
      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.data);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredUserInfo = () => {
    const storedUserId = localStorage.getItem('kudos_user_id');
    const storedUserName = localStorage.getItem('kudos_user_name');
    if (storedUserId && storedUserName) {
      window.currentUserId = storedUserId;
      window.currentUserName = storedUserName;
    }
  };

  const storeUserInfo = (userId, userName) => {
    localStorage.setItem('kudos_user_id', userId);
    localStorage.setItem('kudos_user_name', userName);
    window.currentUserId = userId;
    window.currentUserName = userName;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'message') {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let senderId = window.currentUserId;
    let senderName = window.currentUserName;

    if (!senderId) {
      senderId = prompt('Enter your Slack User ID:');
      if (!senderId) {
        alert('Please enter your Slack User ID to send Kudos');
        return;
      }
      senderName = prompt('Enter your name:') || 'User';
      storeUserInfo(senderId, senderName);
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/kudos/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: senderId,
          fromUserName: senderName,
          toUserId: formData.recipient,
          message: formData.message,
          emoji: formData.emoji,
          visibility: formData.visibility,
          sendDm: formData.sendDm,
          channelId: formData.postInChannel ? formData.channelId : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        createConfetti();
      } else {
        alert(`Error: ${data.error || 'Failed to send Kudos'}`);
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error sending kudos:', error);
      alert('Error sending Kudos. Please try again.');
      setSubmitting(false);
    }
  };

  const createConfetti = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'fixed pointer-events-none z-[9999] w-2.5 h-2.5 rounded-full opacity-80';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        document.body.appendChild(confetti);

        const animation = confetti.animate([
          { transform: 'translateY(0) rotate(0deg)', opacity: 0.8 },
          { transform: `translateY(${window.innerHeight + 100}px) rotate(720deg)`, opacity: 0 }
        ], {
          duration: 2000 + Math.random() * 1000,
          easing: 'cubic-bezier(0.5, 0, 0.5, 1)'
        });

        animation.onfinish = () => confetti.remove();
      }, i * 20);
    }
  };

  const resetForm = () => {
    setFormData({
      recipient: '',
      message: '',
      emoji: '🎉',
      visibility: 'public',
      sendDm: true,
      postInChannel: false,
      channelId: '',
    });
    setCharCount(0);
    setShowSuccess(false);
  };

  if (showSuccess) {
    return <SuccessMessage onReset={resetForm} />;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 pb-4 border-b-4 border-primary/20 relative">
        <span className="relative">
          ✨ Send Kudos to a Team Member
          <span className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-primary rounded"></span>
        </span>
      </h2>

      <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {/* Team Member Select */}
          <div className="mb-7">
            <label className="block mb-2.5 font-semibold text-gray-900">
              Select Team Member *
            </label>
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white text-gray-900 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '40px'
              }}
            >
              <option value="">
                {loading ? 'Loading team members...' : 'Select a team member...'}
              </option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-7">
            <label className="block mb-2.5 font-semibold text-gray-900">
              Kudos Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="5"
              required
              minLength="10"
              placeholder="What did they do that deserves recognition? (minimum 10 characters)"
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 resize-y min-h-[140px] font-sans"
            />
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
              <span className={charCount < 10 ? 'text-red-600 font-semibold' : 'font-semibold text-primary'}>
                {charCount}
              </span>
              / 10 minimum
            </div>
          </div>

          {/* Emoji */}
          <div className="mb-7">
            <label className="block mb-2.5 font-semibold text-gray-900">
              Choose an Emoji
            </label>
            <select
              name="emoji"
              value={formData.emoji}
              onChange={handleInputChange}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white text-gray-900 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '40px'
              }}
            >
              {EMOJI_OPTIONS.map(emoji => (
                <option key={emoji.value} value={emoji.value}>
                  {emoji.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div className="mb-7">
            <label className="block mb-2.5 font-semibold text-gray-900">Visibility</label>
            <div className="flex flex-col gap-3">
              <label className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg cursor-pointer transition-all duration-300 ${formData.visibility === 'public'
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleInputChange}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <span className={formData.visibility === 'public' ? 'text-primary font-semibold' : ''}>
                  🌐 Public - Visible to everyone
                </span>
              </label>
              <label className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg cursor-pointer transition-all duration-300 ${formData.visibility === 'private'
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleInputChange}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <span className={formData.visibility === 'private' ? 'text-primary font-semibold' : ''}>
                  🔒 Private - Only visible to recipient and managers
                </span>
              </label>
            </div>
          </div>

          {/* Posting Options */}
          <div className="mb-7">
            <label className="block mb-2.5 font-semibold text-gray-900">Posting Options</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-all duration-300">
                <input
                  type="checkbox"
                  name="sendDm"
                  checked={formData.sendDm}
                  onChange={handleInputChange}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <span>Send Direct Message to recipient</span>
              </label>

              {formData.visibility === 'public' && (
                <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-all duration-300">
                  <input
                    type="checkbox"
                    name="postInChannel"
                    checked={formData.postInChannel}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                  <span>Post in a channel</span>
                </label>
              )}
            </div>
          </div>

          {/* Channel Select (Conditional) */}
          {formData.visibility === 'public' && formData.postInChannel && (
            <div className="mb-9 animate-fade-in">
              <label className="block mb-2.5 font-semibold text-gray-900">
                Select Channel *
              </label>
              <select
                name="channelId"
                value={formData.channelId}
                onChange={handleInputChange}
                required={formData.postInChannel}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white text-gray-900 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  paddingRight: '40px'
                }}
              >
                <option value="">
                  {channelsLoading ? 'Loading channels...' : 'Select a channel...'}
                </option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.is_private ? '🔒' : '#'} {channel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={submitting}
              className="px-12 py-4 gradient-primary text-white rounded-xl font-semibold text-lg min-w-[200px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
            >
              {submitting ? '⏳ Sending...' : 'Send Kudos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

