'use strict';
const fs = require("fs") 
const ora = require('ora')

function checkUnused(currentState, allDependenciesList) {
  // 判断是否需要检查未引用模块
  if (!currentState.get('unused')) {
    return
  }
  // 排除模块
  const exclude = ['node_modules', 'dist']
  const spinner = ora(`正在检查未引用的模块.`);
  spinner.enabled = spinner.enabled && currentState.get('spinner');
  spinner.start();

  let fileList = []
  // 遍历工程目录 寻找文件
  function readDir(path){
    const menu = fs.readdirSync(path)
    if(!menu) return
    menu.forEach((ele) => {
      // 排除目录
      if (exclude.indexOf(ele) < 0 && ele[0] !== '.'){
        const info = fs.statSync(`${path}/${ele}`)
        if(info.isDirectory()) {
          readDir(`${path}/${ele}`)
        } else {
          // 判断后缀是否符合要求
          if (ele.endsWith('.vue') || ele.endsWith('.js')) {
            fileList.push(`${path}/${ele}`)
          }
        }
      }
    })
  }
  readDir(currentState.get('cwd'))

  let output = {}
  // 待优化
  allDependenciesList.forEach((element) => {
    output[element] = []
  }, this)

  fileList.forEach((element) => {
    if (allDependenciesList.length > 0) {
      const data = fs.readFileSync(element, 'utf-8')
      for (let index in allDependenciesList) {
        const modelName = allDependenciesList[index]
        if (data.indexOf(`"${modelName}"`) >=0 || data.indexOf(`'${modelName}'`) >=0) {
          output[modelName].push(element)
        }
      }
    }
  }, this)
  spinner.stop();
  currentState.set('unusedDependencies', output);
  return
}

module.exports = checkUnused;
