'use strict';

const chalk = require('chalk');
const _ = require('lodash');
const table = require('text-table');
const stripAnsi = require('strip-ansi');

function uppercaseFirstLetter(str) {
    return str[0].toUpperCase() + str.substr(1);
}

function render(pkg, currentState) {
    const packageName = pkg.moduleName;
    const rows = [];

    const indent = '            ';
    const flags = currentState.get('global') ? '--global' : `--save${pkg.devDependency ? '-dev' : ''}`;
    const upgradeCommand = `npm install ${flags} ${packageName}@${pkg.latest}`;
    const upgradeMessage = `升级命令: ${chalk.green(upgradeCommand)} `;
    const versionMessage = `版本变化: ${pkg.installed} 升级到 ${pkg.latest}`;
    // DYLAN: clean this up
    const status = _([
        pkg.notInstalled ? chalk.bgRed.white.bold(' 模块缺失! ') + ' 没有安装.' : '',
        pkg.notInPackageJson ? chalk.bgRed.white.bold(' 配置错误! ') + ' 没有在package.json里配置. ' + pkg.notInPackageJson : '',
        pkg.pkgError && !pkg.notInstalled ? chalk.bgGreen.white.bold(' 配置错误! ') + ' ' + chalk.red(pkg.pkgError.message) : '',
        pkg.bump && pkg.easyUpgrade ? [
            chalk.bgGreen.white.bold(' 可以升级! ') + ' 此模块有更新的版本. ',
            upgradeMessage,
            indent + versionMessage
        ] : '',
        pkg.bump && !pkg.easyUpgrade ? [
            chalk.white.bold.bgGreen((pkg.bump === 'nonSemver' ? ' new ver! '.toUpperCase() : ' ' + pkg.bump + '升级 ')) + upgradeMessage,
            indent + versionMessage,
        ] : '',
        pkg.unused ? [
            chalk.black.bold.bgWhite(' 没有引用? ') + ` 卸载命令: ${chalk.green(`npm uninstall --save${pkg.devDependency ? '-dev' : ''} ${packageName}`)}`
        ] : '',
        pkg.mismatch && !pkg.bump ? chalk.bgRed.yellow.bold(' MISMATCH ') + ' Installed version does not match package.json. ' + pkg.installed + ' ≠ ' + pkg.packageJson : '',
        pkg.regError ? chalk.bgRed.white.bold(' 模块错误! ') + ' ' + chalk.red(pkg.regError) : ''
    ])
    .flatten()
    .compact()
    .valueOf();

    if (!status.length) {
        return false;
    }

    rows.push(
        [
            chalk.yellow(packageName),
            status.shift()
        ]);

    while (status.length) {
        rows.push([
            ' ',
            status.shift()
        ]);
    }

    rows.push(
        [
            ' '
        ]);

    return rows;
}

function outputConsole(currentState) {
    const packages = currentState.get('packages');

    const rows = packages.reduce((acc, pkg) => {
        return acc.concat(render(pkg, currentState));
    }, [])
    .filter(Boolean);

    if (rows.length) {
        const renderedTable = table(rows, {
            stringLength: s => stripAnsi(s).length
        });

        console.log('');
        console.log(renderedTable);
        console.log('对模块是否引用的判断依据是:');
        console.log(`    1.是否出现 require ('模块名')`);
        console.log(`    2.是否出现 import from '模块名'`);
        console.log(`请在删除模块前手动检查引用情况，因为ncheck无法检查所有引用格式.`);
        console.log(`使用${chalk.green(`ncheck -${currentState.get('global') ? 'g' : ''}u`)} 只检查更新.`);
        process.exitCode = 1;
    } else {
        console.log(`Your modules look ${chalk.bold('amazing')}. Keep up the great work.`);
        process.exitCode = 0;
    }
}

module.exports = outputConsole;
