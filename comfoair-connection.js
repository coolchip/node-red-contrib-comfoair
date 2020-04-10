module.exports = function (RED) {
    'use strict';

    function ComfoairConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.serialport = n.serialport;
        this.serialbaud = parseInt(n.serialbaud) || 9600;
        this.reconnectTimeout = parseInt(n.reconnectTimeout) || 5000;
    }
    RED.nodes.registerType('comfoair-connection', ComfoairConnectionNode);

    RED.httpAdmin.get('/comfoairports', RED.auth.needsPermission('serial.read'), function (req, res) {
        const serialport = require('serialport');
        serialport.list(function (err, ports) {
            if (err) return RED.log.error(err);
            res.json(ports);
        });
    });
};
