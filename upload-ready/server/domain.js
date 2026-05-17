const { TEMPLATE_TASKS } = require('../miniprogram/utils/template')

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function now() {
  return new Date().toISOString()
}

function createWedding(store, input) {
  if (!input.name || !input.weddingDate || !input.nickname) {
    throw new Error('请完整填写婚礼名称、日期和昵称')
  }
  const data = store.read()
  const wedding = {
    id: id('wed'),
    name: input.name,
    weddingDate: input.weddingDate,
    inviteCode: '',
    createdAt: now()
  }
  wedding.inviteCode = `wedding:${wedding.id}`
  const member = {
    id: id('mem'),
    weddingId: wedding.id,
    nickname: input.nickname,
    role: 'admin',
    joinedAt: now()
  }
  const tasks = TEMPLATE_TASKS.map(([stage, category, title], index) => ({
    id: id('task'),
    weddingId: wedding.id,
    title,
    stage,
    category,
    priority: index === 2 ? 'urgent' : 'normal',
    status: 'todo',
    note: '',
    dueDate: null,
    completedBy: '',
    completedAt: null
  }))
  data.weddings.push(wedding)
  data.members.push(member)
  data.tasks.push(...tasks)
  data.activities.unshift({
    id: id('act'),
    weddingId: wedding.id,
    actorName: input.nickname,
    action: 'create_wedding',
    summary: `${input.nickname} 创建了婚礼空间`,
    createdAt: now()
  })
  store.write(data)
  return { wedding, member, tasks, inviteCode: wedding.inviteCode }
}

function joinWedding(store, input) {
  if (!input.inviteCode || !input.nickname) throw new Error('请填写邀请码和昵称')
  const data = store.read()
  const weddingId = input.inviteCode.startsWith('wedding:') ? input.inviteCode.slice('wedding:'.length) : ''
  const wedding = data.weddings.find((item) => item.id === weddingId)
  if (!wedding) throw new Error('邀请码无效')
  const existing = data.members.find((item) => item.weddingId === wedding.id && item.nickname === input.nickname)
  const member = existing || {
    id: id('mem'),
    weddingId: wedding.id,
    nickname: input.nickname,
    role: 'member',
    joinedAt: now()
  }
  if (!existing) {
    data.members.push(member)
    data.activities.unshift({
      id: id('act'),
      weddingId: wedding.id,
      actorName: input.nickname,
      action: 'join',
      summary: `${input.nickname} 加入了婚礼`,
      createdAt: now()
    })
    store.write(data)
  }
  return { wedding, member }
}

function getDashboard(store, weddingId) {
  const data = store.read()
  const wedding = data.weddings.find((item) => item.id === weddingId)
  if (!wedding) throw new Error('婚礼不存在')
  const tasks = data.tasks.filter((task) => task.weddingId === weddingId)
  const members = data.members.filter((member) => member.weddingId === weddingId)
  const activities = data.activities.filter((activity) => activity.weddingId === weddingId).slice(0, 20)
  const done = tasks.filter((task) => task.status === 'done').length
  return {
    wedding,
    members,
    tasks,
    activities,
    progress: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100)
  }
}

function updateTaskStatus(store, input) {
  const data = store.read()
  const task = data.tasks.find((item) => item.weddingId === input.weddingId && item.id === input.taskId)
  if (!task) throw new Error('任务不存在')
  task.status = input.status
  task.completedBy = input.status === 'done' ? input.actorName : ''
  task.completedAt = input.status === 'done' ? now() : null
  data.activities.unshift({
    id: id('act'),
    weddingId: input.weddingId,
    actorName: input.actorName,
    action: input.status === 'done' ? 'complete' : 'reopen',
    summary: `${input.actorName} ${input.status === 'done' ? '完成了' : '重新打开了'}「${task.title}」`,
    createdAt: now()
  })
  store.write(data)
  return task
}

module.exports = { createWedding, joinWedding, getDashboard, updateTaskStatus }
