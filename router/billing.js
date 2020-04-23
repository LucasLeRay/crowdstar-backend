const express = require('express')
const { check, validationResult } = require('express-validator')
require('dotenv').config()

const stripe = require('stripe')(process.env.prodStripeSecretKey)
const dynamoDb = require('../helpers/dynamodb')

const router = express.Router()

async function getBoardFromName(name) {
  const params = {
    TableName: process.env.tableName,
    FilterExpression: '#room_name = :room',
    ExpressionAttributeValues: {
      ':room': name,
    },
    ExpressionAttributeNames: {
      '#room_name': 'name',
    },
  }

  const result = await dynamoDb.call('scan', params)
  return result.Items[0]
}

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
      tier, name, sessionId,
    } = req.body

    try {
      if (!['STANDARD', 'PREMIUM', 'FREE'].includes(tier)) {
        return next('Invalid tier')
      }
      if (['STANDARD', 'PREMIUM'].includes(tier) && !sessionId) {
        return next('Invalid payment')
      }

      const { boardId } = await getBoardFromName(name)

      const params = {
        TableName: process.env.tableName,
        Key: {
          boardId,
          name,
        },
        UpdateExpression: 'set tier = :tier',

        ExpressionAttributeValues: {
          ':tier': tier,
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

router.post(
  '/session/standard',
  async (req, res, next) => {
    const { name } = req.body

    try {
      const { id } = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          name: 'Standard Wall',
          description: 'A Tweet Wall suited for your event.',
          images: ['https://crowdstar.xyz/demo.png'],
          amount: 50 * 100,
          currency: 'usd',
          quantity: 1,
        }],
        // eslint-disable-next-line max-len
        success_url: `https://crowdstar.xyz/billing/${name}/?tier=STANDARD&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://crowdstar.xyz/board/${name}/`,
      })
      return res.send({ id })
    } catch (error) {
      return next(error.message)
    }
  },
)

router.post(
  '/session/premium',
  async (req, res, next) => {
    const { name } = req.body

    try {
      const { id } = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          name: 'Premium Wall',
          // eslint-disable-next-line max-len
          description: 'A Tweet Wall suited for your event. (+$30 discount next time!)',
          images: ['https://crowdstar.xyz/demo.png'],
          amount: 80 * 100,
          currency: 'usd',
          quantity: 1,
        }],
        // eslint-disable-next-line max-len
        success_url: `https://crowdstar.xyz/billing/${name}/?tier=PREMIUM&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://crowdstar.xyz/board/${name}/`,
      })
      return res.send({ id })
    } catch (error) {
      return next(error.message)
    }
  },
)

module.exports = router
