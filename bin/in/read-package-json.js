'use strict';

const merge = require('merge-options');

function readPackageJson(filename) {
    let pkg;
    let error;
    try {
        pkg = require(filename);
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            error = new Error(`${filename}中找到了package.json文件`);
        } else {
            error = new Error(`目录 ${filename}中找到了package.json文件，但它的格式有错误!`);
        }
    }
    return merge(pkg, {devDependencies: {}, dependencies: {}, error: error});
}

module.exports = readPackageJson;
