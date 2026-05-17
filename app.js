const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { createWedding, joinWedding, getDashboard, updateTaskStatus } = require('./domain')

function send(res, statusCode, body, contentType = 'application/json') {
  res.writeHead(statusCode, { 'content-type': contentType })
  res.end(contentType === 'application/json' ? JSON.stringify(body) : body)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch (error) { reject(error) }
    })
    req.on('error', reject)
  })
}

function createHandler({ store, staticDir }) {
  return async (req, res) => {
    try {
      if (req.method === 'POST' && req.url === '/api/weddings') {
        return send(res, 201, createWedding(store, await readJson(req)))
      }
      if (req.method === 'POST' && req.url === '/api/join') {
        return send(res, 200, joinWedding(store, await readJson(req)))
      }
      if (req.method === 'GET' && req.url.startsWith('/api/dashboard/')) {
        return send(res, 200, getDashboard(store, req.url.split('/').pop()))
      }
      if (req.method === 'PATCH' && req.url.startsWith('/api/tasks/')) {
        const taskId = req.url.split('/').pop()
        const body = await readJson(req)
        return send(res, 200, updateTaskStatus(store, { ...body, taskId }))
      }

      const requestPath = req.url === '/' ? '/index.html' : req.url
      const filePath = path.join(staticDir, requestPath)
      if (!filePath.startsWith(staticDir) || !fs.existsSync(filePath)) {
        return send(res, 404, { error: 'not found' })
      }
      const ext = path.extname(filePath)
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.webmanifest': 'application/manifest+json',
        '.png': 'image/png'
      }
      return send(res, 200, fs.readFileSync(filePath), types[ext] || 'application/octet-stream')
    } catch (error) {
      return send(res, 400, { error: error.message })
    }
  }
}

function createServer(options) {
  return http.createServer(createHandler(options))
}

module.exports = { createHandler, createServer }
