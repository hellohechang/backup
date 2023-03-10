const fs = require("fs");

const os = require("os");

const express = require("express");

const app = express();

app.listen(8000, () => {
  let arr = getLocahost().map(item => `http://${item}:8000`)
  console.log(`服务开启成功，访问地址为： \n${arr.join('\n')}`);
})

app.get('/videolist', (req, res) => {
  let { name } = req.query
  name = decodeURIComponent(name);
  res.send({
    data: fs.readdirSync(`./static/video/${name}`),
    last: JSON.parse(fs.readFileSync('./lastplayer.json'))[name]
  })
})
app.get('/vlist', (req, res) => {
  let arr = fs.readdirSync(`./static/video`)
  let obj = JSON.parse(fs.readFileSync('./lastplayer.json'))
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) break
    if (!arr.includes(key)) {
      delete obj[key]
    }
  }
  fs.writeFileSync('./lastplayer.json', JSON.stringify(obj))
  res.send(arr)
})

app.get('/savespeed', (req, res) => {
  let { speed, lname, name } = req.query
  name = decodeURIComponent(name)
  lname = decodeURIComponent(lname)
  let last = JSON.parse(fs.readFileSync('./lastplayer.json'))
  last[lname] = {
    name,
    speed
  }
  fs.writeFileSync('./lastplayer.json', JSON.stringify(last))
  res.send({})
})



app.use(express.static('./static'))

function getLocahost() {
  let obj = os.networkInterfaces()
  let arr = []
  Object.keys(obj).forEach(item => {
    let value = obj[item]
    if (Object.prototype.toString.call(value).slice(8, -1) === 'Array') {
      arr = [...arr, ...value.filter(item => item.family == 'IPv4').map(item => item.address)]
    }
  })
  return arr;
}