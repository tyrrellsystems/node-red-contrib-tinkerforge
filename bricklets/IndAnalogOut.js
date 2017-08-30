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

  function tinkerForgeIndAnalogOut(n) {
    RED.nodes.createNode(this,n);
    this.device = n.device;
    this.sensor = n.sensor;
    this.name = n.name;
    this.modev = n.modev;
    this.modec = n.modea;
    this.control = n.control;
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
        node.ao = new Tinkerforge.BrickletIndustrialAnalogOut(node.sensor, node.ipcon);
        var volts = Tinkerforge.BrickletIndustrialAnalogOut.VOLTAGE_RANGE_0_TO_5V;
        var amps = Tinkerforge.BrickletIndustrialAnalogOut.CURRENT_RANGE_4_TO_20MA;
        if (node.modev === 'volts10') {
          volts = Tinkerforge.BrickletIndustrialAnalogOut.VOLTAGE_RANGE_0_TO_10V;
        }

        if (node.modec === 'amps20') {
          amps = Tinkerforge.BrickletIndustrialAnalogOut.CURRENT_RANGE_0_TO_20MA;
        } else if (node.modec === 'amps24') {
          amps = Tinkerforge.BrickletIndustrialAnalogOut.CURRENT_RANGE_0_TO_24MA;
        }
        node.ao.setConfiguration(volts,amps);
        node.ao.setVoltage(0);
        node.ao.setCurrent(0);
        node.ao.enable();
    });


    node.on('input', function(msg){
      if (typeof msg.payload === 'number') {
        if (node.control === 'volts') {
          if (node.modev === 'volts5') {
            if (msg.payload >= 0 && msg.payload <= 5) {
              node.ao.setVoltage(msg.payload * 1000);
            }
          } else if (node.modev === 'volts10') {
            if (msg.payload >= 0 && msg.payload <= 10) {
              node.ao.setVoltage(msg.payload * 1000);
            }
          }
        } else if (node.control === 'amps') {
          if (node.modec === 'amps4') {
            if (msg.payload >= 4 && msg.payload <= 20) {
              node.ao.setCurrent(msg.payload * 1000);
            }
          } else if (node.modec === 'amps20') {
            if (msg.payload >= 0 && msg.payload < 20){
              node.ao.setCurrent(msg.payload * 1000);
            }
          } else if (node.modec === 'amps24') {
            if (msg.payload >= 0 && msg.payload < 24){
              node.ao.setCurrent(msg.payload * 1000);
            }
          }
        }
      }
    });
  }

  RED.nodes.registerType('TinkerForge IndAnalogOut', tinkerForgeIndAnalogOut);
};
