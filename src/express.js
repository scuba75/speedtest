'use strict'
const log = require('./logger')
const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const speedTest = require('./speedTest')
const PORT = process.env.PORT || 3000
const app = express()
app.use(bodyParser.json({
  limit: '100MB',
  verify: (req, res, buf)=>{
    req.rawBody = buf.toString()
  }
}));
app.use(compression());
const server = app.listen(PORT, ()=>{
  log.info(`Speedtest server is listening on ${server.address().port}`)
})
app.get('/history', (req, res)=>{
  speedTest.history(res)
})
app.get('/sendLast', (req, res)=>{
  speedTest.sendLast(res)
})
