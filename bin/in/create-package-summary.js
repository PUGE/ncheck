'use strict';

const readPackageJson = require('./read-package-json');
const getLatestFromRegistry = require('./get-latest-from-registry');
const _ = require('lodash');
// 识别更新重要程度
const semverDiff = require('semver-diff');
// 检查目录是否存在
const pathExists = require('path-exists');
const path = require('path');
const semver = require('semver');
const minimatch = require('minimatch');

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
    const ignoreMatch = Array.isArray(ignore) ? ignore.some(ignoredModule => minimatch(moduleName, ignoredModule)) : minimatch(moduleName, ignore);
    if (ignoreMatch) {
      return false;
    }
  }
  // 未使用模块列表
  const unusedDependencies = currentState.get('unusedDependencies')
  // 缺失模块列表
  const missingFromPackageJson = currentState.get('missingFromPackageJson')

    function foundIn(files) {
      if (!files) return

      return 'Found in: ' + files.map(filepath => filepath.replace(currentState.get('cwd'), ''))
          .join(', ');
    }

    return getLatestFromRegistry(moduleName)
        .then(fromRegistry => {
          // 已安装模版版本号
          const installedVersion = modulePackageJson.version;

          const latest = installedVersion && fromRegistry.latest && fromRegistry.next && semver.gt(installedVersion, fromRegistry.latest) ? fromRegistry.next : fromRegistry.latest
          const versions = fromRegistry.versions || []
          console.log(latest, versions)
            const versionWanted = semver.maxSatisfying(versions, packageJsonVersion);

            const versionToUse = installedVersion || versionWanted;
            const usingNonSemver = semver.valid(latest) && semver.lt(latest, '1.0.0-pre');

            const bump = semver.valid(latest) &&
                        semver.valid(versionToUse) &&
                        (usingNonSemver && semverDiff(versionToUse, latest) ? 'nonSemver' : semverDiff(versionToUse, latest));

            const unused = _.includes(unusedDependencies, moduleName);

            return {
                // info
                moduleName: moduleName,
                homepage: fromRegistry.homepage,
                regError: fromRegistry.error,
                pkgError: modulePackageJson.error,

                // versions
                latest: latest,
                installed: versionToUse,
                isInstalled: packageIsInstalled,
                notInstalled: !packageIsInstalled,
                packageWanted: versionWanted,
                packageJson: packageJsonVersion,

                // Missing from package json
                notInPackageJson: foundIn(missingFromPackageJson[moduleName]),

                // meta
                devDependency: _.has(cwdPackageJson.devDependencies, moduleName),
                usedInScripts: _.findKey(cwdPackageJson.scripts, script => {
                    return script.indexOf(moduleName) !== -1;
                }),
                mismatch: semver.validRange(packageJsonVersion) &&
                    semver.valid(versionToUse) &&
                    !semver.satisfies(versionToUse, packageJsonVersion),
                semverValid:
                    semver.valid(versionToUse),
                easyUpgrade: semver.validRange(packageJsonVersion) &&
                    semver.valid(versionToUse) &&
                    semver.satisfies(latest, packageJsonVersion) &&
                    bump !== 'major',
                bump: bump,

                unused: unused
            };
        });
}

module.exports = createPackageSummary;
