import fs from 'fs-extra';
import Selenium from 'selenium-standalone';
import getFilePath from './utils/getFilePath';
import clone from 'lodash/cloneDeep';

class SeleniumStandaloneGridLauncher {
    constructor () {
        this.hub = {};
        this.nodes = [];
    }
    onPrepare ({ seleniumStandaloneGridArgs: config }) {
        const drivers = config.drivers;
        this.installArgs = Object.assign({ drivers }, config.install);
        this.configHub(Object.assign({ drivers }, config.hub));
        this.configNodes(config.nodes.map(item => Object.assign({ drivers }, item)));

        return this.installGridDependencies(
            this.installArgs
        ).then(() => this.startHub()).then(() => this.registerNodes());
    }
    sanitizeCliArgs (argObject) {
        return Object.keys(argObject).filter(
            key => argObject.hasOwnProperty(key)
        ).reduce((result, key) => {
            const value = argObject[key];
            if (value !== false && value != null) {
                result.push(`-${key}`);
                if (value !== true) {
                    result.push(value);
                }
            }
            return result;
        }, []);
    }
    configHub (config = {}) {
        this.hub.config = clone(config.seleniumArgs);
        const { host, port } = this.hub.config;
        this.hub.config.register = `http://${host}:${port}/grid/register`;
        this.hub.args = Object.assign(clone(config), {
            seleniumArgs: this.sanitizeCliArgs(Object.assign(
                {}, config.seleniumArgs, { role: 'hub' }
            ))
        });
    }
    configNodes (configs) {
        this.nodes = configs.map(config => {
            const seleniumArgs = this.sanitizeCliArgs(Object.assign({
                host: this.hub.config.host,
                hub: this.hub.config.register
            }, config.seleniumArgs, { role: 'node' }));
            return { args: Object.assign(clone(config), { seleniumArgs }) };
        });
    }
    installGridDependencies (installArgs) {
        return new Promise((resolve, reject) => {
            Selenium.install(installArgs, error => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    }
    startSeleniumInstance (startArgs, logFilePath) {
        return new Promise((resolve, reject) => {
            Selenium.start(startArgs, (error, process) => {
                if (error) {
                    return reject(error);
                }
                this.redirectLogStream(process, logFilePath);
                resolve(process);
            });
        });
    }
    startHub () {
        return this.startSeleniumInstance(
            this.hub.args, this.hub.logFilePath || 'selenium-hub.log'
        ).then(process => {
            this.hub.process = process;
        });
    }

    registerNodes () {
        return Promise.all(this.nodes.map((config, index) => {
            return this.startSeleniumInstance(
                config.args, config.logFilePath || `selenium-node-${index}.log`
            ).then(process => {
                config.process = process;
            });
        }));
    }

    onComplete () {
        [this.hub.process].concat(
            this.nodes.map(config => config.proceess)
        ).filter(process => Boolean(process)).forEach(
            process => process.kill()
        );
    }

    redirectLogStream (process, logFilePath) {
        const logFile = getFilePath(logFilePath);
        fs.ensureFileSync(logFile);

        const logStream = fs.createWriteStream(logFile, { flags: 'w' });
        if (process.stdout) {
            process.stdout.pipe(logStream);
        }
        if (process.stderr) {
            process.stderr.pipe(logStream);
        }
    }
}

export default SeleniumStandaloneGridLauncher
