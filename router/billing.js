const express = require('express')
const { check, validationResult } = require('express-validator')
const stripePackage = require('stripe')
const dynamoDb = require('../helpers/dynamodb')

const router = express.Router()
router.post(
  '/',
  [
    check('tier').isIn(['FREE', 'STANDARD', 'PREMIUM']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const { msg, param } = errors.array()[0]
      return next(`${param}: ${msg}`)
    }
    const {
      source, tier, boardId, name, email,
    } = req.body

    try {
      if (['STANDARD', 'PREMIUM'].includes(tier)) {
        const stripe = stripePackage(process.env.prodStripeSecretKey)
        await stripe.charges.create({
          source,
          amount: tier === 'PREMIUM' ? 80 * 100 : 50 * 100,
          description: `CrowdStar ${tier.toLowerCase()} wall.`,
          currency: 'usd',
          receipt_email: email,
        })
      }

      const params = {
        TableName: process.env.tableName,
        Key: {
          boardId,
          name,
        },
        UpdateExpression: 'set tier = :tier',
        ConditionExpression: 'tier = :none',

        ExpressionAttributeValues: {
          ':tier': tier,
          ':none': 'NONE',
        },
        ReturnValues: 'UPDATED_NEW',
      }
      const item = await dynamoDb.call('update', params)
      return res.send(item)
    } catch (error) {
      return next(error.message)
    }
  },
)

router.put(
  '/',
  [check('color').isHexColor(), check('banner').isURL()],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const { msg, param } = errors.array()[0]
      return next(`${param}: ${msg}`)
    }

    const params = {
      TableName: process.env.tableName,
      Key: {
        boardId: req.body.boardId,
        name: req.body.name,
      },
      UpdateExpression: 'set color = :color, banner = :banner',
      ConditionExpression: 'code = :code',

      ExpressionAttributeValues: {
        ':color': req.body.color,
        ':banner': req.body.banner,
        ':code': req.body.code,
      },
      ReturnValues: 'UPDATED_NEW',
    }

    try {
      const item = await dynamoDb.call('update', params)
      return res.send(item)
    } catch (error) {
      return next(error.message)
    }
  },
)

module.exports = router
