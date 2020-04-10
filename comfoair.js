'use strict';

const Comfoair = require('comfoair');
const events = require('events');

module.exports = function (RED) {
    function ComfoairNode(config) {
        RED.nodes.createNode(this, config);
        this.serialConfig = RED.nodes.getNode(config.datasource);

        if (this.serialConfig) {
            const node = this;

            node.comfoair = comfoairPool.get(this.serialConfig.serialport, this.serialConfig.serialbaud, this.serialConfig.reconnectTimeout);
            node.comfoair.on('ready', function () {
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: 'node-red:common.status.connected'
                });
            });
            node.comfoair.on('closed', function () {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'node-red:common.status.not-connected'
                });
            });

            this.on('input', function (msg, send, done) {
                // For maximum backwards compatibility, check that send exists.
                // If this node is installed in Node-RED 0.x, it will need to
                // fallback to using `node.send`
                send = send || function () {
                    node.send.apply(node, arguments);
                };
                const handleError = function (err, msg) {
                    if (done) {
                        done(err);
                    } else {
                        node.error(err, msg);
                    }
                };
                if (Object.prototype.hasOwnProperty.call(msg, 'payload')) {
                    if (typeof msg.payload.name !== 'string') return handleError('Invalid data for msg.payload.name. Expected a function name as string.', msg);
                    if (typeof msg.payload.params !== 'object') return handleError('Invalid data for msg.payload.params. Expected an object.', msg);
                    if (!node.comfoair.isValidFunction(msg.payload.name)) return handleError(`Input '${msg.payload.name}' is no valid function name.`, msg);

                    node.comfoair.runCommand(msg.payload.name, msg.payload.params, (err, resp) => {
                        if (err) {
                            return comfoairPool.close(node.serialConfig.serialport, () => {
                                node.comfoair = comfoairPool.get(node.serialConfig.serialport, node.serialConfig.serialbaud, node.serialConfig.reconnectTimeout);
                                const errMsg = `comfoair [${node.comfoair.port}] runCommand(${msg.payload.name}): ${err.message}`;
                                handleError(errMsg, msg);
                            });
                        }
                        if (resp) {
                            if (!resp.valid) {
                                RED.log.warn(`Invalid checksum or frame length for ${msg.payload.name}`);
                                if (done) {
                                    done();
                                }
                                return;
                            }

                            msg.payload = resp.payload || {};
                            msg.payload.type = resp.type;
                            send(msg);
                            if (done) {
                                done();
                            }
                        }
                    });
                } else {
                    if (done) {
                        done();
                    }
                }
            });
        } else {
            this.error(RED._('comfoair.errors.missing-conf'));
        }

        this.on('close', function (done) {
            if (this.serialConfig) {
                comfoairPool.close(this.serialConfig.serialport, done);
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType('comfoair', ComfoairNode);

    const comfoairPool = (function () {
        const connections = {};
        return {
            get(port, baud, reconnectTimeout) {
                // just return the connection object if already have one
                // key is the port (file path)
                const id = port;
                if (connections[id]) return connections[id];

                connections[id] = (function () {
                    const obj = {
                        _emitter: new events.EventEmitter(),
                        comfoair: null,
                        _closing: false,
                        tout: null,
                        port,
                        on(eventName, cb) {
                            this._emitter.on(eventName, cb);
                        },
                        close(cb) {
                            this.comfoair.close(cb);
                        },
                        runCommand(name, params, cb) {
                            this.comfoair.runCommand(name, params, cb);
                        },
                        isValidFunction(name) {
                            return (typeof this.comfoair[name] === 'function');
                        }
                    };
                    const setupComfoair = function () {
                        obj.comfoair = new Comfoair({
                            port,
                            baud
                        });
                        obj.comfoair.on('error', function (err) {
                            RED.log.error(RED._('comfoair.errors.error', {
                                port,
                                error: err.toString()
                            }));
                            connections[port].close(function (err) {
                                RED.log.info(RED._('comfoair.errors.closed', {
                                    port,
                                    error: err.toString()
                                }));
                            });
                            obj._emitter.emit('closed');
                            obj.tout = setTimeout(function () {
                                setupComfoair();
                            }, reconnectTimeout);
                        });
                        obj.comfoair.on('close', function () {
                            if (!obj._closing) {
                                RED.log.error(RED._('comfoair.errors.unexpected-close', {
                                    port
                                }));
                                obj._emitter.emit('closed');
                                obj.tout = setTimeout(function () {
                                    setupComfoair();
                                }, reconnectTimeout);
                            }
                        });
                        obj.comfoair.on('open', function () {
                            RED.log.info(RED._('comfoair.onopen', {
                                port,
                                baud
                            }));
                            if (obj.tout) {
                                clearTimeout(obj.tout);
                            }
                            obj._emitter.emit('ready');
                        });
                        obj.comfoair.on('data', function (d) {
                            obj._emitter.emit('data', d);
                        });
                    };
                    setupComfoair();
                    return obj;
                }());
                return connections[id];
            },
            close(port, done) {
                if (connections[port]) {
                    if (connections[port].tout != null) {
                        clearTimeout(connections[port].tout);
                    }
                    connections[port]._closing = true;
                    try {
                        connections[port].close(function () {
                            RED.log.info(RED._('comfoair.errors.closed', {
                                port
                            }));
                            done();
                        });
                    } catch (err) {
                        RED.log.error(err);
                        done();
                    }
                    delete connections[port];
                } else {
                    done();
                }
            }
        };
    }());
};