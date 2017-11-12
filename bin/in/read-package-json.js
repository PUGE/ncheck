'use strict';

const merge = require('merge-options');

function readPackageJson(filename) {
    let pkg;
    let error;
    try {
        pkg = require(filename);
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            error = new Error(`当前目录不包含package.json文件!`);
        } else {
            error = new Error(`${filename}的格式有错误!`);
        }
    }
    return merge(pkg, {devDependencies: {}, dependencies: {}, error: error});
}

module.exports = readPackageJson;
