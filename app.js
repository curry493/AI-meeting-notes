const meetingInput = document.getElementById('meetingInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyList = document.getElementById('historyList');

const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const resultContent = document.getElementById('resultContent');

const resultTopic = document.getElementById('resultTopic');
const resultSummary = document.getElementById('resultSummary');
const resultDecisions = document.getElementById('resultDecisions');
const resultActions = document.getElementById('resultActions');
const resultPendingDecisions = document.getElementById('resultPendingDecisions');
const pendingDecisionsSection = document.getElementById('pendingDecisionsSection');

const noActions = document.getElementById('noActions');
const resultEmail = document.getElementById('resultEmail');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyBtnText = document.getElementById('copyBtnText');

let emailDraftText = '';
let currentRecordId = null;
let saveTimeout = null;

// 自动保存输入内容（防丢失）
function autoSaveInput() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const text = meetingInput.value.trim();
    if (text) {
      localStorage.setItem('meeting_input_backup', text);
    }
  }, 1000);
}

// 恢复上次输入
function restoreInput() {
  const saved = localStorage.getItem('meeting_input_backup');
  if (saved) {
    meetingInput.value = saved;
  }
}

// 保存历史记录到服务器
async function saveToHistory(input, output, topic) {
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, output, topic })
    });
    const data = await res.json();
    if (data.success) {
      currentRecordId = data.record.id;
      return data.record;
    }
  } catch (e) {
    console.error('保存历史记录失败:', e);
  }
  return null;
}

// 更新历史记录
async function updateHistory(id, input, output, topic) {
  try {
    await fetch(`/api/history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, output, topic })
    });
  } catch (e) {
    console.error('更新历史记录失败:', e);
  }
}

// 加载历史记录列表
async function loadHistoryList() {
  try {
    const res = await fetch('/api/history');
    const history = await res.json();
    renderHistoryList(history);
  } catch (e) {
    console.error('加载历史记录失败:', e);
    historyList.innerHTML = '<p class="text-sm text-red-500">加载失败</p>';
  }
}

// 渲染历史记录列表
function renderHistoryList(history) {
  if (history.length === 0) {
    historyList.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">暂无历史记录</p>';
    return;
  }
  
  historyList.innerHTML = history.map(item => {
    const date = new Date(item.createdAt);
    const timeStr = date.toLocaleString('zh-CN', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const preview = item.input.slice(0, 50) + (item.input.length > 50 ? '...' : '');
    return `
      <div class="history-item bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition cursor-pointer" data-id="${item.id}">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-medium text-slate-800">${escapeHtml(item.topic || '未命名')}</div>
            <div class="text-xs text-slate-400 mt-1">${timeStr}</div>
            <div class="text-sm text-slate-500 mt-2 line-clamp-2">${escapeHtml(preview)}</div>
          </div>
          <button class="delete-history text-slate-400 hover:text-red-500 p-1 ml-2" data-id="${item.id}" title="删除">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // 绑定点击事件
  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-history')) return;
      loadHistoryRecord(item.dataset.id);
    });
  });
  
  historyList.querySelectorAll('.delete-history').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('确定要删除这条记录吗？')) {
        await deleteHistory(btn.dataset.id);
      }
    });
  });
}

// 加载单条历史记录
async function loadHistoryRecord(id) {
  try {
    const res = await fetch('/api/history');
    const history = await res.json();
    const record = history.find(r => r.id === id);
    if (record) {
      meetingInput.value = record.input;
      if (record.output) {
        renderResult(record.output);
      }
      currentRecordId = id;
      closeHistoryModal();
    }
  } catch (e) {
    console.error('加载历史记录失败:', e);
  }
}

// 删除历史记录
async function deleteHistory(id) {
  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    loadHistoryList();
  } catch (e) {
    console.error('删除历史记录失败:', e);
  }
}

// 打开历史记录弹窗
function openHistoryModal() {
  historyModal.classList.remove('hidden');
  loadHistoryList();
}

// 关闭历史记录弹窗
function closeHistoryModal() {
  historyModal.classList.add('hidden');
}

function showState(state) {
  emptyState.classList.toggle('hidden', state !== 'empty');
  loadingState.classList.toggle('hidden', state !== 'loading');
  errorState.classList.toggle('hidden', state !== 'error');
  resultContent.classList.toggle('hidden', state !== 'result');
  
  // 页面加载时恢复上次输入
  if (state === 'empty' && meetingInput.value === '') {
    restoreInput();
  }
}

