'use strict'

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



module.exports = createPackageSummary
