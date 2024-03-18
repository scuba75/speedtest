'use strict'

const log = require('./logger')
const speedTest = require('./speedTest')
const mqtt = require('./mqtt')
const sensors = require('./sensors.json')
require('./express')
let SYNC_HOURS = process.env.SYNC_HOURS || 2

const createSensors = async()=>{
  try{
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
    await speedTest()
    setTimeout(updateData, +SYNC_HOURS * 60 * 60 * 1000)
  }catch(e){
    log.error(e)
    if(e?.error){
      setTimeout(updateData, 5000)
    }else{
      setTimeout(updateData, +SYNC_HOURS * 30 * 60 * 1000)
    }
  }
}
createSensors()
