const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const http = require('http')
const socketIo = require('socket.io')
const Twitter = require('node-tweet-stream')
const router = require('./router')
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
    name, hashtag, giveway, winnerRate,
  }) => {
    if (boards[name]) {
      boards[name].sockets.push(socket)
    } else {
      boards[name] = {
        hashtag,
        giveway: winnerRate === 0 ? 'NONE' : giveway,
        winnerRate,
        winnerIndex: ['EVERY', 'AT'].includes(giveway)
          && Math.floor(Math.random() * winnerRate),
        counter: 0,
        sockets: [socket],
      }
    }
    tw.track(`#${hashtag}`)
  })
  socket.on('disconnect', () => {
    Object.keys(boards).forEach((keyBoard) => {
      for (let i = 0; i < boards[keyBoard].sockets.length; i += 1) {
        if (boards[keyBoard].sockets[i].id === socket.id) {
          // eslint-disable-next-line max-len
          boards[keyBoard].sockets = boards[keyBoard].sockets.filter((elem) => elem.id !== socket.id)
          if (!boards[keyBoard].sockets.length) {
            const { hashtag } = boards[keyBoard]
            let usedHashtag = false
            delete boards[keyBoard]
            Object.keys(boards).forEach((keyBoardOther) => {
              if (boards[keyBoardOther].hashtag === hashtag) {
                usedHashtag = true
              }
            })
            if (!usedHashtag) {
              tw.untrack(`#${hashtag}`)
            }
          }
          return
        }
      }
    })
  })
})

let hashtags
let board
tw.on('tweet', (tweet) => {
  if (!tweet.retweeted_status) {
    Object.keys(boards).forEach((keyBoard) => {
      board = boards[keyBoard]
      hashtags = tweet.entities.hashtags.map((h) => h.text)
      if (hashtags.includes(board.hashtag)) {
        if ((board.giveway === 'EVERY'
        || (board.giveway === 'AT' && board.counter < board.winnerRate))
        && board.counter % board.winnerRate === board.winnerIndex) {
          board.winner = {
            profilePicture: tweet.user.profile_image_url.replace('_normal', ''),
            userName: tweet.user.name,
            screenName: `@${tweet.user.screen_name}`,
            content: tweet.text,
            // eslint-disable-next-line max-len
            media: tweet.entities.media ? tweet.entities.media[0].media_url : '',
            id: tweet.id_str,
          }
        }
        board.counter += 1
        for (let i = 0; i < board.sockets.length; i += 1) {
          board.sockets[i].emit('tweet', {
            tweet: {
              // eslint-disable-next-line max-len
              profilePicture: tweet.user.profile_image_url.replace('_normal', ''),
              userName: tweet.user.name,
              screenName: `@${tweet.user.screen_name}`,
              content: tweet.text,
              // eslint-disable-next-line max-len
              media: tweet.entities.media ? tweet.entities.media[0].media_url : '',
              id: tweet.id_str,
            },
            counter: board.counter,
          })
          if ((board.giveway === 'EVERY'
        || (board.giveway === 'AT' && board.counter < board.winnerRate))
        && board.counter % board.winnerRate === 0 && board.counter > 0) {
            board.sockets[i].emit('winner', board.winner)
          }
        }
      }
    })
  }
})

app.use(cors())
app.use(bodyParser.json())
app.use(router)
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  res.status(500).send({ error })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Mixing it up on port ${PORT}`)
})
