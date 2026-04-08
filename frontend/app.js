const API_URL = "/api/queries/";
const UPLOAD_API_URL = "/api/upload-document/";
const AUTH_REGISTER_URL = "/api/auth/register/";
const AUTH_LOGIN_URL = "/api/auth/login/";

// ================= DOM ELEMENTS ================= //
const layers = {
    public: document.getElementById('layer-public'),
    auth: document.getElementById('layer-auth'),
    protected: document.getElementById('layer-protected')
};

// Workspace Views (Inside Dashboard)
const workspaces = {
    chat: document.getElementById('view-chat'),
    history: document.getElementById('view-history')
};

// Navigation / Actions
const btnNavLogin = document.getElementById('nav-btn-login');
const btnHeroLogin = document.getElementById('hero-btn-login');
const btnHeroStart = document.getElementById('hero-btn-start');
const btnBackHome = document.getElementById('btn-back-home');
const btnLogout = document.getElementById('btn-logout');

// Sidebar Links
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-target]');
const sidebarUploadBtn = document.getElementById('sidebar-upload-btn');

// Chat / Upload
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const chatBox = document.getElementById('chat-box');
const historyList = document.getElementById('history-list');

const btnAttach = document.getElementById('btn-attach');
const fileInput = document.getElementById('file-input');
const filePreviewBanner = document.getElementById('file-preview-banner');
const filePreviewName = document.getElementById('file-preview-name');
const removeFileBtn = document.getElementById('remove-file');
let attachedFile = null;

// Auth DOM
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const btnSwitchAuth = document.getElementById('btn-switch-auth');
const authSwitchText = document.getElementById('auth-switch-text');
const authError = document.getElementById('auth-error');
const nameGroup = document.getElementById('name-group');
let isLoginMode = true;

// Modals
const lawyerModal = document.getElementById('lawyer-modal');


// ================= ROUTING & LAYERS ================= //

function getAuthToken() { return localStorage.getItem('access_token'); }

function switchLayer(layerName) {
    // Determine active target based on auth state heavily
    if (layerName === 'protected' && !getAuthToken()) {
        layerName = 'auth'; // Force warp to auth
    } else if (layerName === 'public' && getAuthToken()) {
        layerName = 'protected'; // Authenticated users can't see the landing page
    }

    // Hide all
    Object.values(layers).forEach(layer => layer?.classList.remove('active-layer'));
    
    // Show target
    layers[layerName]?.classList.add('active-layer');

    // Handle post-routing hooks
    if (layerName === 'protected') {
        // Hydrate the dashboard silently
        fetchHistory();
        switchWorkspace('chat'); // Reset to chat view by default
    }
}

function switchWorkspace(viewName) {
    if (!getAuthToken()) return switchLayer('auth'); // Hard guard

    Object.values(workspaces).forEach(w => w?.classList.remove('active-workspace'));
    workspaces[viewName]?.classList.add('active-workspace');

    // UI Feedback on Sidebar
    sidebarLinks.forEach(link => {
        if (link.dataset.target === viewName) link.classList.add('active');
        else link.classList.remove('active');
    });

    if (viewName === 'history') fetchHistory();
}

// BIND ROUTING EVENTS
btnNavLogin.addEventListener('click', () => switchLayer('auth'));
btnHeroLogin.addEventListener('click', () => switchLayer('auth'));
btnHeroStart.addEventListener('click', () => switchLayer('protected')); // Will auto-intercept if not logged in
btnBackHome.addEventListener('click', () => switchLayer('public'));

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchWorkspace(link.dataset.target);
    });
});

sidebarUploadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!getAuthToken()) return switchLayer('auth');
    switchWorkspace('chat');
    fileInput.click();
});

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    switchLayer('public');
});

// ================= AUTH LOGIC ================= //

function handleAuthError(errText, isSuccess = false) {
    authError.textContent = errText || "";
    authError.style.color = isSuccess ? "var(--success)" : "var(--warning)";
}

btnSwitchAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    handleAuthError("");
    
    if (isLoginMode) {
        authTitle.textContent = "Welcome back";
        authSubtitle.textContent = "Log in to your LexAI account";
        nameGroup.style.display = 'none';
        btnSwitchAuth.textContent = "Sign up";
        authSwitchText.textContent = "Don't have an account?";
        document.getElementById('auth-submit-btn').textContent = "Sign In";
    } else {
        authTitle.textContent = "Create an account";
        authSubtitle.textContent = "Join LexAI for personalized legal guidance";
        nameGroup.style.display = 'block';
        btnSwitchAuth.textContent = "Log in";
        authSwitchText.textContent = "Already have an account?";
        document.getElementById('auth-submit-btn').textContent = "Sign Up";
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    handleAuthError("");
    document.getElementById('auth-submit-btn').disabled = true;

    const email = authEmail.value;
    const password = authPassword.value;
    const name = authName.value;

    try {
        if (isLoginMode) {
            const res = await fetch(AUTH_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('access_token', data.access);
                authEmail.value = ""; authPassword.value = "";
                switchLayer('protected');
            } else {
                handleAuthError("Invalid credentials.");
            }
        } else {
            const res = await fetch(AUTH_REGISTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            const data = await res.json();
            if (res.ok) {
                isLoginMode = true;
                btnSwitchAuth.click(); 
                handleAuthError("Account created! Please log in.", true);
            } else {
                handleAuthError(data.error || "Registration failed.");
            }
        }
    } catch(err) {
        handleAuthError("Server connection failed.");
    } finally {
        document.getElementById('auth-submit-btn').disabled = false;
    }
});


