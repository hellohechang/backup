const express = require('express'),
  fs = require('fs'),
  route = express.Router();
let myconfig = require('../myconfig');
const { _err, writelog } = require('../utils');

route.get('*', async (req, res) => {
  try {
    // 去除url后的?参数
    let url = req.url.split('?')[0]
    // 合并url
    let path = myconfig.filepath + url;
    // 解码
    path = decodeURI(path)
    if (!fs.existsSync(path)) {
      _err(res, '文件不存在或已过期~')
      return;
    }
    res.sendFile(path)
  } catch (error) {
    await writelog(req, `[${req._pathUrl}] ${error}`)
    _err(res)
  }
})

module.exports = route