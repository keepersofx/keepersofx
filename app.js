// Keepers of X - Frontend JavaScript

const API_BASE = '/api'; // Cloudflare Worker will handle /api routes

// State
let profiles = [];
let currentSort = 'oldest';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();
    loadStats();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Submit form
    const form = document.getElementById('submit-form');
    form.addEventListener('submit', handleSubmit);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSort = e.target.dataset.sort;
            renderProfiles();
        });
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('handle-input');
    const btn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const message = document.getElementById('submit-message');
    
    let handle = input.value.trim();
    
    // Remove @ if present
    if (handle.startsWith('@')) {
        handle = handle.substring(1);
    }
    
    if (!handle) return;
    
    // Disable form
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    message.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ handle })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            message.className = 'submit-message success';
            message.textContent = `✓ Successfully inscribed @${handle} into the chronicles!`;
            message.style.display = 'block';
            input.value = '';
            
            // Reload profiles and stats
            setTimeout(() => {
                loadProfiles();
                loadStats();
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to inscribe profile');
        }
    } catch (error) {
        message.className = 'submit-message error';
        message.textContent = `✗ ${error.message}`;
        message.style.display = 'block';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Load profiles from API
async function loadProfiles() {
    const grid = document.getElementById('profiles-grid');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    
    loading.style.display = 'block';
    grid.style.display = 'none';
    emptyState.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/profiles`);
        const data = await response.json();
        
        profiles = data.profiles || [];
        
        if (profiles.length === 0) {
            emptyState.style.display = 'block';
        } else {
            grid.style.display = 'grid';
            renderProfiles();
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
        grid.innerHTML = '<p style="color: #c62828; text-align: center;">Error loading profiles. Please refresh the page.</p>';
        grid.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        document.getElementById('total-profiles').textContent = data.total.toLocaleString();
        document.getElementById('earliest-year').textContent = data.earliestYear || '-';
        document.getElementById('total-countries').textContent = data.countries || '-';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render profiles to the grid
function renderProfiles() {
    const grid = document.getElementById('profiles-grid');
    
    // Sort profiles
    const sorted = [...profiles].sort((a, b) => {
        switch (currentSort) {
            case 'oldest':
                return new Date(a.join_date) - new Date(b.join_date);
            case 'newest':
                return new Date(b.join_date) - new Date(a.join_date);
            case 'followers':
                return b.followers - a.followers;
            default:
                return 0;
        }
    });
    
    grid.innerHTML = sorted.map(profile => createProfileCard(profile)).join('');
}

// Create a profile card HTML
function createProfileCard(profile) {
    const joinDate = new Date(profile.join_date);
    const formattedDate = joinDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const joinYear = joinDate.getFullYear();
    const isOG = joinYear <= 2009;
    
    const title = getEpochTitle(joinYear);
    const followers = formatFollowers(profile.followers);
    
    return `
        <div class="profile-card" onclick="window.open('https://x.com/${profile.handle}', '_blank')">
            <div class="profile-header">
                <div class="profile-seal">
                    <img src="${profile.profile_image || '/favicon.svg'}" 
                         alt="@${profile.handle}" 
                         class="profile-pic"
                         onerror="this.src='/favicon.svg'">
                </div>
                <div class="profile-info">
                    <div class="profile-handle">@${profile.handle}</div>
                    <div class="profile-title">${title}</div>
                </div>
            </div>
            <div class="profile-details">
                <div class="detail-row">
                    <span class="detail-label">Followers:</span>
                    <span class="detail-value">${followers}</span>
                </div>
                ${profile.location ? `
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value location">${escapeHtml(profile.location)}</span>
                </div>
                ` : ''}
                <div class="join-date-box">
                    <span class="join-label">Joined On:</span> ${formattedDate}
                    ${isOG ? '<span class="og-badge">OG</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

// Get epoch title based on join year
function getEpochTitle(year) {
    if (year <= 2007) return 'Founding Spark';
    if (year <= 2009) return 'Epoch Weaver';
    if (year <= 2012) return 'Epoch Builder';
    if (year <= 2015) return 'Chronicle Keeper';
    if (year <= 2018) return 'Digital Scribe';
    return 'Modern Inscriber';
}

// Format follower count
function formatFollowers(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}