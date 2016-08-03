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
var bricklets = require('./bricklets');

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
        }
    );
};

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
            //newDevice(node.host,node.port,node.id);
        }
            
    };

    RED.nodes.registerType('TinkerForgeConfig', tinkerForgeConfig);
};