const express = require('express')
const board = require('./board')

const router = express.Router()
router.get('/', (req, res) => res.json({ status: 'ok' }))
router.use('/board', board)

module.exports = router
