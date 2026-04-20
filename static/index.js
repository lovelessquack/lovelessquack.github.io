/**
 * 文字分享卡片生成器
 * - 宽高比固定 0.75 (3:4)
 * - 根据文字量智能适配字号和卡片尺寸
 * - 使用 html2canvas 保存为 PNG
 */

// ── State ──
let currentStyle = 'social';
const DEFAULT_AVATAR_URL = 'https://pbs.twimg.com/profile_images/2034650591889342464/NU7k1cs-_400x400.jpg';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initAvatarField();
    updateCardAvatars();
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
    document.getElementById('saveToServerBtn').addEventListener('click', saveToServer);
    const avatarInput = document.getElementById('cardAvatarUrl');
    if (avatarInput) {
        avatarInput.addEventListener('input', () => {
            updateCardAvatars();
        });
    }
}

// ========================================
// Avatar
// ========================================
function initAvatarField() {
    const avatarInput = document.getElementById('cardAvatarUrl');
    if (avatarInput && !avatarInput.value.trim()) {
        avatarInput.value = DEFAULT_AVATAR_URL;
    }
}

function getCardAvatarUrl() {
    const avatarInput = document.getElementById('cardAvatarUrl');
    return avatarInput ? avatarInput.value.trim() : '';
}

function buildAvatarImg(url, alt) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = alt;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.crossOrigin = 'anonymous';
    return img;
}

function setAvatarContent(container, content) {
    if (!container) return;

    container.innerHTML = '';
    container.style.padding = '0';

    if (typeof content === 'string') {
        container.innerHTML = content;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.display = 'block';
        }
        return;
    }

    container.appendChild(content);
}

async function loadRandomAvatar() {
    try {
        const seed = Math.random().toString(36).substring(2, 10);
        // DiceBear adventurer 风格：自带彩色背景，填满圆形，无跨域问题
        const bgColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a8edbb', 'f9c6e0'];
        const bg = bgColors[Math.floor(Math.random() * bgColors.length)];
        const res = await fetch(`https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}`);
        if (res.ok) {
            return await res.text();
        }
    } catch (err) {
        console.error('获取随机头像失败:', err);
    }
    return '';
}

async function updateCardAvatars() {
    const profileAvatarEl = document.getElementById('displayProfileAvatar');
    const xAvatarEl = document.getElementById('displayXAvatar');
    const avatarUrl = getCardAvatarUrl();

    if (avatarUrl) {
        setAvatarContent(profileAvatarEl, buildAvatarImg(avatarUrl, 'custom avatar'));
        setAvatarContent(xAvatarEl, buildAvatarImg(avatarUrl, 'custom avatar'));
        return;
    }

    const randomAvatar = await loadRandomAvatar();
    if (randomAvatar) {
        setAvatarContent(profileAvatarEl, randomAvatar);
        setAvatarContent(xAvatarEl, randomAvatar);
    }
}

