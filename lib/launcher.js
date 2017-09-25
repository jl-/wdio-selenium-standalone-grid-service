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
        const { install = {}, hub = {}, nodes = []} = config;
        this.configHub({ ...install, ...hub });
        this.configNodes(nodes.map(n => ({ ...install, ...n })));
        return this.installGridDependencies(
            config.install
        ).then(() => this.startHub()).then(() => this.registerNodes());
    }
    sanitizeCliArgs (args) {
        return Object.keys(args).filter(
            key => args.hasOwnProperty(key)
        ).reduce((result, key) => {
            const value = args[key];
            if (value !== false && value != null) {
                result.push(`-${key}`);
                if (value !== true) {
                    result.push(value);
                }
            }
            return result;
        }, []);
    }
    configHub (config) {
        const { seleniumArgs = {}} = config;
        const { host, port } = seleniumArgs;
        this.hub.config = { ...seleniumArgs };
        this.hub.config.register = `http://${host}:${port}/grid/register`;

        this.hub.args = {
            ...config,
            seleniumArgs: this.sanitizeCliArgs({ ...seleniumArgs, role: 'hub' })
        };
    }
    configNodes (nodes) {
        this.nodes = nodes.map(config => {
            const seleniumArgs = this.sanitizeCliArgs({
                host: this.hub.config.host,
                hub: this.hub.config.register,
                ...config.seleniumArgs,
                role: 'node'
            });
            return { args: { ...config, seleniumArgs }};
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
        this.nodes.map(config => config.process).concat(
            this.hub.process
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
