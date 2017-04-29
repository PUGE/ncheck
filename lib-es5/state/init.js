'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var path = require('path');
var globalModulesPath = require('global-modules');
var readPackageJson = require('../in/read-package-json');
var globalPackages = require('../in/get-installed-packages');
var emoji = require('../out/emoji');

function init(currentState, userOptions) {
    return new _promise2.default(function (resolve, reject) {
        _.each(userOptions, function (value, key) {
            return currentState.set(key, value);
        });

        if (currentState.get('global')) {
            currentState.set('cwd', globalModulesPath);
            currentState.set('nodeModulesPath', globalModulesPath);
            currentState.set('globalPackages', globalPackages(globalModulesPath));
        } else {
            var cwd = path.resolve(currentState.get('cwd'));
            var pkg = readPackageJson(path.join(cwd, 'package.json'));
            currentState.set('cwdPackageJson', pkg);
            currentState.set('cwd', cwd);
            currentState.set('nodeModulesPath', path.join(cwd, 'node_modules'));
        }

        emoji.enabled(currentState.get('emoji'));

        if (currentState.get('cwdPackageJson').error) {
            return reject(currentState.get('cwdPackageJson').error);
        }

        return resolve(currentState);
    });
}

module.exports = init;