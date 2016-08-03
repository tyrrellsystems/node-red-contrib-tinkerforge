/**
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


"use strict";


var events = require('events');
var util = require('util');
var bodyParser = require('body-parser');
var Tinkerforge = require('tinkerforge');
var bricklets = require('./lib/bricklets');
var colours = require('./lib/colours');

var devices = {};

function newDevice(host, port, id) {
    var name = host + ":" + port;
    var ipcon = new Tinkerforge.IPConnection();
    var dev = {
        host: host,
        port: port,
        ipcon: ipcon,
        sensors: {}
    };

    devices[id] = dev;
    ipcon.connect(host, port,
        function(error) {
            console.log('Error connecting to ' + name + ' : ' + error);
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
            };
            devices[id].sensors[sensor.uid] = sensor;
            //console.log(sensor);
        }
    );
}

module.exports = function(RED){

    // var settings = RED.settings;

    // function tinkerForgeConfig(n) {
    //     RED.nodes.createNode(this,n);
    //     this.host = n.host;
    //     this.port = n.port;
    //     this.name = n.host + ":" + n.port;
    //     this.id = n.id;

    //     var node = this;

    //     if (devices[node.name]) {
    //         //already exists?
    //     } else {
    //         newDevice(node.host,node.port,node.id);
    //     }
            
    // }

    // RED.nodes.registerType('TinkerForgeConfig', tinkerForgeConfig);

    // function tinkerForgeMovement(n) {
    //     RED.nodes.createNode(this,n);
    //     this.device = n.device;
    //     this.sensor = n.sensor;
    //     this.name = n.name;
    //     this.topic = n.topic;
    //     var node = this;

    //     node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
    //     node.ipcon.setAutoReconnect(true);
    //     node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
    //         if(error) {
    //             node.warn("couldn't connect");
    //         }
    //     });

    //     node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
    //     function(connectReason) {
    //         node.md = new Tinkerforge.BrickletMotionDetector(node.sensor, node.ipcon);
    //         node.md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_MOTION_DETECTED,detected);

    //         // Register detection cycle ended callback
    //         node.md.on(Tinkerforge.BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED,ended);
    //     });

    //     var detected = function () {
    //         node.send({
    //             topic: node.topic || "movement",
    //             payload: true
    //         });
    //     };

    //     var ended = function () {
    //         node.send({
    //             topic: node.topic || "movement",
    //             payload: false
    //         });
    //     };

        

    //     node.on('close',function() {
    //         node.ipcon.disconnect();
    //     });
    // }

    // RED.nodes.registerType('TinkerForge Motion', tinkerForgeMovement);


    function tinkerForgeHumidity(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });
        
        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.h = new Tinkerforge.BrickletHumidity(node.sensor, node.ipcon);
        });

        node.interval = setInterval(function(){
            node.h.getHumidity(function(humidity) {
                node.send({
                    topic: node.topic || 'humidity',
                    payload: humidity/10.0
                });
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
            clearInterval(node.interval);
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

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.t = new Tinkerforge.BrickletPTC(node.sensor, node.ipcon);
        });

        node.interval = setInterval(function(){
            node.t.getTemperature(function(temp) {
                node.send({
                    topic: node.topic || 'temperature',
                    payload: temp/100.0
                });
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

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.t = new Tinkerforge.BrickletTemperature(node.sensor, node.ipcon);
        });

        node.interval = setInterval(function(){
            node.t.getTemperature(function(temp) {
                node.send({
                    topic: node.topic || 'temperature',
                    payload: temp/100.0
                });
            },
            function(err) {
                //error
                node.error("PTC - " + err);
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

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.idi4 = new Tinkerforge.BrickletIndustrialDigitalIn4(node.sensor, node.ipcon);
            //((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3))
            node.idi4.setInterrupt( 15);
            node.idi4.on(Tinkerforge.BrickletIndustrialDigitalIn4.CALLBACK_INTERRUPT, 
                function(interupMask, valueMask){
                    // console.log("int mask - " + interupMask.toString(2));
                    // console.log("val mask - " + valueMask.toString(2));

                    if ((valueMask & 1) !== (node.currentState & 1)) {
                        node.send({
                            topic: node.topic + "/0",
                            payload: (valueMask & 1)  != 0
                        });
                    }

                    if ((valueMask & 2) !== (node.currentState & 2)) {
                        node.send({
                            topic: node.topic + "/1",
                            payload: (valueMask & 2) != 0
                        });
                    }

                    if ((valueMask & 4) !== (node.currentState & 4)) {
                        node.send({
                            topic: node.topic + "/2",
                            payload: (valueMask & 4) != 0
                        });
                    }

                    if ((valueMask & 8) !== (node.currentState & 8)) {
                        node.send({
                            topic: node.topic + "/3",
                            payload: (valueMask & 8) != 0
                        });
                    }
                    node.currentState = valueMask;
            });
        });


        node.on('close',function() {
            node.ipcon.disconnect();
        });

    }

    RED.nodes.registerType('TinkerForge Digital-In', tinkerForgeDigitalIn);

    function tinkerForgeDigitalOut(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        var node = this;

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.ido4 = new Tinkerforge.BrickletIndustrialDigitalOut4(node.sensor, node.ipcon);
        });

        node.on('input', function(msg){
            var mask = -1;
            if (Array.isArray(msg.payload)) {
                if (msg.payload.length == 4) {
                    mask = 0;
                    for (var i=0; i<4; i++) {
                        if (msg.payload[i]) {
                            var n = (1 << i);
                            mask += n;
                        }
                    }
                    
                }
            } else if (typeof msg.payload === "object"){
                mask = 0;
                if (msg.payload.hasOwnProperty("0")) {
                    if (msg.payload["0"]) {
                        mask += (1 << 0);
                    }
                }

                if (msg.payload.hasOwnProperty("1")) {
                    if(msg.payload["1"]) {
                        mask += (1 << 1)
                    }
                }

                if (msg.payload.hasOwnProperty("2")) {
                    if(msg.payload["2"]) {
                        mask += (1 << 2)
                    }
                }

                if (msg.payload.hasOwnProperty("3")) {
                    if(msg.payload["3"]) {
                        mask += (1 << 3)
                    }
                }
            }
            if (mask >= 0) {
                console.log(mask.toString(2));
                node.ido4.setValue(mask);
            }
            
        });

    }

    RED.nodes.registerType('TinkerForge Digital-Out', tinkerForgeDigitalOut);

    function tinkerForgeAmbientLight(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        var node = this;

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.al = new Tinkerforge.BrickletAmbientLightV2(node.sensor, node.ipcon);
        });

        node.interval = setInterval(function(){
            if (node.al) {
                node.al.getIlluminance(function(lux) {
                    node.send({
                        topic: node.topic || 'light',
                        payload: lux/100.0
                    })
                },
                function(err) {
                    //error
                    node.error(err);
                });
            }
        },(node.pollTime * 1000));

        node.on('close',function() {
            clearInterval(node.interval);
            node.ipcon.disconnect();
        });
    }

    RED.nodes.registerType('TinkerForge AmbientLight', tinkerForgeAmbientLight);

    function tinkerForgeLEDStrip(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.rgb = n.rgb || "rgb";
        this.mode = n.mode;
        this.bgnd = n.bgnd || "0,0,0"; 
        this.pixels = n.pixels;
        this.wipe = Number(n.wipe || 40)
        if (this.wipe <0) {this.wipe = 0}

        var needle = "255,255,255";

        var node = this;

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.led = new Tinkerforge.BrickletLEDStrip(node.sensor, node.ipcon);
            setBackground();
            sendRGB();
        });

        

        node.r = new Array(Number(node.pixels));
        node.g = new Array(Number(node.pixels));
        node.b = new Array(Number(node.pixels));

        function sendRGB() {
            // console.log("setting RGB");
            // console.log("red - %j", node.r);
            // console.log("green - %j", node.g);
            // console.log("blue - %j", node.b);
            if (node.pixels < 16) {
                // console.log("short");
                node.led.setRGBValues(0,node.pixels,node.r,node.g,node.b);
            } else {
                // console.log("long");
                var c = Math.floor(node.pixels / 16);
                var remainder = node.pixels % 16;
                for (var i = 0; i<c ; i++) {
                    // console.log("block");
                    // console.log("red - %j", node.r.slice((i*16), ((i+1)*16)));
                    // console.log("green - %j", node.g.slice((i*16), ((i+1)*16)));
                    // console.log("blue - %j", node.b.slice((i*16), ((i+1)*16)));
                    node.led.setRGBValues(i*16,16,
                        node.r.slice((i*16), ((i+1)*16)),
                        node.g.slice((i*16), ((i+1)*16)),
                        node.b.slice((i*16), ((i+1)*16)));
                }
                if (remainder) {
                    // console.log("remainder");
                    // console.log("red - %j", node.r.slice((c*16), (c*16) + remainder));
                    // console.log("green - %j", node.g.slice((c*16), (c*16) + remainder));
                    // console.log("blue - %j", node.b.slice((c*16), (c*16) + remainder));
                    node.led.setRGBValues((c * 16),remainder,
                        node.r.slice((c*16), (c*16) + remainder),
                        node.g.slice((c*16), (c*16) + remainder),
                        node.b.slice((c*16), (c*16) + remainder));
                }
            }
        }

        function setBackground() {
            var parts = node.bgnd.split(',');
            if (node.rgb === 'rgb') {
                node.r.fill(parts[0]);
                node.g.fill(parts[1]);
                node.b.fill(parts[2]);
            } else if ( node.rgb === 'brg') {
                node.r.fill(parts[2]);
                node.g.fill(parts[0]);
                node.b.fill(parts[1]);
            }
        }

        node.on('input', function(msg){

            if (msg.hasOwnProperty('payload')) {
                var pay = msg.payload.toString().toUpperCase();
                var parts = pay.split(',');
                switch(parts.length) {
                    case 1:
                        // #rrggbb
                        var col = colours.getRGB(parts[0],"rgb");
                        parts = col.split(",");
                    case 3:
                        node.bgnd = parts.join(',');
                        setBackground();
                        break;
                    case 2:
                        // length,colour or colour,length
                        var col = "";
                        var index = -1;
                        if (isNaN(parts[1])){
                            col = colours.getRGB(parts[1],"rgb");
                            index = parts[0];
                        } else {
                            col = colours.getRGB(parts[0],"rgb");
                            index = parts[1];
                        }
                        
                        parts = new Array(4);
                        var colParts = col.split(",");
                        parts[0] = index;
                        parts[1] = colParts[0];
                        parts[2] = colParts[1];
                        parts[3] = colParts[2];
                    case 4:
                        setBackground();
                        switch (node.mode){
                            case 'pcent':
                                var n = Math.round(node.pixels * (parts[0] / 100));
                                parts[0] = n;
                            case 'pixels':
                                if (node.rgb === 'rgb') {
                                    node.r.fill(parts[1],0,parts[0]);
                                    node.g.fill(parts[2],0,parts[0]);
                                    node.b.fill(parts[3],0,parts[0]);
                                } else if (node.rgb ==='brg'){
                                    node.r.fill(parts[3],0,parts[0]);
                                    node.g.fill(parts[1],0,parts[0]);
                                    node.b.fill(parts[2],0,parts[0]);
                                }
                                break;
                            case 'pcentneedle':
                                var n = Math.round(node.pixels * (parts[0] / 100));
                                parts[0] = n;
                            case 'pixelsneedle':
                                if (node.rgb === 'rgb') {
                                    node.r[parts[0]] = parts[1];
                                    node.g[parts[0]] = parts[2];
                                    node.b[parts[0]] = parts[3];
                                } else if (node.rgb === 'brg') {
                                    node.r[parts[0]] = parts[3];
                                    node.g[parts[0]] = parts[1];
                                    node.b[parts[0]] = parts[2];
                                }
                                break;
                        }
                        break;
                }
                sendRGB();
            }
        });

        node.on('close',function() {
            node.ipcon.disconnect();
        });

    }

    RED.nodes.registerType('TinkerForge LEDStrip', tinkerForgeLEDStrip);


    function tinkerForgeAnalogOut(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        var node = this;

        node.ipcon = new Tinkerforge.IPConnection(); //devices[this.device].ipcon;
        node.ipcon.setAutoReconnect(true);
        node.ipcon.connect(devices[node.device].host, devices[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.ao = new Tinkerforge.BrickletAnalogOutV2(node.sensor, node.ipcon);
        });


        node.on('input', function(msg){
            if(node.ao) {
                if (typeof msg.payload === 'number') {
                    if (msg.payload >=0 && msg.parts <= 12) {
                        var v = Math.round(msg.payload * 1000);
                        node.ao.setOutputVoltage(v);
                    }
                }
            }
        });
        

        node.on('close',function() {
            node.ipcon.disconnect();
        });
    }

    RED.nodes.registerType('TinkerForge AnalogOut', tinkerForgeAnalogOut);

    //Discovery HTTP endpoints

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