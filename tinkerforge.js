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

        var md = new Tinkerforge.BrickletMotionDetector(node.sensor, node.ipcon);

        var detected = function () {
            node.send({
                topic: node.topic || "movement",
                payload: true
            });
        }

        md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_MOTION_DETECTED,
            detected
        );

        var ended = function () {
            node.send({
                topic: node.topic || "movement",
                payload: false
            });
        }

        // Register detection cycle ended callback
        md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED,
            ended
        );

        node.on('close',function() {
            md.removeListener(Tinkerforge.BrickletMotionDetector.CALLBACK_MOTION_DETECTED, detected);
            md.removeListener(Tinkerforge.BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED, ended);
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
        var h = new Tinkerforge.BrickletHumidity(node.sensor, node.ipcon);

        setInterval(function(){
            h.getHumidity(function(humidity) {
                node.send({
                    topic: node.topic || 'humidity',
                    payload: humidity/10.0
                })
            },
            function(err) {
                //error
                node.error(err);
            });
        },(node.pollTime * 1000));
    }

    RED.nodes.registerType('TinkerForge Humidity', tinkerForgeHumidity);

    function tinkerForgeTemperature(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = devices[this.device].ipcon;
        
    }

    RED.nodes.registerType('TinkerForge Temperature', tinkerForgeTemperature);

    RED.httpAdmin.use('/TinkerForge/device',bodyParser.json());

    RED.httpAdmin.post('/TinkerForge/device', function(req,res){
        if (!devices[req.body.id]) {
            newDevice(req.body.host, req.body.port, req.body.id);
        }
    });

    RED.httpAdmin.get('/TinkerForge/:device/sensors/:type', function(req,res){
        var dev = devices[req.params.device];
        if (dev) {
            var sensors = [];
            for (var s in dev.sensors) {
                if (dev.sensors.hasOwnProperty(s)) {
                    if (dev.sensors[s].type == req.params.type) {
                        sensors.push(dev.sensors[s]);
                    }
                }
            }
            res.send(sensors);
        } else {
            res.status(404).end();
        }
    });
};