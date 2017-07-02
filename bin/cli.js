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
          -u, --update          只检查更新.
          -g, --global          检查全局模块.
          -s, --skip-unused     跳过检查未使用的模块.
          -p, --production      跳过检查开发版本.
          -i, --ignore          Ignore dependencies based on succeeding glob.
          -E, --save-exact      在package.json中使用精确版本(x.y.z)而不是(^x.y.z).
          --specials            包括检查未使用的依赖关系的depcheck特殊列表。
          --no-color            禁用彩色文字.
          --no-emoji            禁用emoji表情.
          --debug               调试输出模式.

        示例
          $ ncheck           # 检查当前文件夹项目有哪些模块可以更新或者优化
          $ ncheck ../foo    # 检查上层目录中的foo文件夹.
          $ ncheck -gu       # 检查全局模块，并且只检查更新.
    `},
    {
        alias: {
            u: 'update',
            g: 'global',
            s: 'skip-unused',
            p: 'production',
            E: 'save-exact',
            i: 'ignore'
        },
        default: {
            dir: pkgDir.sync() || process.cwd(),
            emoji: !isCI,
            spinner: !isCI
        },
        boolean: [
            'update',
            'global',
            'skip-unused',
            'production',
            'save-exact',
            'color',
            'emoji',
            'spinner'
        ],
        string: [
            'ignore',
            'specials'
        ]
    });

const options = {
    cwd: cli.input[0] || cli.flags.dir,
    update: cli.flags.update,
    global: cli.flags.global,
    skipUnused: cli.flags.skipUnused,
    ignoreDev: cli.flags.production,
    saveExact: cli.flags.saveExact,
    specials: cli.flags.specials,
    emoji: cli.flags.emoji,
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
        currentState.inspectIfDebugMode();

        if (options.update) {
            return interactiveUpdate(currentState);
        }

        return staticOutput(currentState);
    })
    .catch(err => {
        console.log(err.message);
        if (options.debug) {
            console.log(err);
        } else {
            console.log('For more detail, add `--debug` to the command');
        }
        process.exit(1);
    });
