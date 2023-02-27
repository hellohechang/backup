const fs = require('fs')

const formidable = require('formidable')

// 记录日志
async function writelog(str) {
  str = `[${newDate('{0}-{1}-{2} {3}:{4}')}] - ${str}\n`
  await _appendFile('./hello.log', str)
}
// 获取和保存文件
function _readFile(path, y) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (y) {
        resolve(result);
      } else {
        resolve(JSON.parse(result));
      }
    });
  });
}
function _writeFile(path, data) {
  data !== null && typeof data === 'object' ? data = JSON.stringify
    (data) : null;
  typeof data !== 'string' ? data += '' : null;
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
function _readdir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
function _mkdir(path) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path)) {
      resolve();
      return
    };
    fs.mkdir(path, { recursive: true }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
function _unlink(path) {
  if (!fs.existsSync(path)) return;
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
function _appendFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, data, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
// 删除目录
function delDir(path) {
  if (!fs.existsSync(path)) return;
  return new Promise((resolve, reject) => {
    fs.stat(path, function (err, status) {
      if (status.isDirectory()) { //是文件夹
        fs.readdir(path, function (err, file) {
          let res = file.map((item) => delDir(`${path}/${item}`));
          Promise.all(res).then(() => { //当所有的子文件都删除后就删除当前文件夹
            fs.rmdir(path, resolve);
          });
        });
      } else {
        fs.unlink(path, resolve);
      }
    });
  });
}
// 格式化当前日期或时间戳日期
function newDate(templete, timestamp) {
  templete ? null : (templete = "{0}年{1}月{2}日 {3}时{4}分{5}秒 星期{6}");
  let currentDate = timestamp ? new Date(+timestamp) : new Date();
  let year = currentDate.getFullYear(),
    month = currentDate.getMonth() + 1,
    date = currentDate.getDate(),
    hour = currentDate.getHours(),
    minute = currentDate.getMinutes(),
    second = currentDate.getSeconds(),
    weekArr = ["日", "一", "二", "三", "四", "五", "六"],
    n_day = currentDate.getDay();
  let formattedDateString = `${year}-${month}-${date}-${hour}-${minute}-${second}-${n_day}`,
    timeArr = formattedDateString.match(/\d+/g);
  return templete.replace(/\{(\d+)\}/g, (...arg) => {
    if (arg[1] === "6") {
      return weekArr[timeArr[arg[1]]];
    } else {
      let time = timeArr[arg[1]] || "00";
      return time.length < 2 ? "0" + time : time;
    }
  });
}
// 获取扩展名
function extname(str) {
  let idx = str.lastIndexOf('.'),
    a = '',
    b = '';
  if (idx < 0) {
    a = str
  } else {
    a = str.slice(0, idx)
    b = str.slice(idx + 1)
  }
  return [a, b];
}
//处理返回的结果
function _send(res, options) {
  res.status(200);
  res.type('application/json');
  res.send(Object.assign({
    code: 0,
    codeText: 'OK',
    data: null
  }, options));
}
function _success(res, codeText = "操作成功~", data = null) {
  _send(res, {
    data,
    codeText
  });
}
function _nologin(res) {
  _send(res, {
    code: 2,
    codeText: `当前未登录，请登录后再操作~`
  });
}
function _nothing(res) {
  _send(res, {
    code: 3,
  });
}
function _err(res, codeText = "操作失败，请稍后再试~", data = null) {
  _send(res, {
    code: 1,
    codeText
  });
}
// 定时器
function _setTimeout(callback, time) {
  let timer = setTimeout(() => {
    clearTimeout(timer)
    timer = null;
    callback()
  }, time);
  return timer;
}
//接收文件
function receiveFiles(req, path, filename) {
  return new Promise((resolve, reject) => {
    formidable({
      multiples: true,
      uploadDir: path,//上传路径
      keepExtensions: true,//包含原始文件的扩展名
      maxFileSize: 200 * 1024 * 1024//限制上传文件的大小。
    }).parse(req, function (err, fields, files) {
      if (err) {
        reject();
      } else {
        let newPath = `${path}/${files.attrname.newFilename}`,
          originalPath = `${path}/${filename}`;
        fs.rename(newPath, originalPath, function (err) {
          if (err) {
            reject();
            return
          }
          resolve();
        })
      }
    })
  })
}
// 合并切片
function mergefile(count, from, to) {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(from)) {
      let list = await _readdir(from);
      if (list.length < count) {
        reject()
        return;
      }
      list.sort((a, b) => {
        a = a.split('_')[1];
        b = b.split('_')[1];
        return a - b;
      });
      async function hebing(num) {
        if (num >= list.length) {
          await delDir(from);
          resolve()
          return;
        }
        let a = await _readFile(`${from}/${list[num]}`, true);
        await _appendFile(to, a);
        num++;
        hebing(num);
      }
      hebing(0);
    } else {
      reject()
    }
  })
}
module.exports = {
  writelog,
  _readFile,
  _writeFile,
  _readdir,
  _mkdir,
  _unlink,
  _appendFile,
  delDir,
  newDate,
  extname,
  _send,
  _success,
  _nologin,
  _nothing,
  _err,
  _setTimeout,
  receiveFiles,
  mergefile,
}
