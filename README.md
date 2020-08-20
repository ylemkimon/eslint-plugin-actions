# eslint-plugin-actions
[![npm](https://img.shields.io/npm/v/eslint-plugin-actions.svg)](https://www.npmjs.com/package/eslint-plugin-actions)
[![CI](https://github.com/ylemkimon/eslint-plugin-actions/workflows/CI/badge.svg?branch=master&event=push)](https://github.com/ylemkimon/eslint-plugin-actions/actions?query=workflow%3ACI)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Lint JS inside GitHub Actions workflow


## Installation

You'll first need to install [ESLint](http://eslint.org) 6.7 or greater:
```
$ npm i eslint --save-dev
$ yarn add -D eslint
```

Next, install `eslint-plugin-actions`:
```
$ npm install eslint-plugin-actions --save-dev
$ yarn add -D eslint-plugin-actions
```


## Usage

Extending the `plugin:actions/recommended` config will enable the processor on all workflow `.{yml,yaml}` files:
```json
{
    "extends": ["plugin:actions/recommended"]
}
```

With ESLint v7, you can run it as usual. If you're using ESLint v6, you'll need to pass [`--ext` option](https://eslint.org/docs/user-guide/command-line-interface#ext) to include YAML files:
```
$ eslint --ext js,yml,yaml .
```

Currently, only literal blocks (`|`) are supported and it's recommended to use them:
```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
    - uses: actions/github-script@v2
      with:
        script: |
          // .github/workflows/ci.yml/0_build/0.js
```

The autofixing (`--fix`) is supported, but it's still experimental and whitespace handling of YAML is different from JS, so be sure to check the result. 


### Advanced Configuration

Dotfiles are ignored by ESLint by default. To lint files inside `.github`, you'll need to add `!.github` to
`.eslintignore` file or `ignorePatterns` of your configuration file. In ESLint v6, all files having extensions
specified by `--ext` option are included, so to exclude non-workflow YAML files, add `*.yml`, `*.yaml`, and
`!/.github/workflows/*.{yml,yaml}`:
```gitignore
!/.github
# only for ESLint v6:
*.yml
*.yaml
!/.github/workflows/*.yml
!/.github/workflows/*.yaml
```

Then, add `actions` to the plugins section of your configuration file. You can omit the `eslint-plugin-` prefix:
```json
{
    "plugins": ["actions"]
}
```

Use the `processor` option in an `overrides` entry to enable the plugin on workflow YAML files:
```json
{
    "overrides": [{
        "files": [".github/workflows/*.{yml,yaml}"],
        "processor": "actions/actions"
    }]
}
```

Each script inside a workflow has a virtual filename appended to the YAML file's path. It has the format of `[global index]_[job id]/[local index].js` (see the example above). [`overrides` glob patterns](https://eslint.org/docs/user-guide/configuring#configuration-based-on-glob-patterns) for these virtual filenames can customize configuration for scripts without affecting regular code. For more information on configuring processors, refer to the [ESLint documentation](https://eslint.org/docs/user-guide/configuring#specifying-processor):
```json
{
    "overrides": [{
        "files": [".github/workflows/*.{yml,yaml}/*_build/*.js"],
        "rules": {
            "indent": ["error", 2, {"outerIIFEBody": 0}]
            ...
        },
        ...
    }]
}
```

### Rules

The script will be enclosed in an IIFE async function, when processed by ESLint:
```js
(async function(context, github, io, core) {
...
}());
```

Therefore, if `indent` or `indent-legacy` rule is used, the `outerIIFEBody` option should be set to `0` (see above). Furthermore, rules affecting the beginning and the end of the file, such as `unicode-bom`, `eol-last` and `no-multiple-empty-lines`, are ignored.


## Supported Actions
- [actions/github-script](https://github.com/actions/github-script)


## Remark

This plugin is heavily inspired by and adapted from [eslint-plugin-markdown](https://github.com/eslint/eslint-plugin-markdown).

## License

[MIT License](./LICENSE)