function setLoading(loading) {
  generateBtn.disabled = loading;
  btnText.textContent = loading ? '生成中…' : '生成会议纪要';
  if (loading) {
    btnIcon.innerHTML = '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>';
    btnIcon.classList.add('animate-spin');
  } else {
    btnIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
    btnIcon.classList.remove('animate-spin');
  }
}

function priorityBadge(priority) {
  const map = {
    '高': 'bg-red-100 text-red-700',
    '中': 'bg-amber-100 text-amber-700',
    '低': 'bg-green-100 text-green-700',
  };
  const cls = map[priority] || 'bg-slate-100 text-slate-600';
  return `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}">${priority || '中'}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderResult(data) {
  resultTopic.textContent = data.topic || '未识别主题';
  resultSummary.textContent = data.summary || '';

  const pending = data.pendingDecisions || [];
  if (pending.length > 0) {
    pendingDecisionsSection.classList.remove('hidden');
    resultPendingDecisions.innerHTML = '';
    pending.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'bg-amber-50 rounded-lg p-3 text-sm';
      li.innerHTML = `
        <div class="font-medium text-amber-800 mb-1">${escapeHtml(item.topic || '')}</div>
        <div class="text-amber-700"><span class="font-medium">当前状态：</span>${escapeHtml(item.currentStatus || '')}</div>
        <div class="text-amber-700"><span class="font-medium">下一步：</span>${escapeHtml(item.nextStep || '')}</div>`;
      resultPendingDecisions.appendChild(li);
    });
  } else {
    pendingDecisionsSection.classList.add('hidden');
  }

  resultDecisions.innerHTML = '';
  const decisions = data.decisions || [];
  if (decisions.length === 0) {
    resultDecisions.innerHTML = '<li class="text-sm text-slate-400 italic">暂无关键决策</li>';
  } else {
    decisions.forEach((d) => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2 text-sm text-slate-700';
      li.innerHTML = `
        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
        <span>${escapeHtml(d)}</span>`;
      resultDecisions.appendChild(li);
    });
  }

  const actions = data.actionItems || [];
  if (actions.length === 0) {
    noActions.classList.remove('hidden');
    resultActions.closest('.overflow-x-auto').classList.add('hidden');
  } else {
    noActions.classList.add('hidden');
    resultActions.closest('.overflow-x-auto').classList.remove('hidden');
    resultActions.innerHTML = '';
    actions.forEach((item) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80';
      tr.innerHTML = `
        <td class="px-4 py-3 text-slate-800">${escapeHtml(item.task)}</td>
        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${escapeHtml(item.owner || '待定')}</td>
        <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${escapeHtml(item.deadline || '待定')}</td>
        <td class="px-4 py-3">${priorityBadge(item.priority)}</td>`;
      resultActions.appendChild(tr);
    });
  }

  emailDraftText = data.emailDraft || '';
  resultEmail.textContent = emailDraftText;
  copyBtnText.textContent = '复制';

  showState('result');
}

async function generate() {
  const text = meetingInput.value.trim();
  if (!text) {
    showState('error');
    errorMessage.textContent = '请先粘贴会议文字内容';
    return;
  }

  showState('loading');
  setLoading(true);

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      showState('error');
      errorMessage.textContent = data.error || '请求失败，请稍后重试';
      return;
    }

    renderResult(data);
    
    // 自动保存到历史记录
    const topic = data.topic || '未命名会议';
    if (currentRecordId) {
      // 更新现有记录
      await updateHistory(currentRecordId, text, data, topic);
    } else {
      // 创建新记录
      await saveToHistory(text, data, topic);
    }
  } catch {
    showState('error');
    errorMessage.textContent = '网络错误，请检查服务器是否已启动';
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener('click', generate);

clearBtn.addEventListener('click', () => {
  meetingInput.value = '';
  localStorage.removeItem('meeting_input_backup');
  currentRecordId = null;
  showState('empty');
});

// 历史记录按钮
historyBtn.addEventListener('click', openHistoryModal);
closeHistoryBtn.addEventListener('click', closeHistoryModal);

// 点击背景关闭弹窗
historyModal.addEventListener('click', (e) => {
  if (e.target === historyModal) closeHistoryModal();
});

// 输入时自动保存到本地
meetingInput.addEventListener('input', autoSaveInput);

copyEmailBtn.addEventListener('click', async () => {
  if (!emailDraftText) return;
  try {
    await navigator.clipboard.writeText(emailDraftText);
    copyBtnText.textContent = '已复制';
    setTimeout(() => { copyBtnText.textContent = '复制'; }, 2000);
  } catch {
    copyBtnText.textContent = '复制失败';
    setTimeout(() => { copyBtnText.textContent = '复制'; }, 2000);
  }
});

meetingInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') generate();
});

showState('empty');