// ================= CORE APP LOGIC (CHAT & FILE) ================= //

function getAuthHeaders(isForm = false) {
    const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
    if (!isForm) headers['Content-Type'] = 'application/json';
    return headers;
}

btnAttach.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        attachedFile = e.target.files[0];
        if (attachedFile.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.');
            attachedFile = null; fileInput.value = ''; return;
        }
        filePreviewName.textContent = attachedFile.name;
        filePreviewBanner.classList.add('active');
        chatInput.placeholder = "Add an optional message...";
    }
});
removeFileBtn.addEventListener('click', () => {
    attachedFile = null; fileInput.value = '';
    filePreviewBanner.classList.remove('active');
    chatInput.placeholder = "Type your problem or upload a document...";
});

function addMessage(content, sender, isMarkdown = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender === 'user' ? 'user-message' : 'ai-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar'; 
    const iconTag = document.createElement('i');
    iconTag.setAttribute('data-lucide', sender === 'user' ? 'user' : 'bot');
    avatar.appendChild(iconTag);

    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender === 'ai' ? 'glass-bubble' : ''}`;
    
    if (isMarkdown && sender === 'ai') bubble.innerHTML = marked.parse(content);
    else bubble.textContent = content;

    msgDiv.appendChild(avatar); msgDiv.appendChild(bubble);

    if (sender === 'ai' && content !== 'Thinking...') {
        const actions = document.createElement('div');
        actions.className = 'action-buttons';
        
        const btnPdf = document.createElement('button');
        btnPdf.className = 'btn-secondary flex-center'; 
        btnPdf.innerHTML = '<i data-lucide="download" class="mr-2"></i> Download PDF';
        btnPdf.onclick = () => exportToPDF(content);

        const btnLaw = document.createElement('button');
        btnLaw.className = 'btn-secondary flex-center'; 
        btnLaw.innerHTML = '<i data-lucide="phone" class="mr-2"></i> Talk to a Lawyer';
        btnLaw.onclick = () => lawyerModal.classList.add('active-modal');

        actions.appendChild(btnPdf); actions.appendChild(btnLaw);
        bubble.appendChild(actions);
    }

    chatBox.appendChild(msgDiv); 
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Trigger Lucide to parse the new icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    return msgDiv;
}

function addTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.id = 'typing-indicator'; msgDiv.className = 'message ai-message';
    msgDiv.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    chatBox.appendChild(msgDiv); chatBox.scrollTop = chatBox.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
}

function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text && !attachedFile) return;

    chatInput.value = '';
    
    if (attachedFile) addMessage(`📎 Uploaded: ${attachedFile.name}\n${text}`, 'user');
    else addMessage(text, 'user');
    
    addTypingIndicator();

    try {
        let res;
        if (attachedFile) {
            const formData = new FormData();
            formData.append('document', attachedFile);

            attachedFile = null; fileInput.value = '';
            filePreviewBanner.classList.remove('active');
            chatInput.placeholder = "Type your problem or upload a document...";

            res = await fetch(UPLOAD_API_URL, {
                method: 'POST', headers: getAuthHeaders(true), body: formData
            });
        } else {
            res = await fetch(API_URL, {
                method: 'POST', headers: getAuthHeaders(false), body: JSON.stringify({ query_text: text })
            });
        }

        if (res.status === 401) {
            localStorage.removeItem('access_token');
            switchLayer('auth'); return;
        }

        const data = await res.json();
        removeTypingIndicator();

        if (res.ok && data.ai_response) addMessage(data.ai_response, 'ai', true);
        else addMessage(`Sorry, an error occurred: ${data.error || 'Server error'}`, 'ai');
        
    } catch (err) {
        removeTypingIndicator(); console.error(err);
        addMessage('Failed to connect to the server.', 'ai');
    }
}

btnSend.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

async function fetchHistory() {
    historyList.innerHTML = '<div class="loading-history text-muted">Loading history...</div>';
    try {
        const res = await fetch(API_URL, { headers: getAuthHeaders(false) });
        if (res.status === 401) {
            localStorage.removeItem('access_token');
            switchLayer('auth'); return;
        }

        const data = await res.json();
        historyList.innerHTML = '';
        if(data.length === 0) { historyList.innerHTML = '<p class="text-muted">No past queries found.</p>'; return; }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            
            const date = new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
            const cleanResponse = item.ai_response ? item.ai_response.substring(0, 150).replace(/\*/g, '') + '...' : 'No response';
            
            card.innerHTML = `
                <div class="history-query">${item.query_text}</div>
                <div class="history-date">${date}</div>
                <div class="history-preview">${cleanResponse}</div>
            `;
            historyList.appendChild(card);
        });

    } catch(err) { historyList.innerHTML = '<p class="text-muted">Failed to load history.</p>'; }
}

// PDF Export Logic
function exportToPDF(markdownText) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let rawText = markdownText.replace(/\*\*/g, '').replace(/#/g, '');
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("LexAI - Legal Guidance Report", 20, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    
    const lines = doc.splitTextToSize(rawText, 170);
    let y = 35;
    
    for (let i = 0; i < lines.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(lines[i], 20, y);
        y += 6;
    }
    
    doc.save("LexAI_Report.pdf");
}

document.querySelector('.close-modal').addEventListener('click', () => { lawyerModal.classList.remove('active-modal'); });

// ================= ENTRY POINT ================= //
// Auto-detect which layer to show securely on load
if (getAuthToken()) {
    switchLayer('protected');
} else {
    switchLayer('public');
}
