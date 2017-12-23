'use strict';

const _ = require('lodash');
const inquirer = require('inquirer');
const chalk = require('chalk');
const table = require('text-table');
const installPackages = require('./install-packages');
const stripAnsi = require('strip-ansi');

const UI_GROUPS = [
    {
        title: chalk.bold.underline.green('更新package.json匹配安装版.'),
        filter: {mismatch: true, bump: null}
    },
    {
        title: `${chalk.bold.underline.green('模块丢失')} ${chalk.green('你可能没有安装这些模块')}`,
        filter: {notInstalled: true, bump: null}
    },
    {
        title: `${chalk.bold.underline.green('补丁更新')} ${chalk.green('向后兼容 - 修复已知BUG')}`,
        filter: {bump: 'patch'}
    },
    {
        title: `${chalk.yellow.underline.bold('小型更新')} ${chalk.yellow('向后兼容 - 增加新的功能')}`,
        bgColor: 'yellow',
        filter: {bump: 'minor'}
    },
    {
        title: `${chalk.red.underline.bold('重要更新')} ${chalk.red('谨慎更新 - API有可能发生了改变!')}`,
        filter: {bump: 'major'}
    },
    {
        title: `${chalk.magenta.underline.bold('非正式版')} ${chalk.magenta('谨慎更新 - 版本低于1.0.0')}`,
        filter: {bump: 'nonSemver'}
    }
];

function label(pkg) {
    const bumpInstalled = pkg.bump ? pkg.installed : '';
    const installed = pkg.mismatch ? pkg.packageJson : bumpInstalled;
    const name = chalk.yellow(pkg.moduleName);
    const type = pkg.devDependency ? chalk.green(' devDep') : '';
    const missing = pkg.notInstalled ? chalk.red(' missing') : '';
    return [
        name + type + missing,
        installed,
        installed && '❯',
        chalk.bold(pkg.latest || '')
    ];
}

function short(pkg) {
    return `${pkg.moduleName}@${pkg.latest}`;
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
    const filteredChoices = _.filter(packages, options.filter);

    const choices = filteredChoices.map(choice)
        .filter(Boolean);

    const choicesAsATable = table(_.map(choices, 'name'), {
        align: ['l', 'l', 'l'],
        stringLength: function (str) {
            return stripAnsi(str).length;
        }
    }).split('\n');

    const choicesWithTableFormating = _.map(choices, (choice, i) => {
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
    const packages = currentState.get('packages');

    const choicesGrouped = UI_GROUPS.map(group => createChoices(packages, group))
        .filter(Boolean);

    const choices = _.flatten(choicesGrouped);

    if (!choices.length) {
        console.log(`owo这个项目所引用的模块都是最新的！`);
        return;
    }

    choices.push(unselectable());
    choices.push(unselectable({title: '空格(Space)勾选. 回车(Enter)开始更新. Control-C放弃操作.'}));

    const questions = [
      {
        name: 'packages',
        message: '勾选需要更新的模块.',
        type: 'checkbox',
        choices: choices.concat(unselectable()),
        pageSize: process.stdout.rows - 2
      }
    ];
    return inquirer.prompt(questions).then(answers => {
        const packagesToUpdate = answers.packages;
        
        if (!packagesToUpdate || !packagesToUpdate.length) {
            console.log('没有选中需要更新的项目.');
            return false;
        }

        const saveDependencies = packagesToUpdate
            .filter(pkg => !pkg.devDependency)
            .map(pkg => pkg.moduleName + '@' + pkg.latest);

        const saveDevDependencies = packagesToUpdate
            .filter(pkg => pkg.devDependency)
            .map(pkg => pkg.moduleName + '@' + pkg.latest);

        const updatedPackages = packagesToUpdate
            .map(pkg => pkg.moduleName + '@' + pkg.latest).join(', ');

        if (!currentState.get('global')) {
            if (saveDependencies.length) {
                saveDependencies.unshift('--save');
            }

            if (saveDevDependencies.length) {
                saveDevDependencies.unshift('--save-dev');
            }
        }

        return installPackages(saveDependencies, currentState)
            .then(currentState => installPackages(saveDevDependencies, currentState))
            .then(currentState => {
                console.log('');
                console.log(chalk.green(`[ncheck] 更新完成!`));
                console.log(chalk.green('[ncheck] ' + updatedPackages));
                console.log(chalk.green(`[ncheck] 建议你再次检查模块版本确保模块已经正常安装完毕.`));
                return currentState;
            });
    });
}

module.exports = interactive;
