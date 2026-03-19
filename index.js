/**
 * 文字分享卡片生成器
 * - 宽高比固定 0.75 (3:4)
 * - 根据文字量智能适配字号和卡片尺寸
 * - 使用 html2canvas 保存为 PNG
 */

// ── State ──
let currentStyle = 'social';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadRandomAvatar();
    // Default show card
    setTimeout(() => {
        const ta = document.getElementById('cardContent');
        if (ta && ta.value) {
            document.getElementById('charCount').textContent = ta.value.length + ' 字';
            generateCard();
        }
    }, 100);
});

// ========================================
// Events
// ========================================
function bindEvents() {
    // 字数统计
    const ta = document.getElementById('cardContent');
    const cc = document.getElementById('charCount');
    ta.addEventListener('input', () => { cc.textContent = ta.value.length + ' 字'; });

    // 风格切换
    document.querySelectorAll('.style-card').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-card').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
            // 已有卡片时实时刷新
            if (document.getElementById('cardWrapper').style.display !== 'none') generateCard();
        });
    });

    // Ctrl+Enter 快捷键
    ta.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generateCard(); }
    });

    // 生成 & 保存
    document.getElementById('generateBtn').addEventListener('click', generateCard);
    document.getElementById('saveBtn').addEventListener('click', saveCard);
    document.getElementById('copyBtn').addEventListener('click', copyCard);
}

// ========================================
// Avatar
// ========================================
async function loadRandomAvatar() {
    try {
        const seed = Math.random().toString(36).substring(2, 10);
        // DiceBear adventurer 风格：自带彩色背景，填满圆形，无跨域问题
        const bgColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a8edbb', 'f9c6e0'];
        const bg = bgColors[Math.floor(Math.random() * bgColors.length)];
        const res = await fetch(`https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}`);
        if (res.ok) {
            const svgText = await res.text();
            const avatarContainer = document.getElementById('displayProfileAvatar');
            if (avatarContainer) {
                avatarContainer.innerHTML = svgText;
                avatarContainer.style.padding = '0';
                const svgEl = avatarContainer.querySelector('svg');
                if (svgEl) {
                    svgEl.style.width = '100%';
                    svgEl.style.height = '100%';
                    svgEl.style.display = 'block';
                }
            }
        }
    } catch (err) {
        console.error('获取随机头像失败:', err);
    }
}

// ========================================
// Generate
// ========================================
function generateCard() {
    const title   = document.getElementById('cardTitle').value.trim();
    const content = document.getElementById('cardContent').value.trim();
    const author  = document.getElementById('cardAuthor').value.trim();
    const subtitleField = document.getElementById('cardSubtitle');
    const subtitle = subtitleField ? subtitleField.value.trim() : '';

    if (!content) { toast('请输入正文内容', 'error'); document.getElementById('cardContent').focus(); return; }

    // 隐藏空态
    document.getElementById('emptyState').style.display = 'none';
    const wrapper = document.getElementById('cardWrapper');
    wrapper.style.display = 'flex';
    document.getElementById('previewActions').style.display = 'block';

    // 触发入场动画
    wrapper.style.animation = 'none';
    void wrapper.offsetHeight;
    wrapper.style.animation = '';

    // 主题
    const card = document.getElementById('shareCard');
    card.className = 'share-card theme-' + currentStyle;

    // ── 标题 ──
    const titleArea = document.getElementById('cardTitleArea');
    if (title) {
        titleArea.style.display = 'block';
        const h3 = document.getElementById('displayTitle');
        h3.innerHTML = '';
        const span = document.createElement('span');
        span.className = 'highlight-text';
        span.textContent = title;
        h3.appendChild(span);
        // 清除旧的颜色，生成时重新获取随机色
        span.dataset.hlColor = '';
    } else {
        titleArea.style.display = 'none';
    }

    // ── 正文（空行缩短处理）──
    const contentArea = document.getElementById('displayContent');
    contentArea.innerHTML = '';
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.trim() === '') {
            const spacer = document.createElement('div');
            spacer.className = 'empty-line';
            contentArea.appendChild(spacer);
        } else {
            const span = document.createElement('span');
            span.textContent = line;
            contentArea.appendChild(span);
            if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
                contentArea.appendChild(document.createElement('br'));
            }
        }
    });

    // ── 署名 / 社交Profile ──
    const authorArea = document.getElementById('cardAuthorArea');
    const profileArea = document.getElementById('cardProfileArea');
    
    if (author) {
        authorArea.style.display = ''; // Let CSS manage visibility
        document.getElementById('displayAuthor').textContent = author;
        
        if (profileArea) {
            profileArea.style.display = '';
            document.getElementById('displayProfileName').textContent = author;
        }
    } else {
        authorArea.style.display = 'none';
        if (profileArea) profileArea.style.display = 'none';
    }

    if (profileArea) {
        const subEl = document.getElementById('displayProfileSub');
        if (subtitle) {
            subEl.textContent = subtitle;
            subEl.style.display = 'block';
        } else {
            subEl.style.display = 'none';
        }
    }

    // ── 计算尺寸 ──
    layoutCard(title, content, author);
}

