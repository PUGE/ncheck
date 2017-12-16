#!/usr/bin/env node
'use strict';

const meow = require('meow');
const isCI = require('is-ci');
const pkg = require('../package.json');
const nCheck = require('./index');
const staticOutput = require('./out/static-output');
const interactiveUpdate = require('./out/interactive-update');
const debug = require('./state/debug');
const pkgDir = require('pkg-dir');

const cli = meow({
  help: `
    使用方法:
      $ ncheck <path> <options>

    Path
      检查哪个目录. 默认为当前目录. 使用 -g 检查全局模块.

    Options
      -g, --global          检查全局模块.
      -s, --skip-unused     跳过检查未使用的模块.
      -p, --production      跳过检查开发版本.
      -E, --save-exact      在package.json中使用精确版本(x.y.z)而不是(^x.y.z).
      --debug               调试输出模式.

    示例
      $ ncheck           # 检查当前文件夹项目有哪些模块可以更新或者优化
      $ ncheck ../foo    # 检查上层目录中的foo文件夹.
      $ ncheck -gu       # 检查全局模块，并且只检查更新.
  `},
  {
    alias: {
      u: 'unused',
      g: 'global',
      p: 'production',
      E: 'save-exact',
      i: 'ignore'
    },
    default: {
      dir: pkgDir.sync() || process.cwd(),
      spinner: !isCI
    },
    boolean: [
      'unused',
      'global',
      'production',
      'save-exact',
      'spinner'
    ],
    string: [
      'ignore'
    ]
  });

const options = {
  cwd: cli.input[0] || cli.flags.dir,
  global: cli.flags.global,
  unused: cli.flags.unused,
  saveExact: cli.flags.saveExact,
  installer: process.env.NPM_CHECK_INSTALLER || 'npm',
  debug: cli.flags.debug,
  spinner: cli.flags.spinner,
  ignore: cli.flags.ignore
};

if (options.debug) {
  debug('cli.flags', cli.flags);
  debug('cli.input', cli.input);
}

// 
nCheck(options)
  .then(currentState => {
    // 判断是否为只检查更新模式
    // 待优化
    if (options.unused || options.global || options.saveExact || options.installer || options.debug || options.spinner || options.ignore) {
      return staticOutput(currentState);
    }
    return interactiveUpdate(currentState);
  })
  .catch(err => {
      console.log(err.message);
      if (options.debug) {
        console.log(err);
      } else {
        console.log('使用 `--debug` 命令显示更多细节');
      }
      process.exit(1);
  });
