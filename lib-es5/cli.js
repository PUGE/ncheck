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
    help: '\n        \u4F7F\u7528\u65B9\u6CD5:\n          $ ncheck <path> <options>\n\n        Path\n          \u68C0\u67E5\u54EA\u4E2A\u76EE\u5F55. \u9ED8\u8BA4\u4E3A\u5F53\u524D\u76EE\u5F55. \u4F7F\u7528 -g \u68C0\u67E5\u5168\u5C40\u6A21\u5757.\n\n        Options\n          -u, --update          \u53EA\u68C0\u67E5\u66F4\u65B0.\n          -g, --global          \u68C0\u67E5\u5168\u5C40\u6A21\u5757.\n          -s, --skip-unused     \u8DF3\u8FC7\u68C0\u67E5\u672A\u4F7F\u7528\u7684\u6A21\u5757.\n          -p, --production      \u8DF3\u8FC7\u68C0\u67E5\u5F00\u53D1\u7248\u672C.\n          -i, --ignore          Ignore dependencies based on succeeding glob.\n          -E, --save-exact      \u5728package.json\u4E2D\u4F7F\u7528\u7CBE\u786E\u7248\u672C(x.y.z)\u800C\u4E0D\u662F(^x.y.z).\n          --specials            \u5305\u62EC\u68C0\u67E5\u672A\u4F7F\u7528\u7684\u4F9D\u8D56\u5173\u7CFB\u7684depcheck\u7279\u6B8A\u5217\u8868\u3002\n          --no-color            \u7981\u7528\u5F69\u8272\u6587\u5B57.\n          --no-emoji            \u7981\u7528emoji\u8868\u60C5.\n          --debug               \u8C03\u8BD5\u8F93\u51FA\u6A21\u5F0F.\n\n        \u793A\u4F8B\n          $ ncheck           # \u68C0\u67E5\u5F53\u524D\u6587\u4EF6\u5939\u9879\u76EE\u6709\u54EA\u4E9B\u6A21\u5757\u53EF\u4EE5\u66F4\u65B0\u6216\u8005\u4F18\u5316\n          $ ncheck ../foo    # \u68C0\u67E5\u4E0A\u5C42\u76EE\u5F55\u4E2D\u7684foo\u6587\u4EF6\u5939.\n          $ ncheck -gu       # \u68C0\u67E5\u5168\u5C40\u6A21\u5757\uFF0C\u5E76\u4E14\u53EA\u68C0\u67E5\u66F4\u65B0.\n    ' }, {
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
    string: ['ignore', 'specials']
});

var options = {
    cwd: cli.input[0] || cli.flags.dir,
    update: cli.flags.update,
    global: cli.flags.global,
    skipUnused: cli.flags.skipUnused,
    ignoreDev: cli.flags.production,
    saveExact: cli.flags.saveExact,
    specials: cli.flags.specials,
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