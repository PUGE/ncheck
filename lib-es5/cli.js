#!/usr/bin/env node

'use strict';

var meow = require('meow');
var updateNotifier = require('update-notifier');
var isCI = require('is-ci');
var createCallsiteRecord = require('callsite-record');
var pkg = require('../package.json');
var npmCheck = require('./index');
var staticOutput = require('./out/static-output');
var interactiveUpdate = require('./out/interactive-update');
var debug = require('./state/debug');
var pkgDir = require('pkg-dir');

updateNotifier({ pkg: pkg }).notify();

var cli = meow({
    help: '\n        Usage\n          $ ncheck <path> <options>\n\n        Path\n          Where to check. Defaults to current directory. Use -g for checking global modules.\n\n        Options\n          -u, --update          Interactive update.\n          -g, --global          Look at global modules.\n          -s, --skip-unused     Skip check for unused packages.\n          -p, --production      Skip devDependencies.\n          -i, --ignore          Ignore dependencies based on succeeding glob.\n          -E, --save-exact      Save exact version (x.y.z) instead of caret (^x.y.z) in package.json.\n          --no-color            Force or disable color output.\n          --no-emoji            Remove emoji support. No emoji in default in CI environments.\n          --debug               Debug output. Throw in a gist when creating issues on github.\n\n        Examples\n          $ ncheck           # See what can be updated, what isn\'t being used.\n          $ ncheck ../foo    # Check another path.\n          $ ncheck -gu       # Update globally installed modules by picking which ones to upgrade.\n    ' }, {
    alias: {
        u: 'update',
        g: 'global',
        s: 'skip-unused',
        p: 'production',
        E: 'save-exact',
        i: 'ignore'
    },
    default: {
        dir: pkgDir.sync() || process.cwd(),
        emoji: !isCI,
        spinner: !isCI
    },
    boolean: ['update', 'global', 'skip-unused', 'production', 'save-exact', 'color', 'emoji', 'spinner'],
    string: ['ignore']
});

var options = {
    cwd: cli.input[0] || cli.flags.dir,
    update: cli.flags.update,
    global: cli.flags.global,
    skipUnused: cli.flags.skipUnused,
    ignoreDev: cli.flags.production,
    saveExact: cli.flags.saveExact,
    emoji: cli.flags.emoji,
    installer: process.env.NPM_CHECK_INSTALLER || 'npm',
    debug: cli.flags.debug,
    spinner: cli.flags.spinner,
    ignore: cli.flags.ignore
};

if (options.debug) {
    debug('cli.flags', cli.flags);
    debug('cli.input', cli.input);
}

npmCheck(options).then(function (currentState) {
    currentState.inspectIfDebugMode();

    if (options.update) {
        return interactiveUpdate(currentState);
    }

    return staticOutput(currentState);
}).catch(function (err) {
    console.log(err.message);
    if (options.debug) {
        console.log(createCallsiteRecord(err).renderSync());
    } else {
        console.log('For more detail, add `--debug` to the command');
    }
    process.exit(1);
});