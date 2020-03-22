const express = require('express')

const app = express()
app.listen(3000, () => {
  console.log('running')
})

app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})
