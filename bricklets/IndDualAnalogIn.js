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


var Tinkerforge = require('tinkerforge');
var devices = require('../lib/devices');

module.exports = function(RED) {
    "use strict";
    
    function tinkerForgeIndDualAnalogIn(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.topic = n.topic;
        this.pollTime = n.pollTime;
        this.state = [0,0];
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
            node.idai = new Tinkerforge.BrickletIndustrialDualAnalogIn(node.sensor, node.ipcon);

            node.interval = setInterval(function(){
                node.idai.getVoltage(0,
                    function (voltage){
                        var msg = {
                            topic: (node.topic || "") + "/0",
                            payload: voltage / 1000
                        };
                        node.send(msg);

                        node.idai.getVoltage(1,
                            function (voltage){
                                var msg = {
                                    topic: (node.topic || "") + "/1",
                                    payload: voltage / 1000
                                };
                                node.send(msg);
                            }, function(err){
                                if (err == 31) {
                                    node.error("Not connected");
                                } else {
                                    node.error("Other err " + err );
                                }
                            }
                        );

                    }, function(err){
                        if (err == 31) {
                            node.error("Not connected");
                        }
                    }
                );
            },(node.pollTime * 1000));

        });


        node.on('close',function() {
            node.ipcon.disconnect();
            clearInterval(node.interval);
        });
    };

    RED.nodes.registerType('TinkerForge IndDualAnalogIn', tinkerForgeIndDualAnalogIn);
};