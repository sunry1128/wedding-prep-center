let session = JSON.parse(localStorage.getItem('wedding-session') || 'null')
let dashboard = null

const $ = (id) => document.getElementById(id)
const message = (text = '') => { $('message').textContent = text }

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '请求失败')
  return data
}

function saveSession(next) {
  session = next
  localStorage.setItem('wedding-session', JSON.stringify(next))
}

async function refresh() {
  dashboard = await api(`/api/dashboard/${session.weddingId}`)
  render()
}

function renderTasks() {
  $('tasks-panel').innerHTML = dashboard.tasks.map((task) => `
    <article class="task">
      <div class="task-head">
        <div>
          <strong>${task.title}</strong><br>
          <small>${task.stage} · ${task.category}</small>
        </div>
        <span>${task.status === 'done' ? '已完成' : '待办'}</span>
      </div>
      <button data-task="${task.id}" data-status="${task.status === 'done' ? 'todo' : 'done'}">
        ${task.status === 'done' ? '重新打开' : '标记完成'}
      </button>
    </article>
  `).join('')
}

function renderActivity() {
  $('activity-panel').innerHTML = dashboard.activities.map((item) => `
    <article class="activity"><strong>${item.summary}</strong><br><small>${new Date(item.createdAt).toLocaleString()}</small></article>
  `).join('') || '<p>还没有动态</p>'
}

function renderMembers() {
  $('members-panel').innerHTML = dashboard.members.map((member) => `
    <article class="member"><strong>${member.nickname}</strong><br><small>${member.role === 'admin' ? '管理员' : '成员'}</small></article>
  `).join('')
}

function render() {
  $('entry').hidden = true
  $('app').hidden = false
  $('wedding-name').textContent = dashboard.wedding.name
  $('wedding-date').textContent = dashboard.wedding.weddingDate
  $('progress').textContent = `${dashboard.progress}%`
  $('invite-card').hidden = false
  $('invite-code').textContent = session.inviteCode
  renderTasks()
  renderActivity()
  renderMembers()
}

$('create-btn').onclick = async () => {
  try {
    message()
    const data = await api('/api/weddings', {
      method: 'POST',
      body: {
        name: $('create-name').value.trim(),
        weddingDate: $('create-date').value,
        nickname: $('create-nickname').value.trim()
      }
    })
    saveSession({ weddingId: data.wedding.id, nickname: data.member.nickname, inviteCode: data.inviteCode })
    await refresh()
    alert(`创建成功，邀请码：${data.inviteCode}`)
  } catch (error) { message(error.message) }
}

$('join-btn').onclick = async () => {
  try {
    message()
    const data = await api('/api/join', {
      method: 'POST',
      body: { inviteCode: $('join-code').value.trim(), nickname: $('join-nickname').value.trim() }
    })
    saveSession({ weddingId: data.wedding.id, nickname: data.member.nickname, inviteCode: $('join-code').value.trim() })
    await refresh()
  } catch (error) { message(error.message) }
}

document.body.onclick = async (event) => {
  if (event.target.id === 'copy-invite-btn') {
    await navigator.clipboard.writeText(session.inviteCode)
    message('邀请码已复制')
  }
  const taskId = event.target.dataset.task
  if (taskId) {
    await api(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: { weddingId: session.weddingId, status: event.target.dataset.status, actorName: session.nickname }
    })
    await refresh()
  }
  const tab = event.target.dataset.tab
  if (tab) {
    document.querySelectorAll('.tabs button').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab))
    ;['tasks', 'activity', 'members'].forEach((name) => { $(`${name}-panel`).hidden = name !== tab })
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js')
if (session) refresh().catch(() => localStorage.removeItem('wedding-session'))
