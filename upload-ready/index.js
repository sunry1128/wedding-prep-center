const path = require('node:path')
const { createStore } = require('./store')
const { createServer } = require('./app')

const port = process.env.PORT || 3000
const dataPath = process.env.DATA_PATH || path.join(__dirname, '..', 'data', 'db.json')
const store = createStore(dataPath)
const server = createServer({ store, staticDir: path.join(__dirname, '..', 'web') })
server.listen(port, () => {
  console.log(`Wedding app running at http://localhost:${port}`)
})
