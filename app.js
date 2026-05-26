/* ===========================================
   拍摄特效包 PE · V0.5 / V1.0 Demo Interactivity
   =========================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* =====================================================================
   V0.5 · 极速版 (Dual route: A=upload reference, B=manual STK ID)
   ===================================================================== */

let v05Route = 'A'; // active route
let v05HasUpload = true;

// Route switch tabs
$$('.route-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.route-tab').forEach(t => t.classList.remove('route-tab--active'));
    tab.classList.add('route-tab--active');
    v05Route = tab.dataset.route;
    $$('.route-pane').forEach(p => p.classList.remove('route-pane--active'));
    $(`.route-pane[data-pane="${v05Route}"]`).classList.add('route-pane--active');
  });
});

// Upload simulation
const uploadBox = $('#v05Upload');
uploadBox?.addEventListener('click', () => {
  v05HasUpload = true;
  uploadBox.style.borderColor = 'var(--ok)';
  uploadBox.querySelector('.upload__hint').innerHTML = '✅ 已重新上传 <b>reference_clip.mp4</b>';
  setTimeout(() => { uploadBox.style.borderColor = ''; }, 1500);
});

// AI auto toggle for FLT / MUA
$$('.ai-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = $(`#${targetId}`);
    if (!input) return;
    const isOn = btn.classList.toggle('ai-toggle--on');
    if (isOn) {
      input.dataset.prevValue = input.value;
      input.value = '';
      input.placeholder = '🤖 AI 将自动匹配最优 ' + (targetId === 'fltId' ? '滤镜' : '妆容');
      input.classList.add('id-input--auto');
      input.disabled = true;
      btn.textContent = '✓ AI 接管';
      hideDropdown(input);
    } else {
      input.value = input.dataset.prevValue || '';
      input.placeholder = '留空则由 AI 自动匹配';
      input.classList.remove('id-input--auto');
      input.disabled = false;
      btn.textContent = '🤖 AI 自动';
    }
  });
});

/* ============ Fuzzy Name Search (STK / FLT / MUA) ============ */

const ASSET_CATALOG = {
  STK: [
    { id: 'STK_2034_sparkle',    name: '闪耀星光', tags: ['星光','闪耀','sparkle','光','闪'], emoji: '✨', bg: ['#fff5cf','#ffe1a8'] },
    { id: 'STK_2035_petals',     name: '樱花花瓣', tags: ['樱花','花瓣','petal','sakura','花','少女'], emoji: '🌸', bg: ['#ffd6e8','#ffe5cf'] },
    { id: 'STK_2036_neon',       name: '霓虹光斑', tags: ['霓虹','赛博','neon','光斑','潮'], emoji: '🔆', bg: ['#3b1a5e','#0a1f4a'] },
    { id: 'STK_2037_heart',      name: '飘心爱心', tags: ['爱心','心','heart','少女','浪漫'], emoji: '💗', bg: ['#ffd1dc','#ffb3c1'] },
    { id: 'STK_2038_starry',     name: '梦幻星空', tags: ['星空','星','starry','夜','梦幻'], emoji: '🌟', bg: ['#1a1f3a','#0a0e2a'] },
    { id: 'STK_2039_butterfly',  name: '蝶舞翩跹', tags: ['蝴蝶','蝶','butterfly','飞舞'], emoji: '🦋', bg: ['#c5e8ff','#dac6ff'] },
    { id: 'STK_2040_glitter',    name: '碎钻闪粉', tags: ['碎钻','闪粉','glitter','钻','闪耀'], emoji: '💎', bg: ['#e0f7ff','#ffe5ff'] },
    { id: 'STK_2041_flame',      name: '炽热火焰', tags: ['火焰','火','flame','燃','热'], emoji: '🔥', bg: ['#ffb88c','#ff5e3a'] },
  ],
  FLT: [
    { id: 'FLT_dusk_warm',     name: '暮光柔暖',   tags: ['暮光','柔暖','dusk','黄昏','暖'], emoji: '🌅', bg: ['#ffb88c','#ff7c5e'] },
    { id: 'FLT_neon',          name: '霓虹赛博',   tags: ['霓虹','赛博','neon','潮','酷'], emoji: '🌃', bg: ['#a86bff','#ff5cd5'] },
    { id: 'FLT_cool_mist',     name: '清冷薄雾',   tags: ['清冷','薄雾','cool','雾','冷'], emoji: '🌫', bg: ['#9ad6ff','#c5b3ff'] },
    { id: 'FLT_film_vintage',  name: '复古胶片',   tags: ['胶片','复古','film','vintage','怀旧'], emoji: '📽', bg: ['#e6d3a3','#a08056'] },
    { id: 'FLT_fresh_natural', name: '清新自然',   tags: ['清新','自然','fresh','日常','vlog'], emoji: '🌿', bg: ['#d8f3dc','#b7e4c7'] },
    { id: 'FLT_dreamy_pink',   name: '梦幻粉',     tags: ['梦幻','粉','dreamy','少女','柔'], emoji: '🌸', bg: ['#ffd6e8','#fff0f5'] },
  ],
  MUA: [
    { id: 'MUA_softgloss_v3',   name: '软光裸妆',   tags: ['软光','裸妆','softgloss','自然','日常'], emoji: '💄', bg: ['#ffe4d6','#ffd0c2'] },
    { id: 'MUA_peach_blush',    name: '蜜桃腮红',   tags: ['蜜桃','腮红','peach','blush','可爱'], emoji: '🍑', bg: ['#ffd6c2','#ffb3a3'] },
    { id: 'MUA_smoky_eye',      name: '烟熏眼妆',   tags: ['烟熏','眼妆','smoky','酷','深邃'], emoji: '🖤', bg: ['#3a3a4a','#1a1a2a'] },
    { id: 'MUA_crystal_glow',   name: '水光透亮',   tags: ['水光','透亮','crystal','glow','闪'], emoji: '💎', bg: ['#e0f7ff','#c5e8ff'] },
    { id: 'MUA_korean_pure',    name: '韩系清纯',   tags: ['韩系','清纯','korean','纯','软'], emoji: '🌷', bg: ['#ffe0eb','#fff5f5'] },
    { id: 'MUA_red_lip_classic',name: '经典红唇',   tags: ['红唇','经典','red','复古','气场'], emoji: '💋', bg: ['#ff8d8d','#d63b3b'] },
  ],
};

