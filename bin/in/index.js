'use strict';
const co = require('co');
const merge = require('merge-options');
const ora = require('ora');
const getUnusedPackages = require('./get-unused-packages');

const readPackageJson = require('./read-package-json')
const getLatestFromRegistry = require('./get-latest-from-registry')
const _ = require('lodash')
// 识别更新重要程度
const semverDiff = require('semver-diff')
// 检查目录是否存在
const pathExists = require('path-exists')
const path = require('path')
const semver = require('semver')
const minimatch = require('minimatch')

let sum = 0
let spinner = null
let modulesNum = 0

function createPackageSummary(moduleName, currentState) {
  const cwdPackageJson = currentState.get('cwdPackageJson')
  // 模块目录
  const modulePath = path.join(currentState.get('nodeModulesPath'), moduleName)
  // 检查模块是否安装
  const packageIsInstalled = pathExists.sync(modulePath)
  // 读取模块package
  const modulePackageJson = readPackageJson(path.join(modulePath, 'package.json'))
  // 判断是否为私有模块
  const isPrivate = Boolean(modulePackageJson.private)
  if (isPrivate) return false

  // 获取模块版本号
  const packageJsonVersion = cwdPackageJson.dependencies[moduleName] ||
          cwdPackageJson.devDependencies[moduleName] ||
          currentState.get('globalPackages')[moduleName]
  // 判断无用版本号
  if (packageJsonVersion && !semver.validRange(packageJsonVersion)) {
    return false
  }

    // 判断忽略模块
  const ignore = currentState.get('ignore')
  if (ignore) {
    const ignoreMatch = Array.isArray(ignore) ? ignore.some(ignoredModule => minimatch(moduleName, ignoredModule)) : minimatch(moduleName, ignore)
    if (ignoreMatch) {
      return false
    }
  }
  // 未使用模块列表
  const unusedDependencies = currentState.get('unusedDependencies')
  // 缺失模块列表
  const missingFromPackageJson = currentState.get('missingFromPackageJson')

  function foundIn(files) {
    if (!files) return

    return 'Found in: ' + files.map(filepath => filepath.replace(currentState.get('cwd'), ''))
        .join(', ')
  }
  
  return getLatestFromRegistry(moduleName)
    .then(fromRegistry => {
      // console.log(fromRegistry)
      // 已安装模版版本号
      const installedVersion = modulePackageJson.version
      // 最新的版本号
      const latest = fromRegistry.latest
      // 判断模块版本是否小于1.0.0-pre(是不是预览版)
      const usingNonSemver = semver.valid(latest) && semver.lt(latest, '1.0.0-pre')
      // 识别更新重要度
      const bump = semver.valid(latest) &&
                  semver.valid(installedVersion) &&
                  (usingNonSemver && semverDiff(installedVersion, latest) ? 'nonSemver' : semverDiff(installedVersion, latest))
      // 未使用模块列表
      const unused = _.includes(unusedDependencies, moduleName)
      spinner.text = `正在检查模块版本[${++sum}/${modulesNum}].`
      return {
        // info
        moduleName: moduleName,
        regError: fromRegistry.error,
        pkgError: modulePackageJson.error,

        // versions
        latest: latest,
        installed: installedVersion,
        isInstalled: packageIsInstalled,
        notInstalled: !packageIsInstalled,
        packageJson: packageJsonVersion,

        // Missing from package json
        notInPackageJson: foundIn(missingFromPackageJson[moduleName]),

        // meta
        devDependency: _.has(cwdPackageJson.devDependencies, moduleName),
        usedInScripts: _.findKey(cwdPackageJson.scripts, script => {
            return script.indexOf(moduleName) !== -1
        }),
        mismatch: semver.validRange(packageJsonVersion) &&
            semver.valid(installedVersion) &&
            !semver.satisfies(installedVersion, packageJsonVersion),
        semverValid:
            semver.valid(installedVersion),
        easyUpgrade: semver.validRange(packageJsonVersion) &&
            semver.valid(installedVersion) &&
            semver.satisfies(latest, packageJsonVersion) &&
            bump !== 'major',
        bump: bump,

        unused: unused
      }
    })
}


module.exports = function (currentState) {
  return co(function *() {
    yield getUnusedPackages(currentState);
    // 显示正在检查动画
    spinner = ora(`正在检查模块版本.`);
    spinner.enabled = spinner.enabled && currentState.get('spinner');
    spinner.start();

    const cwdPackageJson = currentState.get('cwdPackageJson');
    // 获取依赖包信息
    function dependencies(pkg) {
      if (currentState.get('global')) {
        return currentState.get('globalPackages');
      }

      if (currentState.get('ignoreDev')) {
        return pkg.dependencies;
      }

      return merge(pkg.dependencies, pkg.devDependencies);
    }

    const allDependencies = dependencies(cwdPackageJson);
    
    const allDependenciesIncludingMissing = Object.keys(merge(allDependencies, currentState.get('missingFromPackageJson')));
    modulesNum = allDependenciesIncludingMissing.length
    spinner.text = `正在检查模块版本[0/${modulesNum}].`
    const arrayOfPackageInfo = yield allDependenciesIncludingMissing
      .map(moduleName => createPackageSummary(moduleName, currentState))
      .filter(Boolean);
    currentState.set('packages', arrayOfPackageInfo);
    // 清空计数器
    sum = 0
    spinner.stop();
    return currentState;
  });
};
