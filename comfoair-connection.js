module.exports = function (RED) {
    'use strict';

    function ComfoairConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.serialport = n.serialport;
        this.serialbaud = parseInt(n.serialbaud) || 9600;
        this.databits = parseInt(n.databits) || 8;
        this.parity = n.parity || 'none';
        this.stopbits = parseInt(n.stopbits) || 1;
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