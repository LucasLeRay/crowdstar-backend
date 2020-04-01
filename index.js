const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const router = require('./router')
require('dotenv').config()

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
})

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(router)
app.use((error, req, res, next) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
