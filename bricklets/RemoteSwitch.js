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


"use strict";
var Tinkerforge = require('tinkerforge');
var devices = require('../lib/devices');

module.exports = function(RED) {

	function tinkerForgeRemoteSwitch(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.mode = n.mode;
	    this.addr1 = n.addr1;
	    this.addr2 = n.addr2;
        this.topic = n.topic;
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
            node.md = new Tinkerforge.BrickletRemoteSwitch(node.sensor, node.ipcon);
        });

	node.on('input', function(msg){
        if(node.md) {
            var switchto;
            var input = false;
            if (typeof msg.payload === 'number') {
                if (msg.payload == 1) {
                    switchto = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_ON;
                } else {
                    switchto = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF;
                }
                input = true;
            } else if (typeof msg.payload === 'boolean') {
                if (msg.payload) {
                    switchto = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_ON;
                } else {
                    switchto = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF;
                }
                input = true;
            }

            if (input) {
                switch (node.mode) {
                    case 'A':
                        node.md.switchSocketA(node.addr1, node.addr2, switchto);
                        break;
                    case 'B':
                        node.md.switchSocketB(node.addr1, node.addr2, switchto);
                        break;
                    case 'C':
                        node.md.switchSocketC(node.addr1, node.addr2, switchto);
                        break;
                }
            }
	    }
    });

        node.on('close',function() {
            node.ipcon.disconnect();
        });
    }

    RED.nodes.registerType('Tinkerforge RemoteSwitch', tinkerForgeRemoteSwitch);
}
