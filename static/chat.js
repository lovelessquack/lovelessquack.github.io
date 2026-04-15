/**
 * 微信聊天记录生成器
 */

// ── State ──
let chatHistory = [];
// leftAvatar = 对方图标，rightAvatar = 自己图标
let leftAvatarSvg = '';
let rightAvatarSvg = '';
const DEFAULT_AVATAR_URL = 'https://pbs.twimg.com/profile_images/2034650591889342464/NU7k1cs-_400x400.jpg';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initAvatarField();
    initAvatars();
    updateHeaderName();
});

// ========================================
// Events
// ========================================
function bindEvents() {
    document.getElementById('addLeftBtn').addEventListener('click', () => {
        addMessage('left');
    });

    document.getElementById('addRightBtn').addEventListener('click', () => {
        addMessage('right');
    });

    document.getElementById('clearChatBtn').addEventListener('click', () => {
        chatHistory = [];
        renderChat();
    });

    // 监听对方名字修改
    document.getElementById('chatTargetName').addEventListener('input', updateHeaderName);
    document.getElementById('chatAvatarUrl').addEventListener('input', () => {
        initAvatars();
    });

    // Ctrl+Enter 快捷键
    document.getElementById('leftMessage').addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); addMessage('left'); }
    });
    document.getElementById('rightMessage').addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); addMessage('right'); }
    });

    // 保存和复制
    document.getElementById('saveBtn').addEventListener('click', saveCard);
    document.getElementById('copyBtn').addEventListener('click', copyCard);
}

function initAvatarField() {
    const avatarInput = document.getElementById('chatAvatarUrl');
    if (avatarInput && !avatarInput.value.trim()) {
        avatarInput.value = DEFAULT_AVATAR_URL;
    }
}

function getChatAvatarUrl() {
    const avatarInput = document.getElementById('chatAvatarUrl');
    return avatarInput ? avatarInput.value.trim() : '';
}

function buildAvatarImageMarkup(url) {
    return `<img src="${url}" alt="avatar" crossorigin="anonymous">`;
}

// 同步名字
function updateHeaderName() {
    const val = document.getElementById('chatTargetName').value.trim() || '一只甜薯';
    document.getElementById('displayTargetName').textContent = val;
}

// 添加消息到队列
function addMessage(side) {
    const textareaId = side === 'left' ? 'leftMessage' : 'rightMessage';
    const textarea = document.getElementById(textareaId);
    const content = textarea.value.trim();
    
    if (!content) {
        toast('请输入发言内容', 'error');
        textarea.focus();
        return;
    }

    chatHistory.push({
        id: Date.now(),
        side: side, // 'left' | 'right'
        content: content
    });

    // 清空当前输入框
    textarea.value = '';
    textarea.focus();

    renderChat();
}

// 强制隐藏空状态
function renderChat() {
    const chatList = document.getElementById('chatList');
    
    if (chatHistory.length === 0) {
        chatList.innerHTML = `
            <div class="chat-empty-hint" id="chatEmptyHint" style="text-align:center; color:#999; font-size:0.85rem; padding: 40px 0;">
                在左侧输入内容并添加即可生成对话
            </div>
        `;
        return;
    }

    chatList.innerHTML = '';
    
    chatHistory.forEach(msg => {
        const row = document.createElement('div');
        row.className = `chat-row chat-row-${msg.side}`;
        
        const avatarBox = document.createElement('div');
        avatarBox.className = 'chat-avatar';
        avatarBox.innerHTML = msg.side === 'left' ? leftAvatarSvg : rightAvatarSvg;
        
        const bubbleBox = document.createElement('div');
        bubbleBox.className = `chat-bubble chat-bubble-${msg.side}`;
        bubbleBox.textContent = msg.content; // textContent properly escapes text and preserves newlines via CSS pre-wrap
        
        row.appendChild(avatarBox);
        row.appendChild(bubbleBox);
        
        chatList.appendChild(row);
    });
    
    // 滚动到底部（如果在可滚动容器内）
    // 当前为固定全展示以截图为主
}

// ========================================
// Avatars
// ========================================
async function initAvatars() {
    const customAvatarUrl = getChatAvatarUrl();
    // Left avatar (对方)
    leftAvatarSvg = customAvatarUrl ? buildAvatarImageMarkup(customAvatarUrl) : await fetchRandomAvatar('left');
    // Right avatar (自己)
    rightAvatarSvg = await fetchRandomAvatar('right');
    
    // 如果已有消息重刷一下
    renderChat();
}

async function fetchRandomAvatar(seedPrefix) {
    try {
        const seed = seedPrefix + Math.random().toString(36).substring(2, 8);
        const bgColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a8edbb', 'f9c6e0'];
        const bg = bgColors[Math.floor(Math.random() * bgColors.length)];
        const res = await fetch(`https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}`);
        if (res.ok) {
            return await res.text();
        }
    } catch (err) {
        console.error('获取头像失败:', err);
    }
    // 失败回退使用简单的svg
    return '<svg viewBox="0 0 24 24" fill="#a0a0a0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
}

// ========================================
// Save & Copy as PNG (html2canvas shared logic)
// ========================================
function validateSave() {
    if (chatHistory.length === 0) {
        toast('没有聊天记录，无法生成哦', 'error');
        return false;
    }
    if (typeof html2canvas === 'undefined') {
        toast('截图库加载失败，请检查网络或刷新页面', 'error');
        return false;
    }
    return true;
}

function showOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'saving-overlay';
    overlay.innerHTML = '<div class="saving-spinner"></div>';
    document.body.appendChild(overlay);
    return overlay;
}

function saveCard() {
    if (!validateSave()) return;
    
    const card = document.getElementById('shareCard');
    const overlay = showOverlay();

    html2canvas(card, {
        scale: 3,
        backgroundColor: null,
        allowTaint: true,
        useCORS: true
    }).then(canvas => {
        overlay.remove();
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'chat-record-' + Date.now() + '.png';
            link.href = dataUrl;
            link.click();
            toast('图片已保存 ✓', 'success');
        } catch (e) {
            console.error(e);
            toast('保存失败（可能是浏览器限制），请直接截图', 'error');
        }
    }).catch(err => {
        overlay.remove();
        console.error(err);
        toast('渲染失败，请尝试原生截图', 'error');
    });
}

function copyCard() {
    if (!validateSave()) return;

    if (!navigator.clipboard || !navigator.clipboard.write) {
        toast('当前环境不支持直接复制（请尝试点击保存或截图）', 'error');
        return;
    }

    const card = document.getElementById('shareCard');
    const overlay = showOverlay();

    html2canvas(card, {
        scale: 3,
        backgroundColor: null,
        allowTaint: true,
        useCORS: true
    }).then(canvas => {
        canvas.toBlob(blob => {
            if (!blob) { overlay.remove(); toast('生成 Blob 失败', 'error'); return; }

            navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
                overlay.remove();
                toast('已复制到剪贴板 ✓', 'success');
            }).catch(e => {
                overlay.remove();
                console.error(e);
                toast('复制失败，可能是浏览器权限限制', 'error');
            });
        }, 'image/png');
    }).catch(err => {
        overlay.remove();
        console.error(err);
        toast('复制渲染失败', 'error');
    });
}

// ========================================
// Toast
// ========================================
function toast(msg, type = 'info') {
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'toast toast-' + type;

    const icons = {
        error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 10 11 15 8 12"/></svg>',
    };
    el.innerHTML = (icons[type] || '') + msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2400);
}
