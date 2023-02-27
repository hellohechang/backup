const fs = require('fs')
const UglifyJS = require("uglify-js")
const CleanCSS = require('clean-css');
const htmlMinify = require('html-minifier').minify;

//过滤目录文件配置
let filterObj = { f: [], d: [] }
// 处理过滤
function handleFilterFile(dirPath, filterFile) {
  let d = [],//过滤目录
    f = [];//过滤文件
  filterFile.forEach(item => {
    let { path, file = [] } = item;
    if (file.length === 0) {
      d.push(`${dirPath}${path}`)
    } else {
      file.forEach(v => {
        f.push(`${dirPath}${path}/${v}`)
      })
    }
  });
  return { f, d }
}
function getAllFile(dirPath) {
  let arr = [],
    { f, d } = filterObj;
  (function next(dirPath) {
    fs.readdirSync(dirPath).forEach(item => {
      let fpath = `${dirPath}/${item}`,
        s = fs.statSync(fpath);
      if (s.isDirectory()) {
        if (!d.includes(fpath)) {
          next(fpath)
        }
      } else {
        if (!f.includes(fpath)) {
          arr.push({
            name: item,
            path: dirPath
          })
        }
      }
    })
  })(dirPath)
  return arr.map(item => {
    return { ...item, path: item.path.replace(dirPath, '') }
  })
}
function toMini(fromPath, toPath, filterArr = []) {
  if (fromPath === toPath.slice(0, fromPath.length)) {
    console.log('SB')
    return
  }
  filterObj = handleFilterFile(fromPath, filterArr)
  _delDir(toPath)
  fs.mkdirSync(toPath, { recursive: true })
  let allFileArr = getAllFile(fromPath);
  allFileArr.forEach((item, idx) => {
    let { name, path } = item,
      ext = extname(name)[1].toLowerCase(),
      fp = `${fromPath}${path}/${name}`,
      tp = `${toPath}${path}/${name}`;
    fs.mkdirSync(`${toPath}${path}`, { recursive: true })
    if (ext === 'html') {
      fs.writeFileSync(tp, _updatehtml(htmlMinify(fs.readFileSync(fp).toString(), {
        minifyCSS: true,// 压缩css
        minifyJS: true,// 压缩js
        collapseWhitespace: true,// 删除html里的空格 达到html的压缩
        removeAttributeQuotes: true,// 尽可能删除html标签里的双引号 达到html的压缩
        removeComments: true, //删除html中的注释
        removeCommentsFromCDATA: true, //从脚本和样式删除的注释
      })))
    } else if (ext === 'css') {
      fs.writeFileSync(tp, (new CleanCSS().minify(fs.readFileSync(fp).toString())).styles)
    } else if (ext === 'js') {
      fs.writeFileSync(tp, UglifyJS.minify(fs.readFileSync(fp).toString()).code)
    } else {
      fs.copyFileSync(fp, tp)
    }
    idx++
    console.log(parseInt(idx / allFileArr.length * 100) + '%');
  })
}
// 获取文件后缀
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
// 删除目录
function _delDir(p) {
  if (fs.existsSync(p)) {
    fs.readdirSync(p).forEach((v) => {
      let path = `${p}/${v}`,
        stats = fs.statSync(path);
      if (stats.isFile()) {
        fs.unlinkSync(path)
      } else {
        _delDir(path)
      }
    })
    fs.rmdirSync(p)
  }
}
function _updatehtml(str) {
  return str.replace(/(\?v\=[\w]+hechang)/g, `?v=${Date.now()}hechang`)
}
module.exports = {
  toMini
}