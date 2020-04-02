const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const https = require('https')
const socketIo = require('socket.io')
const Twitter = require('node-tweet-stream')
const router = require('./router')
require('dotenv').config()

const tw = new Twitter({
  consumer_key: process.env.TwitterConsumerKey,
  consumer_secret: process.env.TwitterConsumerSecret,
  token: process.env.TwitterToken,
  token_secret: process.env.TwitterTokenSecret,
})

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
})

const app = express()
const server = https.createServer(app)
app.use(cors())
const io = socketIo(server)

const boards = {}

io.on('connection', (socket) => {
  socket.on('register', ({ name, hashtag }) => {
    if (boards[name]) {
      boards[name].sockets.push(socket)
    } else {
      boards[name] = {
        hashtag,
        compt: 0,
        sockets: [socket],
      }
    }
    tw.track(`#${hashtag}`)
  })
  socket.on('unregister', (name) => {
    // eslint-disable-next-line max-len
    boards[name].sockets = boards[name].sockets.filter((elem) => elem.id !== socket.id)
    if (!boards[name].sockets.length) {
      const { hashtag } = boards[name]
      let usedHashtag = false
      delete boards[name]
      Object.keys(boards).forEach((keyBoard) => {
        if (boards[keyBoard].hashtag === hashtag) {
          usedHashtag = true
        }
      })
      if (!usedHashtag) {
        tw.untrack(`#${hashtag}`)
      }
    }
  })
})

let hashtags
let board
tw.on('tweet', (tweet) => {
  Object.keys(boards).forEach((keyBoard) => {
    board = boards[keyBoard]
    hashtags = tweet.entities.hashtags.map((h) => h.text)
    if (hashtags.includes(board.hashtag)) {
      for (let i = 0; i < board.sockets.length; i += 1) {
        board.compt += 1
        board.sockets[i].emit('tweet', {
          tweet: {
            profilePicture: tweet.user.profile_image_url.replace('_normal', ''),
            userName: tweet.user.name,
            screenName: `@${tweet.user.screen_name}`,
            content: tweet.text,
            hashtags: tweet.entities.hashtags.map((h) => h.text),
            media: !!tweet.entities.media && tweet.entities.media[0].media_url,
            id: tweet.id_str,
          },
          compt: board.compt,
        })
      }
    }
  })
})

app.use(bodyParser.json())
app.use(router)
app.use((error, req, res, next) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
