'use strict';
const got = require('got');
const Order = require('../../Order')
const semver = require('semver');

module.exports = (name, opts) => {
  // 模块最新版本检查地址
  const pkgUrl = Order.checkSource + name
	opts = Object.assign({
		version: 'latest'
	}, opts);

	const headers = {
		accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
	}
	
	return got(pkgUrl, {json: true})
		.then(res => {
			let data = res.body;
			let version = opts.version;
      // 判断是否包含最后版本号
			if (data['dist-tags'][version]) {
				data = data.versions[data['dist-tags'][version]];
			} else if (version) {
				if (!data.versions[version]) {
					const versions = Object.keys(data.versions);
					version = semver.maxSatisfying(versions, version);

					if (!version) {
						throw new Error('Version doesn\'t exist');
					}
				}

				data = data.versions[version];

				if (!data) {
					throw new Error('Version doesn\'t exist');
				}
			}
			return data;
		})
		.catch(err => {
			if (err.statusCode === 404) {
				throw new Error(`模块 \`${name}\` 不存在!`);
			}
			throw err;
		});
};
