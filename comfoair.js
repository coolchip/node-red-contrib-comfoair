'use strict';

const Comfoair = require('comfoair');
const events = require('events');

module.exports = function (RED) {

    const settings = RED.settings;

    function ComfoairNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.comfoairDatasource = RED.nodes.getNode(config.datasource);
        if (node.comfoairDatasource) {
            node.comfoair = comfoairPool.get(this.comfoairDatasource.serialport,
                this.comfoairDatasource.serialbaud);

            node.comfoair.on('error', function (err) {
                return RED.log.error(`comfoair error: comfoair: ${err}`);
            });

            node.comfoair.on('data', function (msg) {
                if (msg) {
                    if(!msg.payload) {
                        msg.payload = msg.type || {};
                    }
                    return node.send(msg);
                }
            });

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

            node.on('input', function (msg) {
                if (msg.hasOwnProperty('payload')) {
                    let payload = msg.payload;
                    //if (typeof payload === 'object') {}
                    node.comfoair.write(payload, function (err) {
                        if (err) {
                            const errmsg = err.toString().replace('Serialport', 'Serialport ' + node.comfoair.comfoair.path);
                            node.error(errmsg, msg);
                        }
                    });
                }
            });
        } else {
            this.error(RED._('comfoair.errors.missing-conf'));
        }
        node.on('close', function (done) {
            if (node.comfoairDatasource) {
                comfoairPool.close(node.comfoairDatasource.serialport, done);
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType('comfoair', ComfoairNode);


    const comfoairPool = (function () {
        const connections = {};
        return {
            get: function (port, baud) {
                const id = port;
                if (!connections[id]) {
                    connections[id] = (function () {
                        const obj = {
                            _emitter: new events.EventEmitter(),
                            comfoair: null,
                            _closing: false,
                            tout: null,
                            on: function (a, b) {
                                this._emitter.on(a, b);
                            },
                            close: function (cb) {
                                this.comfoair.close(cb);
                            },
                            write: function (m, cb) {
                                this.comfoair.write(m, cb);
                            },
                        };
                        let olderr = '';
                        const setupComfoair = function () {
                            obj.comfoair = new Comfoair({
                                    port: port,
                                    baud: baud
                                },
                                function (err) {
                                    if (err) {
                                        if (err.toString() !== olderr) {
                                            olderr = err.toString();
                                            RED.log.error(RED._('comfoair.errors.error', {
                                                port: port,
                                                error: olderr
                                            }));
                                        }
                                        obj.tout = setTimeout(function () {
                                            setupComfoair();
                                        }, settings.serialReconnectTime);
                                    }
                                });
                            obj.comfoair.on('error', function (err) {
                                RED.log.error(RED._('comfoair.errors.error', {
                                    port: port,
                                    error: err.toString()
                                }));
                                obj._emitter.emit('closed');
                                obj.tout = setTimeout(function () {
                                    setupComfoair();
                                }, settings.serialReconnectTime);
                            });
                            obj.comfoair.on('close', function () {
                                if (!obj._closing) {
                                    RED.log.error(RED._('comfoair.errors.unexpected-close', {
                                        port: port
                                    }));
                                    obj._emitter.emit('closed');
                                    obj.tout = setTimeout(function () {
                                        setupComfoair();
                                    }, settings.serialReconnectTime);
                                }
                            });
                            obj.comfoair.on('open', function () {
                                olderr = '';
                                RED.log.info(RED._('comfoair.onopen', {
                                    port: port,
                                    baud: baud
                                }));
                                if (obj.tout) {
                                    clearTimeout(obj.tout);
                                }
                                obj._emitter.emit('ready');
                            });
                            obj.comfoair.on('data', function (d) {
                                obj._emitter.emit('data', d);
                            });
                            obj.comfoair.on('disconnect', function () {
                                RED.log.error(RED._('comfoair.errors.disconnected', {
                                    port: port
                                }));
                            });
                        };
                        setupComfoair();
                        return obj;
                    }());
                }
                return connections[id];
            },
            close: function (port, done) {
                if (connections[port]) {
                    if (connections[port].tout != null) {
                        clearTimeout(connections[port].tout);
                    }
                    connections[port]._closing = true;
                    try {
                        connections[port].close(function () {
                            RED.log.info(RED._('comfoair.errors.closed', {
                                port: port
                            }));
                            done();
                        });
                    } catch (err) {
                        RED.log.error(err);
                    }
                    delete connections[port];
                } else {
                    done();
                }
            }
        };
    }());
};