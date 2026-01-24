/**
 * SKINSENSE AI - MASTER CONTROLLER
 * Features: Deep Skin Analysis, Dermal Nutrition, History Persistence, Chatbot
 */

const socket = io();
let currentData = null;
let waterConsumed = 0;

// --- 1. INITIALIZATION & SETUP ---
document.addEventListener('DOMContentLoaded', () => {
    initWebcam();
    initTheme();
    setupNavigation();
    initMotivation();
    loadDiary();
    syncSettings(); // Load water goals & history immediately
});

// Initialize Webcam
async function initWebcam() {
    const video = document.getElementById('webcam');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        video.srcObject = stream;
    } catch (e) {
        console.error("Camera Error:", e);
        alert("Camera access required for skin analysis.");
    }
}

// --- 2. SINGLE PAGE APPLICATION (SPA) NAVIGATION ---
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.dataset.target;
            
            // Switch Views
            document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
            document.getElementById(`view-${target}`).style.display = 'block';
            
            // Update Active Tab
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Refresh Data on Tab Switch
            if(target === 'history') renderHistory();
            if(target === 'settings') syncSettings();
        });
    });
}

// --- 3. AI ANALYSIS ENGINE ---
document.getElementById('captureBtn').onclick = () => {
    const line = document.getElementById('scanLine');
    line.style.display = 'block'; // Start scanning animation
    
    // Capture Frame
    const canvas = document.createElement('canvas');
    const video = document.getElementById('webcam');
    canvas.width = 224; canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 224, 224);
    
    // Send to Backend
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    socket.emit('frame', dataUrl);
};

// Handle Results
socket.on('result', (res) => {
    currentData = res;
    document.getElementById('scanLine').style.display = 'none';
    document.getElementById('resultPlaceholder').style.display = 'none';
    document.getElementById('resultDisplay').style.display = 'block';

    // A. Update Basic Info
    document.getElementById('timeBadge').innerText = `${res.time_of_day} Analysis`;
    document.getElementById('skinLabel').innerText = `${res.skin} Skin Detected`;
    document.getElementById('activeIngredient').innerText = res.active_ingredient;
    
    // B. Render Detailed Routine (Epidermal Focus)
    const routineHTML = res.routine.map(step => `
        <li><span style="color:var(--accent)">✔</span> ${step}</li>
    `).join('');
    document.getElementById('routineList').innerHTML = routineHTML;

    // C. Render Diet (Dermal Focus)
    const dietHTML = res.diet.map(item => `
        <div class="diet-item"><span>🥗</span> ${item}</div>
    `).join('');
    document.getElementById('dietList').innerHTML = dietHTML;

    // D. Render Products
    const productHTML = res.products.map(p => `
        <div class="product-card">
            <p>${p}</p>
            <a href="https://www.google.com/search?q=${encodeURIComponent(p)}" target="_blank" class="buy-btn">Find Online</a>
        </div>
    `).join('');
    document.getElementById('productList').innerHTML = productHTML;

    // E. Save to History
    saveHistory(res.skin);
});

// --- 4. HISTORY & PERSISTENCE ---
function saveHistory(type) {
    const history = JSON.parse(localStorage.getItem('skin_history') || '[]');
    const entry = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: type
    };
    history.unshift(entry);
    localStorage.setItem('skin_history', JSON.stringify(history.slice(0, 15))); // Keep last 15
}

function renderHistory() {
    const container = document.getElementById('historyLog');
    const logs = JSON.parse(localStorage.getItem('skin_history') || '[]');
    
    if (logs.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">No scans yet. Analyze your skin to start your journey.</p>`;
        return;
    }

    container.innerHTML = logs.map(l => `
        <div class="history-item">
            <div class="h-info">
                <strong>${l.type} Skin</strong>
                <span>${l.date} • ${l.time}</span>
            </div>
            <div style="font-size:0.8rem; background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:4px;">Logged</div>
        </div>
    `).join('');
}

