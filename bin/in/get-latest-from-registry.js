'use strict';

const _ = require('lodash');
const semver = require('semver');
const packageJson = require('../modules/package-json');
const cpuCount = require('os').cpus().length;
const throat = require('throat')(cpuCount);

function getNpmInfo(packageName) {
  return throat(() => packageJson(packageName))
    .then(rawData => {
        const CRAZY_HIGH_SEMVER = '8000.0.0';
        
        const sortedVersions = _(rawData.versions)
            .keys()
            .remove(_.partial(semver.gt, CRAZY_HIGH_SEMVER))
            .sort(semver.compare)
            .valueOf();
        // 最大版本号
        const latest = rawData.version
        return {
            latest: latest,
            versions: sortedVersions
        };
    }).catch(err => {
        const errorMessage = `Registry error ${err.message}`;
        return {
            error: errorMessage
        };
    });
}

module.exports = getNpmInfo;
