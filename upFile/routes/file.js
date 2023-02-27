const express = require('express'),
  route = express.Router(),
  fs = require('fs'),
  myconfig = require('../myconfig');
const { _err, receiveFiles, extname, _success, _unlink, writelog, _readdir } = require('../utils');

route.post('/up', async (req, res) => {
  try {
    let { name } = req.query;
    let path = myconfig.filepath;
    if (fs.existsSync(`${path}/${name}`)) {
      let r = Math.random().toString().slice(-5);
      name = `${extname(name)[0]}_${r}${extname(name)[1] == '' ? '' : `.${extname(name)[1]}`}`
    }
    await receiveFiles(req, path, name)
    _success(res)
    await writelog(`上传文件[${name}]`)
  } catch (error) {
    await writelog(`[${req._pathUrl}] ${error}`)
    _err(res)
  }
})
route.post('/del', async (req, res) => {
  try {
    let { arr } = req.body;
    let p = [];
    arr.forEach(item => {
      let path = `${myconfig.filepath}/${item}`;
      if (fs.existsSync(path)) {
        p.push(_unlink(path))
      }
    })
    Promise.all(p).then(async () => {
      await writelog(`删除文件[${arr.join(',')}]`)
      _success(res)
    }).catch(() => {
      _err(res)
    })
  } catch (error) {
    await writelog(`[${req._pathUrl}] ${error}`)
    _err(res)
  }
})
route.get("/getlist", async (req, res) => {
  try {
    let { page, val, showpage = 20 } = req.query;
    let path = myconfig.filepath
    let filearr = await _readdir(path);
    if (val) {
      filearr = filearr.filter(item => item.toLowerCase().includes(val.toLowerCase()))
    }
    let pagenum = Math.ceil(filearr.length / showpage);
    filearr = filearr.map(item => {
      let stat = fs.statSync(`${path}/${item}`)
      return {
        name: item,
        size: stat.size,
        ctime: stat.ctime.getTime()
      }
    })
    filearr.sort((a, b) => {
      return b.ctime - a.ctime;
    });
    page > pagenum ? page = pagenum : (page <= 0 ? page = 1 : null);
    let arr = filearr.slice(showpage * (page - 1), showpage * page);
    _success(res, 'ok', {
      total: filearr.length,
      totalPage: pagenum,
      pageNo: page,
      data: arr
    });
  } catch (error) {
    await writelog(`[${req._pathUrl}] ${error}`)
    _err(res)
  }
});

module.exports = route