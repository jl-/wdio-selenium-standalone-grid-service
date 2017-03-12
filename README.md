start a selenium hub, and then register a node and an appium client
```javascript
// wdio.conf.js
{
    services: ['selenium-standalone-grid', 'appium'],
    seleniumStandaloneGridArgs: {
        drivers: { chrome: {}},
        install: {
            // Object.assign({ drivers }, seleniumStandaloneArgs.install) will be passed on to SeleniumStandalone.install
            logger: console.log.bind(console),
        },
        hub: {
            // SeleniumStandalone.start(Object.assign({
            //     drivers: seleniumStandaloneGridArgs.drivers
            // }, seleiumStandaloneGridArgs.hub, {
            //     seleniumArgs: CONVERT_OBJECT_TO_CLI_ARGS({ ...seleniumStandaloneGridArgs.hub.seleniumArgs, role: 'hub' })
            // }));
            seleniumArgs: {
                debug: true,
                host: '127.0.0.1', port: 4445
            },
            spawnOptions: {
                stdio: 'inherit'
            }
        },
        nodes: [{
            // SeleniumStandalone.start(Object.assign({
            //     drivers: seleniumStandaloneGridArgs.drivers
            // }, seleiumStandaloneGridArgs.nodes[index], {
            //     seleniumArgs: CONVERT_OBJECT_TO_CLI_ARGS({
            //         ...seleniumStandaloneGridArgs.nodes[index].seleniumArgs, role: 'node',
            //         hub: `http://${hub.host}:${hub.port}/grid/register`
            //     })
            // }));
            seleniumArgs: {
                port: 4442
            },
            spawnOptions: {
                stdio: 'inherit'
            }
        }]
    },
}

```

