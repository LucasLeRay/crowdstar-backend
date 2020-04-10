const express = require('express')
const board = require('./board')
const billing = require('./billing')

const router = express.Router()
router.get('/', (req, res) => res.json({ status: 'ok' }))
router.use('/board', board)
router.use('/billing', billing)

module.exports = router
