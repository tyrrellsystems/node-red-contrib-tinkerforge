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

	function tinkerForgeIO4(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.topic = n.topic;
        this.name = n.name;
        this.moded0 = n.moded0;
        this.moded1 = n.moded1;
        this.moded2 = n.moded2;
        this.moded3 = n.moded3;
        this.state = { "0" : false, "1": false, "2": false, "3": false};
        var node = this;
        this.queue = [];

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
            node.io = new Tinkerforge.BrickletIO4(node.sensor, node.ipcon);
            //((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3))
            var result0 = 0;
            var result1 = 0;
            var result2 = 0;
            var result3 = 0;
            if (node.moded0 === 'input'){
              result0 = 1;
            }else if (node.moded0 === 'output'){
              result0 = 0;
            }
            if (node.moded1 === 'input'){
              result1 = 2;
            }else if (node.moded1 === 'output'){
              result1 = 0;
            }
            if (node.moded2 === 'input'){
              result2 = 4;
            }else if (node.moded2 === 'output'){
              result2 = 0;
            }
            if (node.moded3 === 'input'){
              result3 = 8;
            }else if (node.moded3 === 'output'){
              result3 = 0;
            }
            var result = result0 +result1 + result2 + result3;

            for (var i=0; i<node.queue.length; i++) {
                node.emit('input', node.queue[i]);
            }
            /*node.send({
                topic: node.topic + "settings",
                payload: result
            }); */
            node.io.setConfiguration(result,'i',true);
            node.io.setInterrupt(result);
            node.io.setConfiguration(15-result,'o',false);
            node.io.on(Tinkerforge.BrickletIO4.CALLBACK_INTERRUPT,
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
            node.io.getValue(function(valueMask){
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
        node.on('input', function(msg){

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

            }else if (msg.topic && msg.topic.indexOf('/') != -1 && typeof msg.payload === "boolean") {
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
            }if (mask >= 0) {
                console.log(mask.toString(2));
                node.io.setValue(mask);
                /*node.send({
                    topic: node.topic,
                    payload: mask
                }); */
            }

        });
      });
        node.on('close',function() {
            node.ipcon.disconnect();
        });
      };

    RED.nodes.registerType('TinkerForge IO-4', tinkerForgeIO4);
};
