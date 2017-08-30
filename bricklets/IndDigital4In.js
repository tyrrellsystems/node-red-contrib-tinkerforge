/**
 * Copyright 2017 IBM Corp.
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


var Tinkerforge = require('tinkerforge');
var devices = require('../lib/devices');

module.exports = function(RED) {
    "use strict";

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
        var devs = devices.getDevices();
        node.ipcon.connect(devs[node.device].host, devs[node.device].port,function(error){
            if(error) {
                node.warn("couldn't connect");
            }
        });

        node.ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function(connectReason) {
            node.idi4 = new Tinkerforge.BrickletIndustrialDigitalIn4(node.sensor, node.ipcon);
            //((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3))
            node.idi4.setInterrupt(15);
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

            node.idi4.getValue(function(valueMask){
                if (valueMask & 1) {
                    node.send({
                        topic: node.topic + "/0",
                        payload: true
                    });
                } else {
                    node.send({
                        topic: node.topic + "/0",
                        payload: false
                    });
                }

                if (valueMask & 2) {
                    node.send({
                        topic: node.topic + "/1",
                        payload: (valueMask & 2) != 0
                    });
                } else {
                    node.send({
                        topic: node.topic + "/1",
                        payload: false
                    });
                }

                if (valueMask & 4) {
                    node.send({
                        topic: node.topic + "/2",
                        payload: (valueMask & 4) != 0
                    });
                } else {
                    node.send({
                        topic: node.topic + "/2",
                        payload: false
                    });
                }

                if (valueMask & 8) {
                    node.send({
                        topic: node.topic + "/3",
                        payload: (valueMask & 8) != 0
                    });
                } else {
                    node.send({
                        topic: node.topic + "/3",
                        payload: false
                    });
                }
                node.currentState = valueMask;
            })
        });


        node.on('close',function() {
            node.ipcon.disconnect();
        });

    }

    RED.nodes.registerType('TinkerForge Digital-In', tinkerForgeDigitalIn);
};