// ========================================
// Smart Layout  (width : height = 0.75)
// ========================================
function layoutCard(title, content, author) {
    const card       = document.getElementById('shareCard');
    const titleEl    = document.getElementById('displayTitle');
    const contentEl  = document.getElementById('displayContent');
    const bodyEl     = card.querySelector('.card-body');

    // 可用宽度上限
    const previewW = document.getElementById('previewArea').clientWidth - 16;

    const len = content.length;
    const hasTitle  = !!title;
    const hasAuthor = !!author;

    // ── 基础卡片宽度 ──
    let w;
    if (len <= 30)       w = 320;
    else if (len <= 80)  w = 360;
    else if (len <= 150) w = 400;
    else if (len <= 300) w = 440;
    else if (len <= 500) w = 480;
    else                 w = 520;

    // 限制在预览区内
    const maxW = previewW > 0 ? previewW : 360;
    if (w > maxW) w = maxW;

    // ── 动态计算极佳字号 ──
    // 依据可用面积公式自动推算最佳填充字号，然后用自适应函数微调
    let estimatedCfs = Math.floor(w * Math.sqrt(0.45 / (len || 1)));
    let cFs = Math.min(Math.max(estimatedCfs, 13), 36); // 控制范围在 13px - 36px 内
    let tFs = Math.max(16, Math.floor(cFs * 1.15));     // 标题总是比正文大一圈

    let h = Math.round(w / 0.75);

    // 应用初始尺寸 + 字号
    card.style.width  = w + 'px';
    card.style.height = h + 'px';
    titleEl.style.fontSize   = tFs + 'px';
    contentEl.style.fontSize = cFs + 'px';

    // ── 等布局稳定后检测溢出 ──
    requestAnimationFrame(() => {
        fitContent(card, bodyEl, titleEl, contentEl, w, tFs, cFs);
    });
}

// ── 自适应溢出 ──
function fitContent(card, body, titleEl, contentEl, w, tFs, cFs) {
    const MAX_ROUNDS = 60; // 增加调整迭代次数
    for (let i = 0; i < MAX_ROUNDS; i++) {
        if (body.scrollHeight <= card.clientHeight) {
            if (typeof drawTitleHighlight === 'function') drawTitleHighlight();
            return;      // 已经完美容纳，无溢出
        }

        // 优先将超大正文字号逐步缩小
        if (cFs > 13) {
            cFs--;
            contentEl.style.fontSize = cFs + 'px';
            continue;
        }
        // 接着缩小标题
        if (tFs > 15) {
            tFs--;
            titleEl.style.fontSize = tFs + 'px';
            continue;
        }
        // 若到达下限仍无法容纳，则扩大卡片尺寸保障排版
        w += 20;
        card.style.width  = w + 'px';
        card.style.height = Math.round(w / 0.75) + 'px';
        
        // 卡片变大后，稍微恢复一点字号以重新平衡
        cFs += 1;
        contentEl.style.fontSize = cFs + 'px';
    }
    if (typeof drawTitleHighlight === 'function') drawTitleHighlight();
}

