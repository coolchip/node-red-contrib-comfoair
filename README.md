## node-red-contrib-comfoair
[![npm version](https://badge.fury.io/js/node-red-contrib-comfoair.svg)](https://badge.fury.io/js/node-red-contrib-comfoair)
[![Dependency Status](https://david-dm.org/coolchip/node-red-contrib-comfoair.svg)](https://david-dm.org/coolchip/node-red-contrib-comfoair)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/coolchip/node-red-contrib-comfoair)

#### Node-RED Node, that reads and parses the data from a Zehnder ComfoAir 350 and similar devices.

This work depends on the comfoair Module ([node-comfoair@github](https://github.com/coolchip/node-comfoair) and [comfoair@npm](https://www.npmjs.com/package/comfoair)).

### Install
Just run
```
    npm install node-red-contrib-comfoair
```

### How to use
Connect to your bus system via serial connection and configure the comfoair node.
Follow the instruction for [streaming with comfoair](https://github.com/coolchip/node-comfoair#as-streaming-object) and pass json objects to this node.

### Example
```text
[{"id":"3c383f93.3b854","type":"comfoair","z":"edeff4f6.6755a8","name":"","datasource":"a657ec09.c5afb","x":500,"y":280,"wires":[["bb3dffd3.421a9"]]},{"id":"4ecf7869.bd7f38","type":"inject","z":"edeff4f6.6755a8","name":"getTemparatures","topic":"getTemparatures","payload":"{\"name\":\"getTemparatures\",\"params\":{}}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":220,"wires":[["3c383f93.3b854"]]},{"id":"bb3dffd3.421a9","type":"debug","z":"edeff4f6.6755a8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":650,"y":280,"wires":[]},{"id":"45425047.06349","type":"inject","z":"edeff4f6.6755a8","name":"setLevelMiddle","topic":"setLevelMiddle","payload":"{\"name\":\"setLevel\",\"params\":{\"level\":\"middle\"}}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":340,"wires":[["3c383f93.3b854"]]},{"id":"be6f25a.8049cd8","type":"inject","z":"edeff4f6.6755a8","name":"setLevelAway","topic":"setLevelAway","payload":"{\"name\":\"setLevel\",\"params\":{\"level\":\"away\"}}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":300,"wires":[["3c383f93.3b854"]]},{"id":"a657ec09.c5afb","type":"comfoair-connection","z":"","serialport":"/dev/ttyV0","serialbaud":"9600"}]
```
