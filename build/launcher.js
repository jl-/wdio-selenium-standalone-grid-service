'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _seleniumStandalone = require('selenium-standalone');

var _seleniumStandalone2 = _interopRequireDefault(_seleniumStandalone);

var _getFilePath = require('./utils/getFilePath');

var _getFilePath2 = _interopRequireDefault(_getFilePath);

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SeleniumStandaloneGridLauncher = function () {
    function SeleniumStandaloneGridLauncher() {
        _classCallCheck(this, SeleniumStandaloneGridLauncher);

        this.hub = {};
        this.nodes = [];
    }

    _createClass(SeleniumStandaloneGridLauncher, [{
        key: 'onPrepare',
        value: function onPrepare(_ref) {
            var _this = this;

            var config = _ref.seleniumStandaloneGridArgs;
            var _config$install = config.install,
                install = _config$install === undefined ? {} : _config$install,
                _config$hub = config.hub,
                hub = _config$hub === undefined ? {} : _config$hub,
                _config$nodes = config.nodes,
                nodes = _config$nodes === undefined ? [] : _config$nodes;

            this.configHub(_extends({}, install, hub));
            this.configNodes(nodes.map(function (n) {
                return _extends({}, install, n);
            }));
            return this.installGridDependencies(config.install).then(function () {
                return _this.startHub();
            }).then(function () {
                return _this.registerNodes();
            });
        }
    }, {
        key: 'sanitizeCliArgs',
        value: function sanitizeCliArgs(args) {
            return Object.keys(args).filter(function (key) {
                return args.hasOwnProperty(key);
            }).reduce(function (result, key) {
                var value = args[key];
                if (value !== false && value != null) {
                    result.push('-' + key);
                    if (value !== true) {
                        result.push(value);
                    }
                }
                return result;
            }, []);
        }
    }, {
        key: 'configHub',
        value: function configHub(config) {
            var _config$seleniumArgs = config.seleniumArgs,
                seleniumArgs = _config$seleniumArgs === undefined ? {} : _config$seleniumArgs;
            var host = seleniumArgs.host,
                port = seleniumArgs.port;

            this.hub.config = _extends({}, seleniumArgs);
            this.hub.config.register = 'http://' + host + ':' + port + '/grid/register';

            this.hub.args = _extends({}, config, {
                seleniumArgs: this.sanitizeCliArgs(_extends({}, seleniumArgs, { role: 'hub' }))
            });
        }
    }, {
        key: 'configNodes',
        value: function configNodes(nodes) {
            var _this2 = this;

            this.nodes = nodes.map(function (config) {
                var seleniumArgs = _this2.sanitizeCliArgs(_extends({
                    host: _this2.hub.config.host,
                    hub: _this2.hub.config.register
                }, config.seleniumArgs, {
                    role: 'node'
                }));
                return { args: _extends({}, config, { seleniumArgs: seleniumArgs }) };
            });
        }
    }, {
        key: 'installGridDependencies',
        value: function installGridDependencies(installArgs) {
            return new Promise(function (resolve, reject) {
                _seleniumStandalone2.default.install(installArgs, function (error) {
                    if (error) {
                        reject(error);
                    }
                    resolve();
                });
            });
        }
    }, {
        key: 'startSeleniumInstance',
        value: function startSeleniumInstance(startArgs, logFilePath) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _seleniumStandalone2.default.start(startArgs, function (error, process) {
                    if (error) {
                        return reject(error);
                    }
                    _this3.redirectLogStream(process, logFilePath);
                    resolve(process);
                });
            });
        }
    }, {
        key: 'startHub',
        value: function startHub() {
            var _this4 = this;

            return this.startSeleniumInstance(this.hub.args, this.hub.logFilePath || 'selenium-hub.log').then(function (process) {
                _this4.hub.process = process;
            });
        }
    }, {
        key: 'registerNodes',
        value: function registerNodes() {
            var _this5 = this;

            return Promise.all(this.nodes.map(function (config, index) {
                return _this5.startSeleniumInstance(config.args, config.logFilePath || 'selenium-node-' + index + '.log').then(function (process) {
                    config.process = process;
                });
            }));
        }
    }, {
        key: 'onComplete',
        value: function onComplete() {
            this.nodes.map(function (config) {
                return config.process;
            }).concat(this.hub.process).filter(function (process) {
                return Boolean(process);
            }).forEach(function (process) {
                return process.kill();
            });
        }
    }, {
        key: 'redirectLogStream',
        value: function redirectLogStream(process, logFilePath) {
            var logFile = (0, _getFilePath2.default)(logFilePath);
            _fsExtra2.default.ensureFileSync(logFile);

            var logStream = _fsExtra2.default.createWriteStream(logFile, { flags: 'w' });
            if (process.stdout) {
                process.stdout.pipe(logStream);
            }
            if (process.stderr) {
                process.stderr.pipe(logStream);
            }
        }
    }]);

    return SeleniumStandaloneGridLauncher;
}();

exports.default = SeleniumStandaloneGridLauncher;