// ========================================
// Generate
// ========================================
function generateCard() {
    const title = document.getElementById('cardTitle').value.trim();
    const content = document.getElementById('cardContent').value.trim();
    const author = document.getElementById('cardAuthor').value.trim();
    const subtitleField = document.getElementById('cardSubtitle');
    const subtitle = subtitleField ? subtitleField.value.trim() : '';

    if (!content) { toast('请输入正文内容', 'error'); document.getElementById('cardContent').focus(); return; }

    // 隐藏空态
    document.getElementById('emptyState').style.display = 'none';
    const wrapper = document.getElementById('cardWrapper');
    wrapper.style.display = 'flex';
    document.getElementById('previewActions').style.display = 'block';
    document.getElementById('serverActions').style.display = 'block';

    // 触发入场动画
    wrapper.style.animation = 'none';
    void wrapper.offsetHeight;
    wrapper.style.animation = '';

    // 主题
    const card = document.getElementById('shareCard');
    card.className = 'share-card theme-' + currentStyle;

    // ── 标题 ──
    const titleArea = document.getElementById('cardTitleArea');
    if (title && currentStyle !== 'notes') {
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
    if (currentStyle === 'notes' && title) {
        const titleSpan = document.createElement('span');
        titleSpan.className = 'note-title';
        titleSpan.textContent = title;
        contentArea.appendChild(titleSpan);
    }
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

    // ── 署名 / 社交Profile / X Profile ──
    const authorArea = document.getElementById('cardAuthorArea');
    const profileArea = document.getElementById('cardProfileArea');
    const xHeader = document.getElementById('cardXHeader');
    const xFooter = document.getElementById('xFooter');

    if (currentStyle === 'x') {
        // — X 模式：展示 X专属头部，隐藏其他
        if (author) {
            xHeader.style.display = '';
            document.getElementById('displayXName').textContent = author;
        } else {
            xHeader.style.display = 'none';
        }
        // 时间戳
        xFooter.style.display = '';
        if (document.getElementById('displayXTime')) {
            document.getElementById('displayXTime').textContent = formatXTime();
        }
        // 隐藏无关元素
        authorArea.style.display = 'none';
        if (profileArea) profileArea.style.display = 'none';
    } else if (currentStyle === 'notes') {
        if (xHeader) xHeader.style.display = 'none';
        if (xFooter) xFooter.style.display = 'none';
        authorArea.style.display = 'none';
        if (profileArea) {
            if (author) {
                profileArea.style.display = '';
                document.getElementById('displayProfileName').textContent = author;
            } else {
                profileArea.style.display = 'none';
            }

            const subEl = document.getElementById('displayProfileSub');
            if (subtitle) {
                subEl.textContent = subtitle;
                subEl.style.display = 'block';
            } else {
                subEl.style.display = 'none';
            }
        }
    } else {
        // — 非 X 模式：正常处理
        if (xHeader) xHeader.style.display = 'none';
        if (xFooter) xFooter.style.display = 'none';

        if (author) {
            authorArea.style.display = '';
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
    }

    // ── 计算尺寸 ──
    layoutCard(title, content, author);
}

// ========================================
// Smart Layout  — 文字少时高度自动收缩，文字多时守 3:4 比例
// ========================================
function layoutCard(title, content, author) {
    const card = document.getElementById('shareCard');
    const titleEl = document.getElementById('displayTitle');
    const contentEl = document.getElementById('displayContent');
    const bodyEl = card.querySelector('.card-body');

    // 可用宽度上限
    const previewW = document.getElementById('previewArea').clientWidth - 16;

    const len = content.length;

    // ── 基础卡片宽度 ──
    let w;
    if (len <= 30) w = 320;
    else if (len <= 80) w = 360;
    else if (len <= 150) w = 400;
    else if (len <= 300) w = 440;
    else if (len <= 500) w = 480;
    else w = 520;

    const maxW = previewW > 0 ? previewW : 360;
    if (w > maxW) w = maxW;

    // ── 正文字号：固定正常范围 ──
    let estimatedCfs = Math.floor(w * Math.sqrt(0.45 / (len || 1)));
    let cFs = Math.min(Math.max(estimatedCfs, 13), 15);

    // Social mode gets a much larger title natively (max 32px) versus other modes (max 18px)
    let tFsMulti = (currentStyle === 'social' || currentStyle === 'xiaohongshu') ? 2.0 : 1.15;
    let tFsMax = (currentStyle === 'social' || currentStyle === 'xiaohongshu') ? 32 : 18;
    let tFs = Math.min(Math.max(15, Math.floor(cFs * tFsMulti)), tFsMax);


    // ── 先用 auto 高度，让内容自然撑开 ──
    card.style.width = w + 'px';
    card.style.height = 'auto';
    titleEl.style.fontSize = tFs + 'px';
    contentEl.style.fontSize = cFs + 'px';
    contentEl.style.lineHeight = Math.round(cFs * 2.2) + 'px';
    contentEl.querySelectorAll('.empty-line').forEach(sp => sp.style.height = Math.round(cFs * 0.8) + 'px');

    // ── 布局稳定后，判断是否需要宽高比约束 ──
    requestAnimationFrame(() => {
        const naturalH = bodyEl.scrollHeight;

        card.style.height = naturalH + 'px';
        if (typeof drawTitleHighlight === 'function') drawTitleHighlight();
        if (typeof drawTextUnderlines === 'function') drawTextUnderlines();
    });
}

// ── 自适应溢出（仅文字多时触发）──
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

// ── 正文社交模式虚线绘制 ──
function drawTextUnderlines() {
    const contentArea = document.getElementById('displayContent');
    if (!contentArea) return;

    const oldSvg = document.getElementById('textUnderlinesSvg');
    if (oldSvg) oldSvg.remove();

    if (currentStyle !== 'social') return;

    // Temporarily halt animations and transforms to get unscaled CSS pixel measurements
    const wrapper = document.getElementById('cardWrapper');
    const oldAnim = wrapper.style.animation;
    const oldTrans = wrapper.style.transform;
    wrapper.style.animation = 'none';
    wrapper.style.transform = 'none';
    void wrapper.offsetHeight; // force reflow

    contentArea.style.position = 'relative';

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('id', 'textUnderlinesSvg');
    svg.setAttribute('xmlns', svgNs);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '0';

    const computedStyle = window.getComputedStyle(contentArea);
    const cFs = parseFloat(computedStyle.fontSize) || 15;

    const parentRect = contentArea.getBoundingClientRect();

    // Crucial: explicit SVG pixel dimension bounds to force html2canvas rasterization matches CSS 1:1
    svg.setAttribute('width', parentRect.width);
    svg.setAttribute('height', parentRect.height);
    svg.setAttribute('viewBox', `0 0 ${parentRect.width} ${parentRect.height}`);

    const spans = contentArea.querySelectorAll('span');

    let visualLines = [];

    spans.forEach(span => {
        const rects = span.getClientRects();
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (r.width === 0 || r.height === 0) continue;

            const relativeTop = r.top - parentRect.top;
            const midY = relativeTop + r.height / 2;

            let placed = false;
            for (let j = 0; j < visualLines.length; j++) {
                const vLine = visualLines[j];
                // Group rects on the same line (midY within 0.6em)
                if (Math.abs(vLine.midY - midY) < cFs * 0.6) {
                    vLine.left = Math.min(vLine.left, r.left);
                    vLine.right = Math.max(vLine.right, r.right);
                    // Update rolling average for midY
                    vLine.midY = (vLine.midY * vLine.count + midY) / (vLine.count + 1);
                    vLine.count++;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                visualLines.push({
                    midY: midY,
                    left: r.left,
                    right: r.right,
                    count: 1
                });
            }
        }
    });

    visualLines.forEach(lineData => {
        // Only draw lines if we have width
        if (lineData.right <= lineData.left) return;

        const line = document.createElementNS(svgNs, 'line');
        const x1 = lineData.left - parentRect.left;
        const x2 = lineData.right - parentRect.left;

        // MidY is the invariant visual center of the text bounding box.
        // Adding ~0.70 times font size places the underline with a slight, comfortable gap beneath the text,
        // ignoring any irregular descenders or line-height bounding box inflation. 
        // This makes it immune to empty line height shifting offsets.
        let y = lineData.midY + cFs * 0.70;

        line.setAttribute('x1', x1);
        line.setAttribute('x2', x2);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(0,0,0,0.28)');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '8,4');
        line.setAttribute('stroke-linecap', 'square');

        svg.appendChild(line);
    });

    contentArea.insertBefore(svg, contentArea.firstChild);

    // Restore transforms
    wrapper.style.animation = oldAnim;
    wrapper.style.transform = oldTrans;
}

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
        onclone: (clonedDoc) => {
            const lines = clonedDoc.querySelectorAll('#textUnderlinesSvg line');
            const contentEl = clonedDoc.getElementById('displayContent');
            if (contentEl && lines.length > 0) {
                const cFs = parseFloat(window.getComputedStyle(contentEl).fontSize) || 15;
                // Shift down ~0.15em for exported image to natively fight html2canvas's own text baseline drop
                lines.forEach(l => {
                    const y = parseFloat(l.getAttribute('y1'));
                    l.setAttribute('y1', y + cFs * 0.15);
                    l.setAttribute('y2', y + cFs * 0.15);
                });
            }
        }
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
        onclone: (clonedDoc) => {
            const lines = clonedDoc.querySelectorAll('#textUnderlinesSvg line');
            const contentEl = clonedDoc.getElementById('displayContent');
            if (contentEl && lines.length > 0) {
                const cFs = parseFloat(window.getComputedStyle(contentEl).fontSize) || 15;
                // Shift down ~0.15em
                lines.forEach(l => {
                    const y = parseFloat(l.getAttribute('y1'));
                    l.setAttribute('y1', y + cFs * 0.15);
                    l.setAttribute('y2', y + cFs * 0.15);
                });
            }
        }
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
// ========================================
// X Time Formatter
// ========================================
function formatXTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? '\u4e0b\u5348' : '\u4e0a\u5348';
    const hour12 = h % 12 || 12;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${ampm} ${hour12}:${m} \u00b7 ${year}\u5e74${month}\u6708${day}\u65e5`;
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
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 10 11 15 8 12"/></svg>',
    };
    el.innerHTML = (icons[type] || '') + msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2400);
}

// ========================================
// Save to Server (文字入库)
// ========================================
function buildRichTextContent(content) {
    const normalized = content.replace(/\r\n/g, '\n');

    return normalized
        .split('\n')
        .map(line => {
            const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            return `<p>${escapedLine || '<br>'}</p>`;
        })
        .join('');
}

function saveToServer() {
    const title = document.getElementById('cardTitle').value.trim();
    const content = document.getElementById('cardContent').value.trim();

    if (!content) {
        toast('正文不能为空', 'error');
        return;
    }

    const btn = document.getElementById('saveToServerBtn');
    btn.disabled = true;
    btn.textContent = '提交中…';

    const richContent = buildRichTextContent(content);

    fetch('http://192.168.2.3:9991/api/duanzi', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-API-Key': 'f4Kx8QmW2rNv6TjP9yLs',
        },
        body: new URLSearchParams({
            id: '0',
            title: title,
            content: richContent,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                toast(data.msg || '操作成功', 'success');
            } else {
                toast(data.msg || '操作失败', 'error');
            }
        })
        .catch(err => {
            console.error('入库请求失败:', err);
            toast('请求失败：' + err.message, 'error');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3" ry="3"/></svg> 文字入库';
        });
}
