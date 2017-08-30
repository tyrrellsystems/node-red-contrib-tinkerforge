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

	function tinkerForgeDigitalOut(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.state = { "0" : false, "1": false, "2": false, "3": false};
        var node = this;

        this.queue = [];

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
            node.ido4 = new Tinkerforge.BrickletIndustrialDigitalOut4(node.sensor, node.ipcon);
            for (var i=0; i<node.queue.length; i++) {
                node.emit('input', node.queue[i]);
            }
        });

        node.on('input', function(msg){

            if (!node.ido4) {
                node.queue.push(msg);
                return;
            }

            var mask = -1;
            if (Array.isArray(msg.payload)) {
                if (msg.payload.length == 4) {
                    mask = 0;
                    for (var i=0; i<4; i++) {
                        if (msg.payload[i]) {
                            var n = (1 << i);
                            mask += n;
                            node.state["" + i] = true;
                        } else {
                            node.state["" + i] = false;
                        }
                    }

                }
            } else if (msg.topic && msg.topic.indexOf('/') != -1 && typeof msg.payload === "boolean") {
                if (msg.topic.indexOf('/') != msg.topic.length) {
                    var index = msg.topic.substring(msg.topic.indexOf('/')+1);
                    mask = 0;
                    node.state[""+ index] = msg.payload;
                    for (var i=0; i<4; i++) {
                        if (node.state["" + i]) {
                            mask += (1 << i);
                        }
                    }

                }
            } else if (typeof msg.payload === "object") {
                mask = 0;
                if (msg.payload.hasOwnProperty("0")) {
                    if (msg.payload["0"]) {
                        mask += (1 << 0);
                        node.state["0"] = true;
                    } else {
                        node.state["0"] = false;
                    }

                } else {
                    if (node.state["0"]) {
                        mask += (1 <<0);
                    }
                }

                if (msg.payload.hasOwnProperty("1")) {
                    if(msg.payload["1"]) {
                        mask += (1 << 1);
                        node.state["1"] = true;
                    } else {
                        node.state["1"] = false;
                    }
                } else {
                    if (node.state["1"]) {
                        mask +=(1 << 1);
                    }
                }

                if (msg.payload.hasOwnProperty("2")) {
                    if(msg.payload["2"]) {
                        mask += (1 << 2);
                        node.state["2"] = true;
                    } else {
                        node.state["2"] = false;
                    }
                } else {
                    if (node.state["2"]) {
                        mask += (1 << 2);
                    }
                }

                if (msg.payload.hasOwnProperty("3")) {
                    if(msg.payload["3"]) {
                        mask += (1 << 3);
                        node.state["3"] = true;
                    } else {
                        node.state["3"] = false;
                    }
                } else {
                    if (node.state["3"]) {
                        mask += (1 << 3);
                    }
                }

            } else if (typeof msg.payload === 'string') {
                var parts = msg.payload.split(',');
                if (parts.length === 4) {
                    for (var i=0; i<4; i++) {
                        if (parts[i] == '1') {
                            var n = (1 <<i);
                            mask += n;
                        }
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
}
