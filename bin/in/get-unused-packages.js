'use strict';

const depcheck = require('depcheck');
const ora = require('ora');
const _ = require('lodash');

function skipUnused(currentState) {
  return currentState.get('skipUnused') ||        // 跳过检查未使用包
      currentState.get('global') ||               // 检查全局模块
      currentState.get('update') ||               // 仅检查更新
      !currentState.get('cwdPackageJson').name;   // 找不到 package.json
}


function checkUnused(currentState) {
  const spinner = ora(`正在检查未引用的模块.`);
  spinner.enabled = spinner.enabled && currentState.get('spinner');
  spinner.start();

  return new Promise(resolve => {
    // 判断是否检查未使用模块
    if (skipUnused(currentState)) {
      resolve(currentState);
      return;
    }

    const depCheckOptions = {
      ignoreDirs: [ // 忽略检查文件夹
        'sandbox',
        'dist',
        'generated',
        '.generated',
        'build',
        'fixtures',
        'jspm_packages'
      ],
      parsers: { // the target parsers
        '*.js': depcheck.parser.es6,
        '*.jsx': depcheck.parser.jsx
      },
      ignoreMatches: [ // 忽略检查模块
        'gulp-*',
        'grunt-*',
        'karma-*',
        'angular-*',
        'babel-*',
        'metalsmith-*',
        'eslint-plugin-*',
        '@types/*',
        'grunt',
        'mocha',
        'ava'
      ]
    };
    depcheck(currentState.get('cwd'), depCheckOptions, resolve);
  }).then(depCheckResults => {
      spinner.stop();
      const unusedDependencies = [].concat(depCheckResults.dependencies, depCheckResults.devDependencies);
      currentState.set('unusedDependencies', unusedDependencies);

      const cwdPackageJson = currentState.get('cwdPackageJson');

      // currently missing will return devDependencies that aren't really missing
      const missingFromPackageJson = _.omit(depCheckResults.missing || {},
                  Object.keys(cwdPackageJson.dependencies), Object.keys(cwdPackageJson.devDependencies));
      currentState.set('missingFromPackageJson', missingFromPackageJson);
      return currentState;
  });
}

module.exports = checkUnused;
