'use strict';
const init = require('./init');

// 默认设置
const defaultOptions = {
  global: false,
  cwd: process.cwd(),
  nodeModulesPath: false,
  unused: false,
  forceColor: false,
  saveExact: false,
  spinner: false,
  ignore: [],
  globalPackages: {},
  cwdPackageJson: {devDependencies: {}, dependencies: {}},
  packages: false,
  unusedDependencies: false
};

function state(userOptions) {
  const currentStateObject = defaultOptions;
  // 从配置中取出指定配置项
  function get(key) {
    // 检查指定项是否存在
    if (!currentStateObject.hasOwnProperty(key)) {
      throw new Error(`无法获取配置项 [${key}] ,因为配置项不存在！`);
    }
    return currentStateObject[key];
  }
  // 设置指定配置项
  function set(key, value) {
    // 检查指定项是否存在
    if (currentStateObject.hasOwnProperty(key)) {
      // 用新值代替指定键值
      currentStateObject[key] = value;
    } else {
      throw new Error(`无法设置配置项 [${key}] ,因为配置项不存在！`);
    }
  }

  const currentState = {
    get: get,
    set: set
  };

  return init(currentState, userOptions);
}
module.exports = state;
