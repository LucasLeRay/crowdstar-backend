const express = require('express')

const app = express()
app.listen(3000, () => {
  console.log('running')
})

app.get('/test', (req, res) => {
  res.json({ test: 'ok' })
})
