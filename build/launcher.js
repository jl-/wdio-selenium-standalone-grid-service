'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

            var drivers = config.drivers;
            this.installArgs = Object.assign({ drivers: drivers }, config.install);
            this.configHub(Object.assign({ drivers: drivers }, config.hub));
            this.configNodes(config.nodes.map(function (item) {
                return Object.assign({ drivers: drivers }, item);
            }));

            return this.installGridDependencies(this.installArgs).then(function () {
                return _this.startHub();
            }).then(function () {
                return _this.registerNodes();
            });
        }
    }, {
        key: 'sanitizeCliArgs',
        value: function sanitizeCliArgs(argObject) {
            return Object.keys(argObject).filter(function (key) {
                return argObject.hasOwnProperty(key);
            }).reduce(function (result, key) {
                var value = argObject[key];
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
        value: function configHub() {
            var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            this.hub.config = (0, _cloneDeep2.default)(config.seleniumArgs);
            var _hub$config = this.hub.config,
                host = _hub$config.host,
                port = _hub$config.port;

            this.hub.config.register = 'http://' + host + ':' + port + '/grid/register';
            this.hub.args = Object.assign((0, _cloneDeep2.default)(config), {
                seleniumArgs: this.sanitizeCliArgs(Object.assign({}, config.seleniumArgs, { role: 'hub' }))
            });
        }
    }, {
        key: 'configNodes',
        value: function configNodes(configs) {
            var _this2 = this;

            this.nodes = configs.map(function (config) {
                var seleniumArgs = _this2.sanitizeCliArgs(Object.assign({
                    host: _this2.hub.config.host,
                    hub: _this2.hub.config.register
                }, config.seleniumArgs, { role: 'node' }));
                return { args: Object.assign((0, _cloneDeep2.default)(config), { seleniumArgs: seleniumArgs }) };
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
            [this.hub.process].concat(this.nodes.map(function (config) {
                return config.proceess;
            })).filter(function (process) {
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