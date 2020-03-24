const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const router = require('./router')

AWS.config.update({
  region: 'eu-west-1',
})
require('dotenv').config()

const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use(router)
app.use((error, req, res) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
