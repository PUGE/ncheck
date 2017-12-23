#!/usr/bin/env node
'use strict';

const meow = require('meow');
const isCI = require('is-ci');
const pkg = require('../package.json');
const nCheck = require('./index');
const staticOutput = require('./out/static-output');
const interactiveUpdate = require('./out/interactive-update');
const pkgDir = require('pkg-dir');

const helpText = `
使用方法:
  $ ncheck <path> <options>

Path
  检查哪个目录. 默认为当前目录. 使用 -g 检查全局模块.

Options
  -g, --global          检查全局模块.
  -s, --skip-unused     跳过检查未使用的模块.
  -p, --production      跳过检查开发版本.
  -E, --save-exact      在package.json中使用精确版本(x.y.z)而不是(^x.y.z).

示例
  $ ncheck           # 检查当前文件夹项目有哪些模块可以更新或者优化
  $ ncheck ../foo    # 检查上层目录中的foo文件夹.
  $ ncheck -gu       # 检查全局模块，并且只检查更新.
`
const meowConfig = {
  flags: {
    unused: {
      type: 'boolean',
      alias: 'u'
    },
    global: {
      type: 'boolean',
      alias: 'g'
    },
    production: {
      type: 'boolean',
      alias: 'p'
    },
    saveExact: {
      type: 'boolean',
      alias: 's'
    },
    ignore: {
      type: 'boolean',
      alias: 'i'
    },
    yarn: {
      type: 'boolean',
      alias: 'y'
    }
  }
}
const cli = meow(helpText, meowConfig);

const options = {
  cwd: pkgDir.sync() || process.cwd(),
  global: cli.flags.global,
  unused: cli.flags.unused,
  saveExact: cli.flags.saveExact,
  installer: cli.flags.yarn ? 'yarn' : 'npm',
  spinner: !isCI,
  ignore: cli.flags.ignore
};


nCheck(options)
  .then(currentState => {
    // 判断是否为只检查更新模式
    // 待优化
    if (options.unused || options.global) {
      return staticOutput(currentState);
    }
    return interactiveUpdate(currentState);
  })
  .catch(err => {
      console.log(err.message);
      process.exit(1);
  });
