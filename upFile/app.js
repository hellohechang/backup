const fs = require("fs");

const os = require("os");

const express = require("express");

const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.json({ limit: "50mb", parameterLimit: 1000000 }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    parameterLimit: 1000000,
    extended: false,
  })
);

let myconfig = require('./myconfig')

let { _mkdir, writelog, _err } = require('./utils')


app.use(async (req, res, next) => {
  try {
    req._pathUrl = req.url.split('?')[0];
    next();
  } catch (error) {
    await writelog(`[app.use] ${error}`)
    _err(res)
  }
});

_mkdir(myconfig.filepath).then(() => {
  app.listen(myconfig.port, () => {
    let arr = getLocahost().map(item => `http://${item}${myconfig.port == 80 ? '' : `:${myconfig.port}`}`)
    console.log(`服务开启成功，文件存放目录为：${myconfig.filepath} \n访问地址为： \n${arr.join('\n')}`);
  })
}).catch(() => {
  console.log(`请在myconfig.js文件中设置正确的文件存放目录`)
})


app.use('/file', require('./routes/file'))
app.use('/getfile', require('./routes/getfile'))

app.use(express.static(__dirname + '/static'))
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/static/404.html')
})

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