window.wipeHistory = () => {
    if(confirm("Are you sure you want to delete all scan history?")) {
        localStorage.removeItem('skin_history');
        renderHistory();
    }
};

// --- 5. SETTINGS & DERMAL HYDRATION ---
function syncSettings() {
    const goal = localStorage.getItem('water_goal') || "2.5";
    document.getElementById('goalInput').value = goal;
    document.getElementById('targetVol').innerText = goal;
    updateWaterUI();
}

document.getElementById('goalInput').addEventListener('input', (e) => {
    localStorage.setItem('water_goal', e.target.value);
    document.getElementById('targetVol').innerText = e.target.value;
    updateWaterUI();
});

window.addWater = () => {
    waterConsumed += 0.25;
    document.getElementById('waterVol').innerText = waterConsumed.toFixed(2);
    updateWaterUI();
};

function updateWaterUI() {
    const goal = parseFloat(localStorage.getItem('water_goal') || "2.5");
    const percent = Math.min((waterConsumed / goal) * 100, 100);
    document.getElementById('waterFill').style.width = percent + "%";
}

// --- 6. DIARY & MOTIVATION ---
function initMotivation() {
    const quotes = [
        "Your skin is an investment, not an expense.",
        "Healthy skin is a reflection of overall wellness.",
        "Consistency is the mother of mastery.",
        "Hydrate your body, hydrate your skin."
    ];
    document.getElementById('dailyQuote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
}

const diaryInput = document.getElementById('diaryInput');
diaryInput.addEventListener('input', () => {
    localStorage.setItem('skin_diary_content', diaryInput.value);
    document.getElementById('saveStatus').innerText = "Saved";
    setTimeout(() => { document.getElementById('saveStatus').innerText = "Auto-saving..."; }, 2000);
});

function loadDiary() {
    diaryInput.value = localStorage.getItem('skin_diary_content') || "";
}

// --- 7. UTILS: THEME & PDF ---
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').innerText = saved === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
}

document.getElementById('themeToggle').onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
    document.getElementById('themeToggle').innerText = target === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
};

document.getElementById('downloadPdf').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Branding
    doc.setFillColor(255, 117, 140);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("SkinSense AI - Professional Report", 15, 17);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Skin Analysis: ${currentData.skin}`, 15, 40);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleString()}`, 15, 48);
    
    doc.setFontSize(12);
    doc.text("Prescribed Routine:", 15, 65);
    currentData.routine.forEach((line, i) => doc.text(`• ${line}`, 20, 75 + (i * 8)));

    const dietY = 75 + (currentData.routine.length * 8) + 15;
    doc.text("Nutrition Plan:", 15, dietY);
    currentData.diet.forEach((line, i) => doc.text(`• ${line}`, 20, dietY + 10 + (i * 8)));
    
    doc.save(`SkinSense_${currentData.skin}.pdf`);
};

// --- 8. INTELLIGENT CHATBOT ---
window.toggleChat = () => document.getElementById('chatBox').classList.toggle('chat-minimized');

document.getElementById('sendMsg').onclick = () => {
    const input = document.getElementById('chatInput');
    const msg = input.value.toLowerCase();
    const box = document.getElementById('chatMsgs');
    
    if(!msg) return;

    box.innerHTML += `<div class="user-msg">${input.value}</div>`;
    
    let reply = "I can help with routine steps or definitions.";
    if(msg.includes('spf')) reply = "SPF prevents UV damage to the dermis, stopping premature aging.";
    if(msg.includes('acne')) reply = "Acne starts in the follicle. Salicylic Acid helps by clearing oil deep inside.";
    if(msg.includes('dry')) reply = "Dry skin lacks oil. Use Ceramides to repair the epidermal barrier.";
    
    setTimeout(() => {
        box.innerHTML += `<div class="bot-msg">${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 500);
    input.value = "";
};