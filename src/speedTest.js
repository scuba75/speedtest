'use strict'
const SpeedTest = require('speedtest-net')
const getSpeed = async()=>{
  try{
    return await SpeedTest({acceptLicense: true})
  }catch(e){
    throw(e);
  }
}
module.exports = async()=>{
  try{
    let data = await getSpeed()
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
