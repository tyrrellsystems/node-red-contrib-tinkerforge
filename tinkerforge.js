"use strict"


var events = require('events');
var util = require('util');
var bodyParser = require('body-parser');
var Tinkerforge = require('tinkerforge');
var bricklets = require('./lib/bricklets');

var devices = {};

function newDevice(host, port, id) {
    var name = host + ":" + port;
    var ipcon = new Tinkerforge.IPConnection();
    var dev = {
        ipcon: ipcon,
        sensors: {}
    };

    devices[id] = dev;
    ipcon.setAutoReconnect(true);
    ipcon.connect(host, port,
        function(error) {
            console.log('Error: ' + error);
        }
    );

    ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            ipcon.enumerate();
        });

    ipcon.on(Tinkerforge.IPConnection.CALLBACK_ENUMERATE,
        function(uid, connectedUid, position, hardwareVersion, firmwareVersion,
            deviceIdentifier, enumerationType) {
            var sensor = {
                uid: uid,
                type: deviceIdentifier,
                typeName: bricklets[deviceIdentifier],
                position: position,
                hardwareVersion: hardwareVersion,
                firmwareVersion: firmwareVersion
            }
            devices[id].sensors[sensor.uid] = sensor;
            //console.log(sensor);
        }
    );
}

module.exports = function(RED){

    var settings = RED.settings;

    function tinkerForgeConfig(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.name = n.host + ":" + n.port;
        this.id = n.id;

        var node = this;

        if (devices[node.name]) {
            //already exists?
        } else {
            newDevice(node.host,node.port,node.id);
        }
            
    }

    RED.nodes.registerType('TinkerForgeConfig', tinkerForgeConfig);

    function tinkerForgeMovement(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        var node = this;

        node.ipcon = devices[this.device].ipcon;

        node.md = new Tinkerforge.BrickletMotionDetector(node.sensor, node.ipcon);
        

        var detected = function () {
            node.send({
                topic: node.topic || "movement",
                payload: true
            });
        }

        node.md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_MOTION_DETECTED,
            detected
        );

        var ended = function () {
            node.send({
                topic: node.topic || "movement",
                payload: false
            });
        }

        // Register detection cycle ended callback
        node.md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED,
            ended
        );

        node.on('close',function() {
            node.ipcon.disconnect();
        });
    }

    RED.nodes.registerType('TinkerForge Motion', tinkerForgeMovement);


    function tinkerForgeHumidity(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = devices[this.device].ipcon;
        node.h = new Tinkerforge.BrickletHumidity(node.sensor, node.ipcon);

        setInterval(function(){
            node.h.getHumidity(function(humidity) {
                node.send({
                    topic: node.topic || 'humidity',
                    payload: humidity/10.0
                })
            },
            function(err) {
                //error
                if (err == 31) {
                    node.error("Not connected");
                }
            });
        },(node.pollTime * 1000));

        node.on('close',function() {
            node.ipcon.disconnect();
        });
    }

    RED.nodes.registerType('TinkerForge Humidity', tinkerForgeHumidity);

    function tinkerForgePTC(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = devices[this.device].ipcon;

        node.t = new Tinkerforge.BrickletPTC(node.sensor, node.ipcon);

        node.interval = setInterval(function(){
            node.t.getTemperature(function(temp) {
                node.send({
                    topic: node.topic || 'temperature',
                    payload: temp/100.0
                })
            },
            function(err) {
                //error
                node.error(err);
            });
        },(node.pollTime * 1000));

        node.on('close',function() {
            clearInterval(node.interval);
            node.ipcon.disconnect();
        });
        
    }

    RED.nodes.registerType('TinkerForge PTC', tinkerForgePTC);

    function tinkerForgeTemperature(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = devices[this.device].ipcon;

        node.t = new Tinkerforge.BrickletTemperature(node.sensor, node.ipcon);

        node.interval = setInterval(function(){
            node.t.getTemperature(function(temp) {
                node.send({
                    topic: node.topic || 'temperature',
                    payload: temp/100.0
                })
            },
            function(err) {
                //error
                node.error(err);
            });
        },(node.pollTime * 1000));

        node.on('close',function() {
            clearInterval(node.interval);
            node.ipcon.disconnect();
        });
        
    }

    RED.nodes.registerType('TinkerForge Temperature', tinkerForgeTemperature);

    function tinkerForgeDigitalIn(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        var node = this;

        node.currentState = 0;

        node.ipcon = devices[this.device].ipcon;

        node.idi4 = new Tinkerforge.BrickletIndustrialDigitalIn4(node.sensor, node.ipcon);
        //((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3))
        node.idi4.setInterrupt(15);

        node.idi4.on(Tinkerforge.BrickletIndustrialDigitalIn4.CALLBACK_INTERUPT, 
            function(interupMask, valueMask){
                if ((valueMask & 1) !== (currentState & 1)) {
                    node.send({
                        topic: node.topic + "/0",
                        payload: (valueMask & 1)  != 0
                    });
                }

                if ((valueMask & 2) !== (currentState & 1)) {
                    node.send({
                        topic: node.topic + "/2",
                        payload: (valueMask & 2) != 0
                    });
                }

                if ((valueMask & 4) !== (currentState & 4)) {
                    node.send({
                        topic: node.topic + "/2",
                        payload: (valueMask & 4) != 0
                    });
                }

                if ((valueMask & 8) !== (currentState & 8)) {
                    node.send({
                        topic: node.topic + "/3",
                        payload: (valueMask & 8) != 0
                    });
                }
                node.currentState = valueMask;
        });
on
        node.on('close',function() {
            node.ipcon.disconnect();
        });

    }

    RED.nodes.registerType('TinkerForge Digital-In', tinkerForgeDigitalIn);

    RED.httpAdmin.use('/TinkerForge/device',bodyParser.json());

    RED.httpAdmin.post('/TinkerForge/device', function(req,res){
        if (!devices[req.body.id]) {
            newDevice(req.body.host, req.body.port, req.body.id);
        }
    });

    RED.httpAdmin.get('/TinkerForge/:device/sensors/:type', function(req,res){
        var dev = devices[req.params.device];
        //console.log(dev + " - - " + req.params.device);
        if (dev) {
            var sensors = [];
            for (var s in dev.sensors) {
                if (dev.sensors.hasOwnProperty(s)) {
                    if (dev.sensors[s].type == req.params.type) {
                        sensors.push(dev.sensors[s]);
                    }
                }
            }
            //console.log(sensors);
            res.send(sensors);
        } else {
            res.status(404).end();
        }
    });
};