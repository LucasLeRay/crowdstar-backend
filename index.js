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

app.use(bodyParser.json())
app.use(cors({ origin: /^(http|https):\/\/crowdstar.xyz$/ }))
app.use(router)
app.use((error, req, res) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
