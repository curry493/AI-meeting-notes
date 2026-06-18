const meetingInput = document.getElementById('meetingInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');

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

function showState(state) {
  emptyState.classList.toggle('hidden', state !== 'empty');
  loadingState.classList.toggle('hidden', state !== 'loading');
  errorState.classList.toggle('hidden', state !== 'error');
  resultContent.classList.toggle('hidden', state !== 'result');
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
  showState('empty');
});

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
