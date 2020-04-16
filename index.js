const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const http = require('http')
const socketIo = require('socket.io')
const Twitter = require('node-tweet-stream')
const router = require('./router')
const onTweet = require('./helpers/onTweet')
const { newBoard, onDisconnect } = require('./helpers/onSocket')
require('dotenv').config()
require('./helpers/cron')

const tw = new Twitter({
  consumer_key: process.env.TwitterConsumerKey,
  consumer_secret: process.env.TwitterConsumerSecret,
  token: process.env.TwitterToken,
  token_secret: process.env.TwitterTokenSecret,
})

tw.setMaxListeners(500)

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
})

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  pingTimeout: 86400000,
})

const boards = {}

io.on('connection', (socket) => {
  socket.on('register', ({
    name, hashtag, ...params
  }) => {
    if (boards[name]) {
      boards[name].sockets.push(socket)
    } else {
      boards[name] = newBoard(socket, { name, hashtag, ...params })
      tw.track(`#${hashtag}`)
    }
  })
  socket.on('disconnect', () => {
    const toRemove = onDisconnect(boards, socket, tw)
    if (toRemove) delete boards[toRemove]
  })
})

tw.on('tweet', (tweet) => {
  if (!tweet.retweeted_status) {
    const toRemove = onTweet({ tweet, boards })
    if (toRemove){
        delete boards[toRemove]
    } 
  }
})

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(router)
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
