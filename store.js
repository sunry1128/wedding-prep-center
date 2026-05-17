const fs = require('node:fs')
const path = require('node:path')

function createStore(filePath) {
  function read() {
    if (!fs.existsSync(filePath)) {
      return { weddings: [], members: [], tasks: [], activities: [] }
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }

  function write(data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return data
  }

  return { read, write }
}

module.exports = { createStore }
