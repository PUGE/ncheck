'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var inquirer = require('inquirer');
var chalk = require('chalk');
var table = require('text-table');
var installPackages = require('./install-packages');
var emoji = require('./emoji');

var UI_GROUPS = [{
    title: chalk.bold.underline.green('Update package.json to match version installed.'),
    filter: { mismatch: true, bump: null }
}, {
    title: chalk.bold.underline.green('没有找到.') + ' ' + chalk.green('你可能想要获取这些.'),
    filter: { notInstalled: true, bump: null }
}, {
    title: chalk.bold.underline.green('补丁更新') + ' ' + chalk.green('向后兼容 - 修复已知BUG'),
    filter: { bump: 'patch' }
}, {
    title: chalk.yellow.underline.bold('小型更新') + ' ' + chalk.yellow('向后兼容 - 增加新的功能'),
    bgColor: 'yellow',
    filter: { bump: 'minor' }
}, {
    title: chalk.red.underline.bold('重要更新') + ' ' + chalk.red('谨慎更新 - API有可能发生了改变!'),
    filter: { bump: 'major' }
}, {
    title: chalk.magenta.underline.bold('非正式版') + ' ' + chalk.magenta('谨慎更新 - 版本低于1.0.0'),
    filter: { bump: 'nonSemver' }
}];

function label(pkg) {
    var bumpInstalled = pkg.bump ? pkg.installed : '';
    var installed = pkg.mismatch ? pkg.packageJson : bumpInstalled;
    var name = chalk.yellow(pkg.moduleName);
    var type = pkg.devDependency ? chalk.green(' devDep') : '';
    var missing = pkg.notInstalled ? chalk.red(' missing') : '';
    var homepage = pkg.homepage ? chalk.blue.underline(pkg.homepage) : '';
    return [name + type + missing, installed, installed && '❯', chalk.bold(pkg.latest || ''), pkg.latest ? homepage : pkg.regError || pkg.pkgError];
}

function short(pkg) {
    return pkg.moduleName + '@' + pkg.latest;
}

function choice(pkg) {
    if (!pkg.mismatch && !pkg.bump && !pkg.notInstalled) {
        return false;
    }

    return {
        value: pkg,
        name: label(pkg),
        short: short(pkg)
    };
}

function unselectable(options) {
    return new inquirer.Separator(chalk.reset(options ? options.title : ' '));
}

function createChoices(packages, options) {
    var filteredChoices = _.filter(packages, options.filter);

    var choices = filteredChoices.map(choice).filter(Boolean);

    var choicesAsATable = table(_.map(choices, 'name'), {
        align: ['l', 'l', 'l'],
        stringLength: function stringLength(str) {
            return chalk.stripColor(str).length;
        }
    }).split('\n');

    var choicesWithTableFormating = _.map(choices, function (choice, i) {
        choice.name = choicesAsATable[i];
        return choice;
    });

    if (choicesWithTableFormating.length) {
        choices.unshift(unselectable(options));
        choices.unshift(unselectable());
        return choices;
    }
}

function interactive(currentState) {
    var packages = currentState.get('packages');

    if (currentState.get('debug')) {
        console.log('packages', packages);
    }

    var choicesGrouped = UI_GROUPS.map(function (group) {
        return createChoices(packages, group);
    }).filter(Boolean);

    var choices = _.flatten(choicesGrouped);

    if (!choices.length) {
        console.log(emoji(':heart:  ') + '\u8FD9\u4E2A\u9879\u76EE\u6240\u5F15\u7528\u7684\u6A21\u5757\u90FD\u662F\u6700\u65B0\u7684\uFF01');
        return;
    }

    choices.push(unselectable());
    choices.push(unselectable({ title: '空格(Space)勾选. 回车(Enter)开始更新. Control-C放弃操作.' }));

    var questions = [{
        name: 'packages',
        message: '勾选需要更新的模块.',
        type: 'checkbox',
        choices: choices.concat(unselectable()),
        pageSize: process.stdout.rows - 2
    }];

    return new _promise2.default(function (resolve) {
        return inquirer.prompt(questions, resolve);
    }).then(function (answers) {
        var packagesToUpdate = answers.packages;

        if (!packagesToUpdate || !packagesToUpdate.length) {
            console.log('没有选中需要更新的项目.');
            return false;
        }

        var saveDependencies = packagesToUpdate.filter(function (pkg) {
            return !pkg.devDependency;
        }).map(function (pkg) {
            return pkg.moduleName + '@' + pkg.latest;
        });

        var saveDevDependencies = packagesToUpdate.filter(function (pkg) {
            return pkg.devDependency;
        }).map(function (pkg) {
            return pkg.moduleName + '@' + pkg.latest;
        });

        var updatedPackages = packagesToUpdate.map(function (pkg) {
            return pkg.moduleName + '@' + pkg.latest;
        }).join(', ');

        if (!currentState.get('global')) {
            if (saveDependencies.length) {
                saveDependencies.unshift('--save');
            }

            if (saveDevDependencies.length) {
                saveDevDependencies.unshift('--save-dev');
            }
        }

        return installPackages(saveDependencies, currentState).then(function (currentState) {
            return installPackages(saveDevDependencies, currentState);
        }).then(function (currentState) {
            console.log('');
            console.log(chalk.green('[ncheck] \u66F4\u65B0\u5B8C\u6210!'));
            console.log(chalk.green('[ncheck] ' + updatedPackages));
            console.log(chalk.green('[ncheck] \u5EFA\u8BAE\u4F60\u518D\u6B21\u68C0\u67E5\u6A21\u5757\u7248\u672C\u786E\u4FDD\u6A21\u5757\u5DF2\u7ECF\u6B63\u5E38\u5B89\u88C5\u5B8C\u6BD5.'));
            return currentState;
        });
    });
}

module.exports = interactive;