// Detect if input looks like a precise ID (e.g. STK_xxx, FLT_xxx, MUA_xxx)
function looksLikeId(value) {
  return /^(STK|FLT|MUA)_[A-Za-z0-9_]+$/i.test(value.trim());
}

// Simple fuzzy scoring: substring match in id/name/tags (case-insensitive)
function fuzzyScore(item, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let score = 0;
  if (item.name.toLowerCase().includes(q)) score += 60;
  if (item.id.toLowerCase().includes(q)) score += 30;
  for (const tag of item.tags) {
    const t = tag.toLowerCase();
    if (t === q) score += 50;
    else if (t.includes(q) || q.includes(t)) score += 20;
  }
  // Char-level partial match for Chinese (each char individually)
  for (const ch of q) {
    if (item.name.toLowerCase().includes(ch)) score += 4;
    for (const tag of item.tags) {
      if (tag.toLowerCase().includes(ch)) score += 2;
    }
  }
  return score;
}

function searchAssets(kind, query) {
  const list = ASSET_CATALOG[kind] || [];
  return list
    .map(item => ({ item, score: fuzzyScore(item, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function hideDropdown(input) {
  const group = input.closest('.id-group');
  if (!group) return;
  const dd = group.querySelector('.search-dropdown');
  if (dd) dd.remove();
}

function renderDropdown(input, kind, query) {
  const group = input.closest('.id-group');
  if (!group) return;
  hideDropdown(input);

  const results = searchAssets(kind, query);
  const dd = document.createElement('div');
  dd.className = 'search-dropdown';

  if (!results.length) {
    dd.innerHTML = `
      <div class="search-dropdown__head">🔍 名称模糊匹配 · 输入：<b>${escapeHtmlSafe(query)}</b></div>
      <div class="search-empty">没有匹配的素材，可换个关键词试试 · 例如<b>「樱花」「星空」「霓虹」</b></div>
    `;
  } else {
    const maxScore = results[0].score;
    let itemsHtml = '';
    results.forEach(({ item, score }, idx) => {
      const isTop = idx === 0;
      const matchPct = Math.min(99, Math.round(score / maxScore * 96 + 3));
      itemsHtml += `
        <div class="search-item ${isTop ? 'search-item--top' : ''}" data-pickid="${item.id}">
          <div class="search-item__thumb" style="background: linear-gradient(160deg, ${item.bg[0]}, ${item.bg[1]});">${item.emoji}</div>
          <div class="search-item__body">
            <div class="search-item__name">${highlight(item.name, query)} ${isTop ? '<span style="font-size:10px;color:var(--ok);font-weight:700;">· TOP</span>' : ''}</div>
            <div class="search-item__id">${item.id}</div>
          </div>
          <div class="search-item__score">${matchPct}%</div>
        </div>
      `;
    });
    dd.innerHTML = `
      <div class="search-dropdown__head">🔍 名称模糊匹配 · Top ${results.length} 候选 · 输入：<b>${escapeHtmlSafe(query)}</b></div>
      ${itemsHtml}
    `;
  }

  // Click handler: pick item
  dd.querySelectorAll('.search-item').forEach(el => {
    el.addEventListener('click', () => {
      const pickedId = el.dataset.pickid;
      input.value = pickedId;
      input.classList.add('id-input--matched');
      hideDropdown(input);
      setTimeout(() => input.classList.remove('id-input--matched'), 1200);
    });
  });

  group.appendChild(dd);
}

function escapeHtmlSafe(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function highlight(text, query) {
  const safe = escapeHtmlSafe(text);
  if (!query) return safe;
  const q = escapeHtmlSafe(query.trim());
  if (!q) return safe;
  // Highlight any contained char
  let out = safe;
  for (const ch of q) {
    if (!ch.trim()) continue;
    const re = new RegExp(escapeRegExp(ch), 'gi');
    out = out.replace(re, m => `<span style="color:var(--v05-1);font-weight:800;">${m}</span>`);
  }
  return out;
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Bind search behavior to STK / FLT / MUA inputs
function bindSearchInput(inputId, kind) {
  const input = $(`#${inputId}`);
  if (!input) return;
  const handler = () => {
    if (input.disabled) return; // AI-controlled
    const v = input.value.trim();
    if (!v) { hideDropdown(input); return; }
    if (looksLikeId(v)) { hideDropdown(input); return; } // Precise ID, no dropdown
    renderDropdown(input, kind, v);
  };
  input.addEventListener('input', handler);
  input.addEventListener('focus', handler);
  input.addEventListener('blur', () => {
    // Delay hide to allow click to register
    setTimeout(() => hideDropdown(input), 180);
  });
}
bindSearchInput('stkId', 'STK');
bindSearchInput('fltId', 'FLT');
bindSearchInput('muaId', 'MUA');

// Filter + sticker assets
const FILTER_COLORS = {
  'FLT_dusk_warm':   ['#ffb88c', '#ff7c5e'],
  'FLT_neon':        ['#a86bff', '#ff5cd5'],
  'FLT_cool_mist':   ['#9ad6ff', '#c5b3ff'],
  'FLT_film_vintage':['#e6d3a3', '#a08056'],
  'FLT_AI_auto':     ['#b1e0ff', '#ffc8e1'],
};
const STK_EMOJI = {
  'STK_2034_sparkle': ['✨', '💫', '⭐'],
  'STK_2035_petals':  ['🌸', '🌸', '🌺'],
  'STK_2036_neon':    ['🔆', '💎', '🟣'],
  'STK_2037_heart':   ['💗', '💕', '💖'],
};
const REF_AUTO_STK = ['🌸', '✨', '💫']; // AI识别后默认贴纸视觉

const v05Run = $('#v05Run');
const v05Log = $('#v05Log');
const v05Screen = $('#v05Screen');
const v05Caption = $('#v05Caption');
const v05Export = $('#v05Export');

function logLine(target, text, cls = '') {
  const div = document.createElement('div');
  div.className = `log__line ${cls}`;
  div.textContent = text;
  target.appendChild(div);
  target.scrollTop = target.scrollHeight;
}

async function runV05() {
  if (v05Route === 'A' && !v05HasUpload) {
    alert('请先上传参考素材');
    return;
  }
  v05Run.disabled = true;
  v05Run.innerHTML = '⏳ 正在解析...';

  v05Log.innerHTML = '';
  v05Screen.innerHTML = '<div class="preview__placeholder">解析中...</div>';
  v05Caption.textContent = '— 处理中 —';
  v05Export.innerHTML = '<div class="export__placeholder">运行后将生成剪映特效资源包</div>';

  let stkInfo, stkVisual;
  let fltInput = $('#fltId').value.trim();
  let muaInput = $('#muaId').value.trim();
  const fltAuto = $('#fltId').classList.contains('id-input--auto') || !fltInput;
  const muaAuto = $('#muaId').classList.contains('id-input--auto') || !muaInput;

  if (fltAuto) fltInput = 'FLT_AI_auto';
  if (muaAuto) muaInput = 'MUA_AI_auto';

  const ts = new Date().toISOString().substring(11, 19);

  logLine(v05Log, `[${ts}] ▶ 启动硬指令复刻引擎 v0.5.3`, 'log__line--info');
  await sleep(350);

  if (v05Route === 'A') {
    logLine(v05Log, `[${ts}] ✓ 加载参考素材 reference_clip.mp4 (00:12, 1080×1920)`, 'log__line--ok');
    await sleep(350);
    logLine(v05Log, `[${ts}] 🔍 AI 识别参考素材中的贴纸效果...`, 'log__line--info');
    await sleep(550);
    logLine(v05Log, `[${ts}]   ✓ 检出 3 个贴纸图层 + 位置 + 动效曲线`, 'log__line--ok');
    stkInfo = '路线 A · 参考素材识别';
    stkVisual = REF_AUTO_STK;
  } else {
    const stk = $('#stkId').value.trim() || 'STK_2034_sparkle';
    logLine(v05Log, `[${ts}] → 解析手动指定贴纸 ID: ${stk}`);
    await sleep(400);
    logLine(v05Log, `[${ts}]   ✓ 命中资源库，加载 3 个贴纸资产`, 'log__line--ok');
    stkInfo = stk;
    stkVisual = STK_EMOJI[stk] || ['✨', '💫', '⭐'];
  }
  await sleep(300);

  if (fltAuto) {
    logLine(v05Log, `[${ts}] 🤖 AI 自动匹配滤镜...`, 'log__line--info');
    await sleep(450);
    logLine(v05Log, `[${ts}]   ✓ 推荐 FLT_AI_auto (基于场景 + 主色调分析)`, 'log__line--ok');
  } else {
    logLine(v05Log, `[${ts}] → 应用滤镜 ID: ${fltInput}`);
    await sleep(280);
    logLine(v05Log, `[${ts}]   ✓ 应用 LUT 表 + 强度 0.85`, 'log__line--ok');
  }
  await sleep(250);

  if (muaAuto) {
    logLine(v05Log, `[${ts}] 🤖 AI 自动匹配妆容...`, 'log__line--info');
    await sleep(450);
    logLine(v05Log, `[${ts}]   ✓ 推荐 MUA_AI_auto (基于人脸特征 + 主题匹配)`, 'log__line--ok');
  } else {
    logLine(v05Log, `[${ts}] → 应用妆容 ID: ${muaInput}`);
    await sleep(280);
    logLine(v05Log, `[${ts}]   ✓ 应用妆容图层`, 'log__line--ok');
  }
  await sleep(350);
  logLine(v05Log, `[${ts}] ⚙ 渲染合成中...`, 'log__line--warn');
  await sleep(550);

  const colors = FILTER_COLORS[fltInput] || FILTER_COLORS['FLT_dusk_warm'];
  v05Screen.innerHTML = `
    <div class="scene" style="background: radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]});">
      <div class="scene__face"></div>
      <div class="scene__filter-overlay" style="background: linear-gradient(160deg, ${colors[0]}55, ${colors[1]}55);"></div>
      <div class="scene__sticker" style="top: 30%; left: 22%;">${stkVisual[0]}</div>
      <div class="scene__sticker" style="top: 26%; right: 22%; animation-delay: .15s;">${stkVisual[1]}</div>
      <div class="scene__sticker" style="top: 70%; left: 50%; transform: translateX(-50%); animation-delay: .3s;">${stkVisual[2]}</div>
      <div class="scene__label">${v05Route === 'A' ? 'AI 识别' : '手动 ID'} · ${fltAuto ? 'AI 滤镜' : fltInput.split('_').slice(-1)[0]}</div>
    </div>
  `;
  v05Caption.textContent = `${stkInfo} · ${fltAuto ? 'AI 滤镜' : fltInput} · ${muaAuto ? 'AI 妆容' : muaInput}`;

  logLine(v05Log, `[${ts}] ✓ 渲染完成 · 用时 1.8s`, 'log__line--ok');
  await sleep(250);
  logLine(v05Log, `[${ts}] 📦 打包剪映特效资源包...`, 'log__line--info');
  await sleep(400);
  logLine(v05Log, `[${ts}] ✓ 完成 ✓ 准备就绪`, 'log__line--ok');

  v05Export.innerHTML = `
    <div class="export__pkg">
      <div class="export__head">
        <div class="export__icon">📦</div>
        <div>
          <div class="export__name">effect_pkg_${Date.now().toString().slice(-6)}.jianying</div>
          <div class="export__size">2.4 MB · 标准剪映特效包</div>
        </div>
      </div>
      <ul class="export__items">
        <li><span>STK</span><b>${stkInfo}</b></li>
        <li><span>FLT</span><b>${fltAuto ? '🤖 AI 自动匹配' : fltInput}</b></li>
        <li><span>MUA</span><b>${muaAuto ? '🤖 AI 自动匹配' : muaInput}</b></li>
      </ul>
      <button class="btn btn--export">⬆ 一键上传至 Vimo</button>
    </div>
  `;

  v05Run.disabled = false;
  v05Run.innerHTML = '⚡ 一键复刻';
}

v05Run?.addEventListener('click', runV05);

/* =====================================================================
   V1.0 · 标准版  ·  对话式 AI BOT
   ===================================================================== */

const chat = $('#chat');
const chatInput = $('#chatInput');
const chatSend = $('#chatSend');
const quickReplies = $('#quickReplies');
const specCard = $('#specCard');
const specBody = $('#specBody');
const v10Reset = $('#v10Reset');

// Conversation state
let convStep = 0;
let convData = {};
let waitingForBot = false;

// Conversation script - flexible: BOT collects intent, theme, scene, style, audience
const CONV_FLOW = [
  {
    // Step 0: greeting
    bot: `你好 👋 我是 <b>特效 AI BOT</b>，可以帮你生产拍摄特效包。<br/>请用一句话告诉我你想做什么样的特效？比如「想要一个少女风的脸部贴纸」「希望视频背景有点科技感」。`,
    quickReplies: [
      '想做一个温柔少女风的特效',
      '需要节日氛围感的贴纸',
      '想要赛博朋克风格',
      '帮我做一个清新自然的滤镜',
    ],
    extract: (input) => { convData.intent = input; }
  },
  {
    // Step 1: ask theme refinement
    bot: (d) => `了解到你的方向是「<b>${d.intent}</b>」。<br/>能再具体说说<b>视觉主题</b>吗？比如花卉、星空、霓虹、心形、丝带等元素，会更帮助我聚焦。`,
    quickReplies: ['樱花/花瓣', '星空/星光', '霓虹/赛博', '心形/爱心', '不太确定，帮我推荐'],
    extract: (input) => { convData.theme = input; }
  },
  {
    // Step 2: ask use scene
    bot: (d) => `好的，主题方向是「<b>${d.theme}</b>」。<br/>这个特效主要用在什么<b>使用场景</b>？例如日常 vlog、节日活动、品牌宣传、剧情短片等。`,
    quickReplies: ['日常 vlog 自拍', '节日 / 派对', '品牌种草视频', '剧情短片'],
    extract: (input) => { convData.scene = input; }
  },
  {
    // Step 3: ask style
    bot: (d) => `明白，使用场景是「<b>${d.scene}</b>」。<br/>最后一个问题：你期望的<b>整体风格调性</b>偏哪种？柔和梦幻 / 高对比鲜艳 / 水彩手绘 / 3D 立体 / 极简？`,
    quickReplies: ['柔和梦幻', '高对比鲜艳', '水彩手绘', '3D 立体', '极简'],
    extract: (input) => { convData.style = input; }
  },
  {
    // Step 4: confirm summary + decide AI vs Library
    bot: (d) => {
      // Decision logic: if theme matches a common library category, use library; otherwise AI generate
      const useLibrary = ['樱花/花瓣', '心形/爱心'].includes(d.theme);
      d.production = useLibrary ? 'mixed' : 'ai_dominant';
      d.position = inferPosition(d.theme, d.scene);
      return `太好了，我已经收集到所有关键信息 ✨<br/>结合你给出的方向，我决定采用「<b>${useLibrary ? '素材库匹配 + AI 微调' : 'AI 原创生成 + 1 套素材库参考'}</b>」的策略，下方将产出 <b>3 套候选</b>，请确认后开始生产 👇`;
    },
    quickReplies: [],
    extract: () => {},
    final: true
  }
];

function inferPosition(theme, scene) {
  if (scene && scene.includes('vlog')) return '脸颊两侧';
  if (theme && (theme.includes('星空') || theme.includes('霓虹'))) return '环绕全脸';
  if (theme && theme.includes('心形')) return '额头上方';
  return '额头上方';
}

function appendMsg(role, html) {
  const msg = document.createElement('div');
  msg.className = `msg msg--${role}`;
  msg.innerHTML = `
    <div class="msg__avatar">${role === 'bot' ? '✨' : '🙋'}</div>
    <div class="msg__bubble">${html}</div>
  `;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const msg = document.createElement('div');
  msg.className = 'msg msg--bot';
  msg.id = 'typingMsg';
  msg.innerHTML = `
    <div class="msg__avatar">✨</div>
    <div class="msg__bubble"><div class="msg__typing"><span></span><span></span><span></span></div></div>
  `;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}
function hideTyping() {
  const t = $('#typingMsg');
  if (t) t.remove();
}

function renderQuickReplies(items) {
  quickReplies.innerHTML = '';
  if (!items || !items.length) return;
  items.forEach(text => {
    const chip = document.createElement('button');
    chip.className = 'qr-chip';
    chip.textContent = text;
    chip.addEventListener('click', () => handleUserInput(text));
    quickReplies.appendChild(chip);
  });
}

async function botRespond() {
  if (convStep >= CONV_FLOW.length) return;
  waitingForBot = true;
  chatInput.disabled = true;
  chatSend.disabled = true;
  renderQuickReplies([]);

  showTyping();
  await sleep(900 + Math.random() * 400);
  hideTyping();

  const step = CONV_FLOW[convStep];
  const botText = typeof step.bot === 'function' ? step.bot(convData) : step.bot;
  appendMsg('bot', botText);
  renderQuickReplies(step.quickReplies);

  if (step.final) {
    showSpecCard();
    chatInput.disabled = true;
    chatSend.disabled = true;
  } else {
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
  waitingForBot = false;
}

function handleUserInput(text) {
  if (waitingForBot) return;
  const value = (text || '').trim();
  if (!value) return;

  appendMsg('user', escapeHtml(value));
  chatInput.value = '';

  // Save user input into convData
  const step = CONV_FLOW[convStep];
  step.extract(value);

  convStep++;
  if (convStep < CONV_FLOW.length) {
    botRespond();
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function showSpecCard() {
  const d = convData;
  specBody.innerHTML = `
    <div class="spec-card__row"><b>初始需求</b><span>${escapeHtml(d.intent || '')}</span></div>
    <div class="spec-card__row"><b>视觉主题</b><span>${escapeHtml(d.theme || '')}</span></div>
    <div class="spec-card__row"><b>使用场景</b><span>${escapeHtml(d.scene || '')}</span></div>
    <div class="spec-card__row"><b>风格调性</b><span>${escapeHtml(d.style || '')}</span></div>
    <div class="spec-card__row"><b>推荐位置</b><span>${escapeHtml(d.position || '')}</span></div>
    <div class="spec-card__row"><b>生产策略</b><span>${d.production === 'mixed' ? '🎨 素材库匹配 + AI 微调' : '🤖 AI 原创生成 + 素材库参考'}</span></div>
  `;
  specCard.hidden = false;
}

// Send button + Enter key
chatSend?.addEventListener('click', () => handleUserInput(chatInput.value));
chatInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleUserInput(chatInput.value);
});

// Reset button
v10Reset?.addEventListener('click', () => {
  convStep = 0;
  convData = {};
  chat.innerHTML = '';
  specCard.hidden = true;
  chatInput.disabled = false;
  chatSend.disabled = false;
  candidates.innerHTML = `
    <div class="cand cand--placeholder">
      <div class="cand__icon">💬</div>
      <div>请先与 BOT 完成对话<br/>系统将自动产出 3 套候选</div>
    </div>
  `;
  v10Screen.innerHTML = '<div class="preview__placeholder">请选择一套候选查看效果</div>';
  v10Caption.textContent = '— 尚未选择 —';
  v10Export.innerHTML = '<div class="export__placeholder">选择候选后可导出至 Vimo 平台</div>';
  startConversation();
});

function startConversation() {
  // Kick off the BOT greeting on page load
  setTimeout(() => botRespond(), 350);
}

/* ============ Candidate generation (V1.0) ============ */

const THEME_VIS = {
  '樱花/花瓣':  { bg: ['#ffd6e8', '#ffe5cf'], stickers: ['🌸','🌸','🌺','🌷'], color: '#d63b7a' },
  '星空/星光':  { bg: ['#1a1f3a', '#0a0e2a'], stickers: ['⭐','🌟','✨','🌙'], color: '#e8e0ff' },
  '霓虹/赛博':  { bg: ['#3b1a5e', '#0a1f4a'], stickers: ['💫','✨','⚡','🔆'], color: '#fff' },
  '心形/爱心':  { bg: ['#ffd1dc', '#ffb3c1'], stickers: ['💗','💕','💖','💝'], color: '#d63b7a' },
  '不太确定，帮我推荐': { bg: ['#dac6ff', '#ffd6e8'], stickers: ['✨','🌸','💫','⭐'], color: '#a86bff' },
};

const STYLE_VARIANT = {
  '柔和梦幻':   { blur: 'opacity:0.55;' },
  '高对比鲜艳': { blur: 'opacity:1; filter:contrast(1.15) saturate(1.3);' },
  '水彩手绘':   { blur: 'opacity:0.7; filter: blur(0.3px) brightness(1.05);' },
  '3D 立体':    { blur: 'opacity:0.9; filter:contrast(1.1);' },
  '极简':       { blur: 'opacity:0.4;' },
};

const POS_LAYOUT = {
  '脸颊两侧':   [{ top: '52%', left: '15%' }, { top: '52%', right: '15%' }, { top: '60%', left: '50%', transform: 'translateX(-50%)' }],
  '额头上方':   [{ top: '20%', left: '30%' }, { top: '15%', right: '30%' }, { top: '25%', left: '50%', transform: 'translateX(-50%)' }],
  '环绕全脸':   [{ top: '20%', left: '15%' }, { top: '50%', right: '8%' }, { bottom: '20%', left: '20%' }, { top: '50%', left: '8%' }],
  '背景':      [{ top: '8%', left: '8%' }, { top: '8%', right: '8%' }, { bottom: '15%', left: '12%' }, { bottom: '25%', right: '10%' }],
};

const v10Run = $('#v10Run');
const candidates = $('#candidates');
const v10Screen = $('#v10Screen');
const v10Caption = $('#v10Caption');
const v10Export = $('#v10Export');

let currentCandidate = null;

async function runV10() {
  v10Run.disabled = true;
  v10Run.innerHTML = '🤖 AI 生产中...';
  candidates.innerHTML = `
    <div class="cand cand--placeholder">
      <div class="cand__icon">⏳</div>
      <div>调用扩散模型 + 素材库...<br/>预计 2 秒</div>
    </div>
  `;
  v10Screen.innerHTML = '<div class="preview__placeholder">候选生成中...</div>';
  v10Caption.textContent = '— 等待选择 —';
  v10Export.innerHTML = '<div class="export__placeholder">选择候选后可导出至 Vimo 平台</div>';

  await sleep(1700);

  // Build 3 candidates with sources based on production strategy
  const isMixed = convData.production === 'mixed';
  const candList = isMixed ? [
    { id: 'A', subtitle: '素材库精选', score: 95, source: 'lib', variantHue: 0 },
    { id: 'B', subtitle: 'AI 微调变体', score: 92, source: 'ai', variantHue: 25 },
    { id: 'C', subtitle: '素材库变体', score: 88, source: 'lib', variantHue: -20 },
  ] : [
    { id: 'A', subtitle: 'AI 原创主推', score: 94, source: 'ai', variantHue: 0 },
    { id: 'B', subtitle: 'AI 风格迁移', score: 90, source: 'ai', variantHue: 30 },
    { id: 'C', subtitle: '素材库参考', score: 85, source: 'lib', variantHue: -25 },
  ];

  candidates.innerHTML = '';
  candList.forEach((c, i) => {
    const theme = THEME_VIS[convData.theme] || THEME_VIS['不太确定，帮我推荐'];
    const stickerSample = theme.stickers[i] || theme.stickers[0];
    const sourceLabel = c.source === 'ai' ? 'AI 生成' : '素材库';
    const sourceClass = c.source === 'ai' ? 'cand__source--ai' : 'cand__source--lib';
    const cand = document.createElement('div');
    cand.className = 'cand';
    cand.dataset.cid = c.id;
    cand.innerHTML = `
      <div class="cand__thumb" style="background: linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]}); filter: hue-rotate(${c.variantHue}deg);">
        ${stickerSample}
      </div>
      <div class="cand__body">
        <div class="cand__title">候选 ${c.id} · ${c.subtitle}<span class="cand__source ${sourceClass}">${sourceLabel}</span></div>
        <div class="cand__meta">${convData.theme || ''} · ${convData.style || ''} · 匹配度 ${c.score}%</div>
      </div>
      ${i === 0 ? '<div class="cand__badge">推荐</div>' : ''}
    `;
    cand.addEventListener('click', () => selectCandidate(c, theme));
    candidates.appendChild(cand);
  });

  v10Run.disabled = false;
  v10Run.innerHTML = '🔄 重新生产';

  setTimeout(() => {
    const first = candidates.querySelector('.cand');
    if (first) first.click();
  }, 200);
}

function selectCandidate(c, theme) {
  $$('.cand', candidates).forEach(el => el.classList.remove('cand--active'));
  const target = candidates.querySelector(`[data-cid="${c.id}"]`);
  target?.classList.add('cand--active');
  currentCandidate = c;

  const styleVar = STYLE_VARIANT[convData.style] || STYLE_VARIANT['柔和梦幻'];
  const positions = POS_LAYOUT[convData.position] || POS_LAYOUT['额头上方'];
  const stickers = theme.stickers;

  let stickerHTML = '';
  positions.forEach((pos, idx) => {
    const styleStr = Object.entries(pos).map(([k,v]) => `${k.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}`).join(';');
    stickerHTML += `<div class="scene__sticker" style="${styleStr}; animation-delay: ${idx * 0.12}s; filter: hue-rotate(${c.variantHue}deg);">${stickers[idx % stickers.length]}</div>`;
  });

  v10Screen.innerHTML = `
    <div class="scene" style="background: radial-gradient(circle at 30% 30%, ${theme.bg[0]}, ${theme.bg[1]}); filter: hue-rotate(${c.variantHue}deg);">
      <div class="scene__face"></div>
      <div class="scene__filter-overlay" style="${styleVar.blur} background: linear-gradient(160deg, ${theme.bg[0]}66, ${theme.bg[1]}66);"></div>
      ${stickerHTML}
      <div class="scene__label">候选 ${c.id} · ${c.source === 'ai' ? 'AI 生成' : '素材库'}</div>
    </div>
  `;
  v10Caption.textContent = `候选 ${c.id} · ${convData.theme} · ${convData.position} · ${convData.style}`;

  v10Export.innerHTML = `
    <div class="export__pkg export--v10">
      <div class="export__head">
        <div class="export__icon">📦</div>
        <div>
          <div class="export__name">ai_effect_${c.id}_${Date.now().toString().slice(-5)}.jianying</div>
          <div class="export__size">3.1 MB · ${c.source === 'ai' ? 'AI 原创' : '素材库匹配'} · 标准特效包</div>
        </div>
      </div>
      <ul class="export__items">
        <li><span>主题</span><b>${convData.theme}</b></li>
        <li><span>场景</span><b>${convData.scene}</b></li>
        <li><span>风格</span><b>${convData.style}</b></li>
        <li><span>位置</span><b>${convData.position}</b></li>
        <li><span>来源</span><b>${c.source === 'ai' ? '🤖 AI 原创生成' : '📚 素材库匹配'}</b></li>
      </ul>
      <button class="btn btn--export">⬆ 一键上传至 Vimo</button>
    </div>
  `;
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'v10Run') runV10();
});

/* =====================================================================
   Reveal on scroll (additive animation)
   ===================================================================== */
function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--shown');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  $$('.section, .card, .rm, .hl, .cand, .demo').forEach(el => observer.observe(el));
}
setupReveal();

/* Smooth scroll for anchors */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = $(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Kick off V1.0 BOT conversation */
startConversation();
