'use strict'
const mqtt = require('mqtt')
const log = require('./logger')
let connectMsg = false
const MQTT_HOST = process.env.MQTT_HOST || 'mqtt-broker'
const MQTT_PORT = process.env.MQTT_PORT || '1883'
const MQTT_USER = process.env.MQTT_USER || 'hassio'
const MQTT_PASS = process.env.MQTT_PASS || 'hassio'
const DEVICE_NAME = process.env.DEVICE_NAME || 'node-speedtest'
const connectUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`
console.log(connectUrl)
const client = mqtt.connect(connectUrl, {
  clientId: `mqtt_${DEVICE_NAME}`,
  clean: true,
  keepalive: 60,
  connectTimeout: 4000,
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 1000,
})
client.on('connect', ()=>{
  if(!connectMsg){
    connectMsg = true
    log.info('MQTT Connection successful...')
  }
})
module.exports.publish = (topic, message, retain = false) =>{
  return new Promise((resolve, reject)=>{
    client.publish(topic, message, { qos: 1, retain: retain}, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.registerSensor = (id, name, icon, unit)=>{
  return new Promise((resolve, reject)=>{
    let payload = {
      name: name,
      state_topic: `homeassistant/sensor/${DEVICE_NAME}/${DEVICE_NAME}_${id}/state`,
      availability_topic: `homeassistant/sensor/${DEVICE_NAME}/availability`,
      payload_available: 'Online',
      payload_not_available: 'Offline',
      unique_id: `${DEVICE_NAME}_${id}`,
      device: {
        identifiers: [`${DEVICE_NAME}`],
        manufacturer: 'Scuba',
        model: "Node-Sensor",
        name: `${DEVICE_NAME}`
      }
    }
    if(icon) payload.icon = icon
    if(unit) payload.unit_of_measurement = unit
    client.publish(`homeassistant/sensor/${DEVICE_NAME}/${DEVICE_NAME}_${id}/config`, JSON.stringify(payload), { qos: 1, retain: true }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.sendSensorValue = (id, value)=>{
  return new Promise((resolve, reject)=>{
    client.publish(`homeassistant/sensor/${DEVICE_NAME}/${DEVICE_NAME}_${id}/state`, value, { qos: 1, retain: false }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.sendDeviceAvailability = (value)=>{
  return new Promise((resolve, reject)=>{
    client.publish(`homeassistant/sensor/${DEVICE_NAME}/availability`, value, { qos: 1, retain: false }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
