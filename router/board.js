const express = require('express')
const { v1 } = require('uuid')
const { check, validationResult } = require('express-validator')
const dynamoDb = require('../helpers/dynamodb')
const sendEmail = require('../helpers/sendEmail')

const router = express.Router()
router.get('/', (req, res) => res.send({ board: 'ok' }))

router.post('/', [
  check('hashtag').isAlphanumeric(),
  check('color').isHexColor(),
  check('giveway').isIn(['NONE', 'ONE_TIME', 'EVERY']),
  check('winnerRate').custom((winnerRate) => {
    return Number.isInteger(winnerRate) && winnerRate > 0
  },
  check('email').isEmail(),
], async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const { msg, param } = errors.array()[0]
    return next(`${param}: ${msg}`)
  }
  const {
    hashtag, color, banner, giveway, winnerRate, email,
  } = req.body

  const params = {
    TableName: process.env.tableName,
    Item: {
      boardId: v1(),
      hashtag,
      color,
      banner,
      giveway,
      winnerRate,
      email,
      code: (Math.random() * 10000).toString().slice(0, 4),
    },
  }

  try {
    dynamoDb.call('put', params)
    sendEmail(email, 'cc', 'bg')
    return res.send(params.Item)
  } catch (error) {
    return next(error.message)
  }
})

module.exports = router
