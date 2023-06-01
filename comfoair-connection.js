module.exports = function (RED) {
    'use strict';
    const { serialp } = require('serialport');

    function ComfoairConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.serialport = n.serialport;
        this.serialbaud = parseInt(n.serialbaud) || 9600;
        this.reconnectTimeout = parseInt(n.reconnectTimeout) || 5000;
    }
    RED.nodes.registerType('comfoair-connection', ComfoairConnectionNode);

    RED.httpAdmin.get('/comfoair-serialports', RED.auth.needsPermission('serial.read'), function(req,res) {
        serialp.list().then(
            ports => {
                const a = ports.map(p => p.path);
                res.json(a);
            },
            err => {
                res.json([RED._(`serialport.list() error: ${err}`)]);
            }
        );
    });
};
