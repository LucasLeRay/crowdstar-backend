const express = require('express')
const https = require('https')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const fs = require('fs')
const router = require('./router')

AWS.config.update({
  region: 'eu-west-1',
})
require('dotenv').config()

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(router)
app.use((error, req, res) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
}, app)
  .listen(PORT, () => {
    console.log(`Mixing it up on port ${PORT}`)
  })
