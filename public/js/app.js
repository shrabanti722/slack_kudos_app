// API Base URL
const API_BASE = '/api';

// DOM Elements
const userIdInput = document.getElementById('userIdInput');
const searchBtn = document.getElementById('searchBtn');
const kudosSection = document.getElementById('kudosSection');
const kudosList = document.getElementById('kudosList');
const allKudosList = document.getElementById('allKudosList');
const statsGrid = document.getElementById('statsGrid');
const leaderboard = document.getElementById('leaderboard');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadLeaderboard();
    loadRecentKudos();
    
    // Search button click handler
    searchBtn.addEventListener('click', handleSearch);
    
    // Enter key handler
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

// Handle user search
async function handleSearch() {
    const userId = userIdInput.value.trim();
    
    if (!userId) {
        alert('Please enter a Slack User ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/kudos/user/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayUserKudos(userId, data.data);
        } else {
            showError('Failed to load kudos. Please check the User ID.');
        }
    } catch (error) {
        console.error('Error fetching user kudos:', error);
        showError('Error loading kudos. Please try again.');
    }
}

// Display kudos for a specific user
function displayUserKudos(userId, kudos) {
    kudosSection.style.display = 'block';
    document.getElementById('kudosSectionTitle').textContent = `Kudos Received (${kudos.length})`;
    
    if (kudos.length === 0) {
        kudosList.innerHTML = '<div class="loading">No kudos found for this user.</div>';
        return;
    }
    
    kudosList.innerHTML = kudos.map(k => createKudosCard(k)).join('');
    
    // Scroll to kudos section
    kudosSection.scrollIntoView({ behavior: 'smooth' });
}

// Load and display statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total Kudos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.uniqueRecipients}</div>
                    <div class="stat-label">Unique Recipients</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.uniqueSenders}</div>
                    <div class="stat-label">Unique Senders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.last7Days}</div>
                    <div class="stat-label">Last 7 Days</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        statsGrid.innerHTML = '<div class="error">Failed to load statistics</div>';
    }
}

// Load and display leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/leaderboard?limit=10`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            leaderboard.innerHTML = data.data.map((item, index) => `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(item.to_user_name)}</div>
                        <div class="leaderboard-count">${item.kudos_count} kudos received</div>
                    </div>
                </div>
            `).join('');
        } else {
            leaderboard.innerHTML = '<div class="loading">No leaderboard data available</div>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboard.innerHTML = '<div class="error">Failed to load leaderboard</div>';
    }
}

// Load and display recent kudos
async function loadRecentKudos() {
    try {
        const response = await fetch(`${API_BASE}/kudos?limit=10`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            allKudosList.innerHTML = data.data.map(k => createKudosCard(k)).join('');
        } else {
            allKudosList.innerHTML = '<div class="loading">No kudos found</div>';
        }
    } catch (error) {
        console.error('Error loading recent kudos:', error);
        allKudosList.innerHTML = '<div class="error">Failed to load recent kudos</div>';
    }
}

// Create a kudos card HTML
function createKudosCard(kudos) {
    const date = new Date(kudos.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const meta = [];
    if (kudos.sent_dm) meta.push('📧 DM');
    if (kudos.sent_channel && kudos.channel_name) {
        meta.push(`#${kudos.channel_name}`);
    }
    
    return `
        <div class="kudos-card">
            <div class="kudos-header">
                <div class="kudos-from">From: ${escapeHtml(kudos.from_user_name)}</div>
                <div class="kudos-date">${formattedDate}</div>
            </div>
            <div class="kudos-message">${escapeHtml(kudos.message)}</div>
            ${meta.length > 0 ? `<div class="kudos-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

// Show error message
function showError(message) {
    kudosList.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    kudosSection.style.display = 'block';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// TODO: Add more features as needed:
// - User authentication/identification
// - Filtering and sorting options
// - Pagination for large lists
// - Real-time updates
// - Export functionality
// - Charts and visualizations