// ── 标题高亮笔触效果 ──
function drawTitleHighlight() {
    const titleArea = document.getElementById('cardTitleArea');
    if (!titleArea || titleArea.style.display === 'none') return;
    
    const titleEl = document.getElementById('displayTitle');
    const textSpan = titleEl.querySelector('.highlight-text');
    if (!textSpan) return;

    const oldContainer = document.getElementById('titleHighlightContainer');
    if (oldContainer) oldContainer.remove();

    titleArea.style.position = 'relative';
    titleEl.style.position = 'relative';
    titleEl.style.zIndex = '1';

    const colors = [
        'rgba(253, 224, 71, 0.65)',
        'rgba(134, 239, 172, 0.65)',
        'rgba(147, 197, 253, 0.65)',
        'rgba(249, 168, 212, 0.65)',
        'rgba(216, 180, 254, 0.65)'
    ];
    let rc = textSpan.dataset.hlColor;
    if (!rc) {
        rc = colors[Math.floor(Math.random() * colors.length)];
        textSpan.dataset.hlColor = rc;
    }

    const hlContainer = document.createElement('div');
    hlContainer.id = 'titleHighlightContainer';
    hlContainer.style.position = 'absolute';
    hlContainer.style.top = '0';
    hlContainer.style.left = '0';
    hlContainer.style.width = '100%';
    hlContainer.style.height = '100%';
    hlContainer.style.pointerEvents = 'none';
    hlContainer.style.zIndex = '0';

    setTimeout(() => {
        const rects = textSpan.getClientRects();
        const parentRect = titleArea.getBoundingClientRect();

        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            if (rect.width === 0 || rect.height === 0) continue;
            
            const hl = document.createElement('div');
            hl.style.position = 'absolute';
            hl.style.left = (rect.left - parentRect.left - 6) + 'px';
            hl.style.top = (rect.top - parentRect.top + rect.height * 0.55) + 'px'; 
            hl.style.width = (rect.width + 12) + 'px';
            hl.style.height = (rect.height * 0.45) + 'px';
            hl.style.backgroundColor = rc;
            hl.style.borderRadius = '6px';
            hl.style.transform = `skew(-12deg) rotate(${Math.random() > 0.5 ? 1 : -1}deg)`;
            
            hlContainer.appendChild(hl);
        }
        titleArea.insertBefore(hlContainer, titleEl);
    }, 10);
}

// ── 标题高亮笔触效果 ──

// ========================================
// Save Card as PNG (html2canvas)
// ========================================
function saveCard() {
    const card = document.getElementById('shareCard');
    if (!card) return;

    if (typeof html2canvas === 'undefined') {
        toast('截图库加载失败，请检查网络或刷新页面', 'error');
        return;
    }

    // 显示加载遮罩
    const overlay = document.createElement('div');
    overlay.className = 'saving-overlay';
    overlay.innerHTML = '<div class="saving-spinner"></div>';
    document.body.appendChild(overlay);

    // 临时移除某些可能导致跨域或污染画布的特效
    const texture = card.querySelector('.card-texture');
    if (texture) texture.style.opacity = '0.02';

    html2canvas(card, {
        scale: 3,
        backgroundColor: null,
        allowTaint: true,
        useCORS: true,
    }).then(canvas => {
        if (texture) texture.style.opacity = '';
        overlay.remove();

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'share-card-' + Date.now() + '.png';
            link.href = dataUrl;
            link.click();
            toast('图片已保存 ✓', 'success');
        } catch (e) {
            console.error(e);
            toast('保存失败（可能因浏览器限制），请直接截图', 'error');
        }
    }).catch(err => {
        if (texture) texture.style.opacity = '';
        overlay.remove();
        console.error(err);
        toast('渲染失败，请尝试原生截图', 'error');
    });
}

// ========================================
// Copy Card to Clipboard
// ========================================
function copyCard() {
    const card = document.getElementById('shareCard');
    if (!card) return;

    // 检查 Clipboard API 是否可用（通常本地 file:// 协议不可用）
    if (!navigator.clipboard || !navigator.clipboard.write) {
        toast('当前环境不支持直接复制（请尝试点击保存或截图）', 'error');
        return;
    }

    if (typeof html2canvas === 'undefined') {
        toast('截图库仍在加载，请稍后再试', 'error');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'saving-overlay';
    overlay.innerHTML = '<div class="saving-spinner"></div>';
    document.body.appendChild(overlay);

    const texture = card.querySelector('.card-texture');
    if (texture) texture.style.opacity = '0.02';

    html2canvas(card, {
        scale: 3,
        backgroundColor: null,
        allowTaint: true,
        useCORS: true,
    }).then(canvas => {
        if (texture) texture.style.opacity = '';
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
        if (texture) texture.style.opacity = '';
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
