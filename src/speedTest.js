'use strict'
const SpeedTest = require('speedtest-net')
const fs = require('fs')
const mqtt = require('./mqtt')
const log = require('./logger')
const sensors = require('./sensors.json')
let history = [], historyPulled = false
const HISTORY_LENGTH = process.env.HISTORY_LENGTH || 20
const HISTORY_FILE = '/app/data/history.json'

const readHistory = async()=>{
  try{
    let data = await fs.readFileSync(HISTORY_FILE)
    if(data) return JSON.parse(data)
  }catch(e){
    log.error(`error reading history file...`)
  }
}
const saveHistory = async()=>{
  try{
    await fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  }catch(e){
    log.error(e)
  }
}
const cleanHistory = ()=>{
  while(history.length > +HISTORY_LENGTH) history.shift()
}

const updateHistory = async(data)=>{
  try{
    if(history.length > +HISTORY_LENGTH) await cleanHistory()
    if(history.length == +HISTORY_LENGTH) history.shift()
    history.push(data)
    await saveHistory()
  }catch(e){
    log.error(e)
  }
}
const start = async()=>{
  try{
    let tempHistory = await readHistory()
    if(tempHistory) history = tempHistory
    historyPulled = true
  }catch(e){
    log.error(e)
  }
}
start()
const speedTest = async()=>{
  try{
    let data = await SpeedTest({acceptLicense: true})
    if(data?.result){
      let timeStamp = new Date(data.timestamp)
      return {
        ping: data.ping.latency,
        time: timeStamp.toLocaleString('en-US', { timeZone: 'America/New_york', hour12: false }),
        upload: Math.floor( (data.upload.bandwidth || 0) / 125000),
        download: Math.floor( (data.download.bandwidth || 0) / 125000),
        url: data.result.url
      }
    }
  }catch(e){
    throw(e)
  }
}
module.exports = async()=>{
  try{
    if(!historyPulled) throw({error: 'History not updated yet'})
    let data = await speedTest()
    if(data){
      await updateHistory(data)
      await mqtt.sendDeviceAvailability('Online')
      for(let i in data){
        if(sensors.filter(x=>x.id === i).length > 0) await mqtt.sendSensorValue(i, data[i]?.toString(), true)
      }
    }

  }catch(e){
    throw(e)
  }
}
module.exports.history = (res)=>{
  try{
    if(!history || history.length === 0){
      res.json({error: 'data not available'})
    }else{
      res.json(history)
    }
  }catch(e){
    log.error(e)
    if(res) res.sendStatus(503)
  }
}
module.exports.sendLast = async(res)=>{
  try{
    if(!history || history.length === 0){
      res.json({error: 'data not available'})
      return;
    }
    let data = history[history.length - 1]
    if(data){
      await mqtt.sendDeviceAvailability('Online')
      for(let i in data){
        if(sensors.filter(x=>x.id === i).length > 0) await mqtt.sendSensorValue(i, data[i]?.toString(), true)
      }
      res.json(data)
      return;
    }
    res.json({error: 'data not available'})
  }catch(e){
    log.error(e)
    if(res) res.sendStatus(503)
  }
}
