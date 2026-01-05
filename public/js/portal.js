// Employee Portal JavaScript
const API_BASE = '/api';

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const portalSections = document.querySelectorAll('.portal-section');
const kudosForm = document.getElementById('kudosForm');
const recipientSelect = document.getElementById('recipientSelect');
const kudosMessage = document.getElementById('kudosMessage');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const myUserIdInput = document.getElementById('myUserIdInput');
const loadMyKudosBtn = document.getElementById('loadMyKudosBtn');
const myKudosList = document.getElementById('myKudosList');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadTeamMembers();
    setupForm();
    setupMyKudos();
    loadStoredUserInfo();
});

// Load stored user info from localStorage
function loadStoredUserInfo() {
    const storedUserId = localStorage.getItem('kudos_user_id');
    const storedUserName = localStorage.getItem('kudos_user_name');

    if (storedUserId) {
        myUserIdInput.value = storedUserId;
    }

    // If we have stored info, we can use it for sending Kudos too
    if (storedUserId && storedUserName) {
        window.currentUserId = storedUserId;
        window.currentUserName = storedUserName;
    }
}

// Store user info in localStorage
function storeUserInfo(userId, userName) {
    localStorage.setItem('kudos_user_id', userId);
    localStorage.setItem('kudos_user_name', userName);
    window.currentUserId = userId;
    window.currentUserName = userName;
}

// Navigation between tabs
function setupNavigation() {
    const nav = document.querySelector('.portal-nav');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update nav data attribute for CSS animation
            nav.setAttribute('data-active', targetTab);

            // Update active section with fade animation
            portalSections.forEach(s => {
                s.classList.remove('active');
            });

            setTimeout(() => {
                document.getElementById(`${targetTab}Section`).classList.add('active');
            }, 150);
        });
    });

    // Set initial active state
    nav.setAttribute('data-active', 'send');
}

// Load team members for the select dropdown
async function loadTeamMembers() {
    try {
        const response = await fetch(`${API_BASE}/team-members`);
        const data = await response.json();

        if (data.success) {
            recipientSelect.innerHTML = '<option value="">Select a team member...</option>';
            data.data.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                recipientSelect.appendChild(option);
            });
        } else {
            recipientSelect.innerHTML = '<option value="">Error loading team members</option>';
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        recipientSelect.innerHTML = '<option value="">Error loading team members</option>';
    }
}

// Setup form handlers
function setupForm() {
    // Character count for message
    kudosMessage.addEventListener('input', () => {
        const count = kudosMessage.value.length;
        charCount.textContent = count;
        charCount.style.color = count < 10 ? '#c62828' : '#666';
    });

    // Form submission
    kudosForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(kudosForm);
        const recipientId = formData.get('recipient');
        const message = formData.get('message');
        const emoji = formData.get('emoji');
        const visibility = formData.get('visibility');
        const sendDm = formData.get('sendDm') === 'on';

        // Get sender info
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

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.btn-loader').style.display = 'inline';

        try {
            const response = await fetch(`${API_BASE}/kudos/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromUserId: senderId,
                    fromUserName: senderName,
                    toUserId: recipientId,
                    message: message,
                    emoji: emoji,
                    visibility: visibility,
                    sendDm: sendDm,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                showSuccessMessage();
                // Hide form
                kudosForm.style.display = 'none';
            } else {
                alert(`Error: ${data.error || 'Failed to send Kudos'}`);
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').style.display = 'inline';
                submitBtn.querySelector('.btn-loader').style.display = 'none';
            }
        } catch (error) {
            console.error('Error sending kudos:', error);
            alert('Error sending Kudos. Please try again.');
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').style.display = 'inline';
            submitBtn.querySelector('.btn-loader').style.display = 'none';
        }
    });
}

// Show success message with confetti effect
function showSuccessMessage() {
    successMessage.style.display = 'block';

    // Add confetti effect
    createConfetti();

    // Smooth scroll to success message
    setTimeout(() => {
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Simple confetti effect
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.opacity = '0.8';

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
}

// Reset form (called from success message button)
function resetForm() {
    kudosForm.reset();
    kudosForm.style.display = 'block';
    successMessage.style.display = 'none';
    charCount.textContent = '0';
    charCount.style.color = '#666';
    kudosForm.scrollIntoView({ behavior: 'smooth' });
}

// Make resetForm available globally
window.resetForm = resetForm;

// Setup My Kudos section
function setupMyKudos() {
    loadMyKudosBtn.addEventListener('click', loadMyKudos);
    myUserIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadMyKudos();
        }
    });
}

// Load Kudos for the current user
async function loadMyKudos() {
    const userId = myUserIdInput.value.trim();

    if (!userId) {
        alert('Please enter your Slack User ID');
        return;
    }

    // Store the user ID for future use
    if (userId) {
        localStorage.setItem('kudos_user_id', userId);
        window.currentUserId = userId;
    }

    myKudosList.innerHTML = '<div class="loading">Loading your Kudos...</div>';

    try {
        const response = await fetch(`${API_BASE}/kudos/user/${userId}?limit=50`);
        const data = await response.json();

        if (data.success) {
            if (data.data.length === 0) {
                myKudosList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>You haven't received any Kudos yet.</p>
                        <p>Keep doing great work! 🌟</p>
                    </div>
                `;
            } else {
                myKudosList.innerHTML = data.data.map(k => createReceivedKudosCard(k)).join('');
            }
        } else {
            myKudosList.innerHTML = `<div class="error">Failed to load Kudos. Please check your User ID.</div>`;
        }
    } catch (error) {
        console.error('Error loading my kudos:', error);
        myKudosList.innerHTML = `<div class="error">Error loading Kudos. Please try again.</div>`;
    }
}

// Create a card for received Kudos
function createReceivedKudosCard(kudos) {
    const date = new Date(kudos.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const timeAgo = getTimeAgo(date);

    return `
        <div class="kudos-card received-kudos-card">
            <div class="kudos-header">
                <div class="kudos-from">
                    <strong>From:</strong> ${escapeHtml(kudos.from_user_name)}
                </div>
                <div class="kudos-date" title="${formattedDate}">
                    ${timeAgo}
                </div>
            </div>
            <div class="kudos-message">
                ${escapeHtml(kudos.message)}
            </div>
            <div class="kudos-meta">
                <span>${kudos.visibility === 'private' ? '🔒 Private' : '🌐 Public'}</span>
                ${kudos.sent_dm ? '<span>📧 Sent via DM</span>' : ''}
            </div>
        </div>
    `;
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

