'use strict';
const _ = require('lodash');
const path = require('path');
const readPackageJson = require('../in/read-package-json');
const globalPackages = require('../in/get-installed-packages');
const fs = require('fs');
const chalk = require('chalk');
function init(currentState, userOptions) {
    return new Promise((resolve, reject) => {
        _.each(userOptions, (value, key) => currentState.set(key, value));

        if (currentState.get('global')) { // 判断是否为检查全局模式
            let NODE_PATH = ''
            if (process.env.NODE_PATH) {
              if (process.env.NODE_PATH.indexOf(path.delimiter) !== -1) {
                modulesPath = process.env.NODE_PATH.split(path.delimiter)[0];
                console.log(chalk.yellow('警告: 存在多个NODE_PATH目录,程序默认只检查第一个!'));
              } else {
                modulesPath = process.env.NODE_PATH;
              }
            }
            if (!fs.existsSync(NODE_PATH)) {
              throw new Error('NODE_PATH目录不正确,请检查环境变量!');
            }
            currentState.set('cwd', globalModulesPath);
            currentState.set('nodeModulesPath', globalModulesPath);
            currentState.set('globalPackages', globalPackages(NODE_PATH))
        } else {
            const cwd = path.resolve(currentState.get('cwd'));
            const pkg = readPackageJson(path.join(cwd, 'package.json'));
            currentState.set('cwdPackageJson', pkg);
            currentState.set('cwd', cwd);
            currentState.set('nodeModulesPath', path.join(cwd, 'node_modules'));
        }
        if (currentState.get('cwdPackageJson').error) {
            return reject(currentState.get('cwdPackageJson').error);
        }

        return resolve(currentState);
    });
}

module.exports = init;
