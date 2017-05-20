'use strict';

var chalk = require('chalk');
var _ = require('lodash');
var table = require('text-table');
var emoji = require('./emoji');

function uppercaseFirstLetter(str) {
    return str[0].toUpperCase() + str.substr(1);
}

function render(pkg, currentState) {
    var packageName = pkg.moduleName;
    var rows = [];

    var indent = '            ';
    var flags = currentState.get('global') ? '--global' : '--save' + (pkg.devDependency ? '-dev' : '');
    var upgradeCommand = 'npm install ' + flags + ' ' + packageName + '@' + pkg.latest;
    var upgradeMessage = '\u5347\u7EA7\u547D\u4EE4: ' + chalk.green(upgradeCommand) + ' ';
    var versionMessage = '\u7248\u672C\u53D8\u5316: ' + pkg.installed + ' \u5347\u7EA7\u5230 ' + pkg.latest;
    // DYLAN: clean this up
    var status = _([pkg.notInstalled ? chalk.bgRed.white.bold(' 模块缺失! ') + ' 没有安装.' : '', pkg.notInPackageJson ? chalk.bgRed.white.bold(' 配置错误! ') + ' 没有在package.json里配置. ' + pkg.notInPackageJson : '', pkg.pkgError && !pkg.notInstalled ? chalk.bgGreen.white.bold(' 配置错误! ') + ' ' + chalk.red(pkg.pkgError.message) : '', pkg.bump && pkg.easyUpgrade ? [chalk.bgGreen.white.bold(' 可以升级! ') + ' 此模块有更新的版本. ' + chalk.blue.underline(pkg.homepage || ''), indent + upgradeMessage, indent + versionMessage] : '', pkg.bump && !pkg.easyUpgrade ? [chalk.white.bold.bgGreen(pkg.bump === 'nonSemver' ? emoji(' :sunglasses: ') + ' new ver! '.toUpperCase() : ' ' + pkg.bump + '升级 ') + ' 项目地址:' + chalk.blue.underline(pkg.homepage || ''), indent + upgradeMessage, indent + versionMessage] : '', pkg.unused ? [chalk.black.bold.bgWhite(' 没有引用? ') + (' \u5378\u8F7D\u547D\u4EE4: ' + chalk.green('npm uninstall --save' + (pkg.devDependency ? '-dev' : '') + ' ' + packageName))] : '', pkg.mismatch && !pkg.bump ? chalk.bgRed.yellow.bold(emoji(' :interrobang: ') + ' MISMATCH ') + ' Installed version does not match package.json. ' + pkg.installed + ' ≠ ' + pkg.packageJson : '', pkg.regError ? chalk.bgRed.white.bold(emoji(' :no_entry: ') + ' NPM ERR! ') + ' ' + chalk.red(pkg.regError) : '']).flatten().compact().valueOf();

    if (!status.length) {
        return false;
    }

    rows.push([chalk.yellow(packageName), status.shift()]);

    while (status.length) {
        rows.push([' ', status.shift()]);
    }

    rows.push([' ']);

    return rows;
}

function outputConsole(currentState) {
    var packages = currentState.get('packages');

    var rows = packages.reduce(function (acc, pkg) {
        return acc.concat(render(pkg, currentState));
    }, []).filter(Boolean);

    if (rows.length) {
        var renderedTable = table(rows, {
            stringLength: function stringLength(s) {
                return chalk.stripColor(s).length;
            }
        });

        console.log('');
        console.log(renderedTable);
        console.log('对模块是否引用的判断依据是:');
        console.log('    1.\u662F\u5426\u51FA\u73B0 require (\'\u6A21\u5757\u540D\')');
        console.log('    2.\u662F\u5426\u51FA\u73B0 import from \'\u6A21\u5757\u540D\'');
        console.log('\u8BF7\u5728\u5220\u9664\u6A21\u5757\u524D\u624B\u52A8\u68C0\u67E5\u5F15\u7528\u60C5\u51B5\uFF0C\u56E0\u4E3Ancheck\u65E0\u6CD5\u68C0\u67E5\u6240\u6709\u5F15\u7528\u683C\u5F0F.');
        console.log('\u4F7F\u7528' + chalk.green('ncheck -' + (currentState.get('global') ? 'g' : '') + 'u') + ' \u53EA\u68C0\u67E5\u66F4\u65B0.');
        process.exitCode = 1;
    } else {
        console.log(emoji(':heart:  ') + 'Your modules look ' + chalk.bold('amazing') + '. Keep up the great work.' + emoji(' :heart:'));
        process.exitCode = 0;
    }
}

module.exports = outputConsole;