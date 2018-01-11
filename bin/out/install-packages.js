'use strict';

const chalk = require('chalk');
const execa = require('execa');
const ora = require('ora');

function install(packages, currentState, source) {
  if (!packages.length) {
    return Promise.resolve(currentState);
  }

  const installGlobal = currentState.get('global') ? '--global' : null;
  const saveExact = currentState.get('saveExact') ? '--save-exact' : null;
  let npmArgs = null

  // 待优化
  if (source === 'npm') {
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
  console.log(`$ ${chalk.green(source)} ${chalk.green(npmArgs.join(' '))}`);
  const spinner = ora(`正在通过 ${chalk.green(source)} 安装更新包!`);
  spinner.enabled = spinner.enabled && currentState.get('spinner');
  spinner.start();

  return execa(source, npmArgs, {cwd: currentState.get('cwd')}).then(output => {
      spinner.stop();
      console.log(output.stdout);
      console.log(output.stderr);

      return currentState;
  }).catch(err => {
      spinner.stop();
      throw err;
  });
}

module.exports = install;
