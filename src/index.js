'use strict'
const fs = require('fs')
const log = require('./logger')
const speedTest = require('./speedTest')
const mqtt = require('./mqtt')
const sensors = require('./sensors.json')
let SYNC_HOURS = process.env.SYNC_HOURS || 2
const HISTORY_LENGTH = process.env.HISTORY_LENGTH || 20
let history = []

const readHistory = async()=>{
  try{
    let data = await fs.readFileSync('/app/src/data/history.json')
    if(data) return JSON.parse(data)
  }catch(e){
    log.error(`error reading history file...`)
  }
}
const saveHistory = async()=>{
  try{
    await fs.writeFileSync('/app/src/data/history.json', JSON.stringify(history, null, 2))
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
const createSensors = async()=>{
  try{
    let tempHistory = await readHistory()
    if(tempHistory) history = tempHistory
    for(let i in sensors){
      log.info(`Creating sensor for ${sensors[i].name}...`)
      await mqtt.registerSensor(sensors[i].id, sensors[i].name, sensors[i].icon, sensors[i].units)
    }
    updateData()
  }catch(e){
    log.error(e)
    setTimeout(createSensors, 5000)
  }
}
const updateData = async()=>{
  try{
    let data = await speedTest()
    if(data){
      await updateHistory(data)
      await mqtt.sendDeviceAvailability('Online')
      for(let i in data){
        if(sensors.filter(x=>x.id === i).length > 0) await updateSensor(i, data[i]?.toString())
      }
    }
    setTimeout(updateData, +SYNC_HOURS * 60 * 60 * 1000)
  }catch(e){
    log.error(e)
    setTimeout(updateData, 5000)
  }
}
const updateSensor = async(id, value)=>{
  try{
    await mqtt.sendSensorValue(id, value)
  }catch(e){
    throw(e)
  }
}
createSensors()
