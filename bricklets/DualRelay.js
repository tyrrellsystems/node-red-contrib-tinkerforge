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

	function tinkerForgeDualRelay(n) {
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
            node.dr = new Tinkerforge.BrickletDualRelay(node.sensor, node.ipcon);
        });

        node.on('input', function(msg){
        	if (msg.hasOwnProperty('payload') && Array.isArray(msg.payload)){
                if (typeof msg.payload[0] === 'boolean') {
        		  var one = msg.payload[0];
        		  var two = msg.payload[1];
        		  node.dr.setState(one,two);
                } else if (typeof msg.payload[0] === 'number'){
                    var one = msg.payload[0] ? true:false;
                    var two = msg.payload[1] ? true:false;
                    node.dr.setState(one,two);
                }
        	}
        });

        node.on('close',function() {
            node.ipcon.disconnect();
        });
	}

    RED.nodes.registerType('TinkerForge DualRelay', tinkerForgeDualRelay);
};
