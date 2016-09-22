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
var Tinkerforge = require('tinkerforge');
var devices = require('../lib/devices');

module.exports = function(RED) {
	function tinkerForgeDigitalOut(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        var node = this;

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
            } else if (typeof msg.payload === "object") {
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