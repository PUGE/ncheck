'use strict';

const chalk = require('chalk');
const execa = require('execa');
const inquirer = require('inquirer')
const ora = require('ora');

function install(packages, currentState) {
  if (!packages.length) {
    return Promise.resolve(currentState);
  }

  const installGlobal = currentState.get('global') ? '--global' : null;
  const saveExact = currentState.get('saveExact') ? '--save-exact' : null;
  let npmArgs = null

  const questions = [
    {
      name: 'source',
      message: '选择更新方式.',
      type: 'list',
      choices: ['npm', 'yarn']
    }
  ]

  inquirer.prompt(questions).then(answers => {
    // 待优化
    if (answers.source === 'npm') {
      npmArgs = ['install']
        .concat(installGlobal)
        .concat(saveExact)
        .concat(packages)
        .filter(Boolean);
    } else {
      npmArgs = ['add']
        .concat(installGlobal)
        .concat(packages[1])
        .filter(Boolean);
    }

    console.log('')
    console.log(`$ ${chalk.green(answers.source)} ${chalk.green(npmArgs.join(' '))}`);
    const spinner = ora(`正在通过 ${chalk.green(answers.source)} 安装更新包!`);
    spinner.enabled = spinner.enabled && currentState.get('spinner');
    spinner.start();

    return execa(answers.source, npmArgs, {cwd: currentState.get('cwd')}).then(output => {
        spinner.stop();
        console.log(output.stdout);
        console.log(output.stderr);

        return currentState;
    }).catch(err => {
        spinner.stop();
        throw err;
    });
  })
}

module.exports = install;
