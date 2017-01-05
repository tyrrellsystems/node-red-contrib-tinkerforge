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
var bricklets = require('./bricklets');
var bodyParser = require('body-parser');
var devices = require('./devices');

module.exports = function(RED) {
    "use strict";

	var settings = RED.settings;

    function tinkerForgeConfig(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host ? n.host : '127.0.0.1';
        this.port = n.port;
        this.name = n.host + ":" + n.port;
        this.id = n.id;

        var node = this;

        var devs = devices.getDevices();

        if (devs[node.name]) {
            //already exists?
        } else {
            devices.newDevice(node.host,node.port,node.id);
        }
            
    };


    RED.nodes.registerType('TinkerForgeConfig', tinkerForgeConfig);

    RED.httpAdmin.use('/TinkerForge/device',bodyParser.json());

    RED.httpAdmin.post('/TinkerForge/device', function(req,res){
        if (!devices.getDevices()[req.body.id]) {
            devices.newDevice(req.body.host, req.body.port, req.body.id);
        }
    });

    RED.httpAdmin.get('/TinkerForge/:device/sensors/:type', function(req,res){
        var dev = devices.getDevices()[req.params.device];
        //console.log("%j - - " + req.params.device, dev);
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