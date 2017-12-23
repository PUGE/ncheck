ncheck
=========

> 检查项目中是否存在 过时 错误 多余(仅支持vue) 的模块.


### 特点

* 帮你找出项目引用的模块是否有更新.
* 提供更新详情以及提供模块主页，让你可以判断是否更新.
* 告知项目中没有用到的模块.
* 可以在全局中工作, 通过 `-g`.

### 需求
* Node >= 4.0.0

### 安装
```bash
$ npm install -g ncheck
```

### 使用
```bash
$ ncheck
```


### 参数
```
使用
  $ ncheck <path> <options>

Path
  Where to check. Defaults to current directory. Use -g for checking global modules.

Options
  -g, --global          检查全局模块.
  -u, --unused          检查未使用的包.
  -y, --yarn            使用yarn安装.
  -i, --ignore          Ignore dependencies based on succeeding glob.
  -E, --save-exact      Save exact version (x.y.z) instead of caret (^x.y.z) in package.json.

实例
  $ npm-check           # See what can be updated, what isn't being used.
  $ npm-check ../foo    # Check another path.
  $ npm-check -gu       # Update globally installed modules by picking which ones to upgrade.
```
