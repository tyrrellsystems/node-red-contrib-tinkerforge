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
var colours = require('../lib/colours');
var devices = require('../lib/devices');

module.exports = function(RED) {
	function tinkerForgeLEDStrip(n) {
        RED.nodes.createNode(this,n);

        this.device = n.device;
        this.sensor = n.sensor;
        this.name = n.name;
        this.rgb = n.rgb || "rgb";
        this.mode = n.mode;
        this.bgnd = n.bgnd || "0,0,0";
        this.pixels = n.pixels;
        this.wipe = Number(n.wipe || 40)
        if (this.wipe <0) {this.wipe = 0}

        var needle = "255,255,255";

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
            node.led = new Tinkerforge.BrickletLEDStrip(node.sensor, node.ipcon);
            setBackground();
            sendRGB();
        });



        node.r = new Array(Number(node.pixels));
        node.g = new Array(Number(node.pixels));
        node.b = new Array(Number(node.pixels));

        function sendRGB() {
            // console.log("setting RGB");
            // console.log("red - %j", node.r);
            // console.log("green - %j", node.g);
            // console.log("blue - %j", node.b);
            if (node.pixels < 16) {
                // console.log("short");
                node.led.setRGBValues(0,node.pixels,node.r,node.g,node.b);
            } else {
                // console.log("long");
                var c = Math.floor(node.pixels / 16);
                var remainder = node.pixels % 16;
                for (var i = 0; i<c ; i++) {
                    // console.log("block");
                    // console.log("red - %j", node.r.slice((i*16), ((i+1)*16)));
                    // console.log("green - %j", node.g.slice((i*16), ((i+1)*16)));
                    // console.log("blue - %j", node.b.slice((i*16), ((i+1)*16)));
                    node.led.setRGBValues(i*16,16,
                        node.r.slice((i*16), ((i+1)*16)),
                        node.g.slice((i*16), ((i+1)*16)),
                        node.b.slice((i*16), ((i+1)*16)));
                }
                if (remainder) {
                    // console.log("remainder");
                    // console.log("red - %j", node.r.slice((c*16), (c*16) + remainder));
                    // console.log("green - %j", node.g.slice((c*16), (c*16) + remainder));
                    // console.log("blue - %j", node.b.slice((c*16), (c*16) + remainder));
                    node.led.setRGBValues((c * 16),remainder,
                        node.r.slice((c*16), (c*16) + remainder),
                        node.g.slice((c*16), (c*16) + remainder),
                        node.b.slice((c*16), (c*16) + remainder));
                }
            }
        }

        function setBackground() {
            var parts = node.bgnd.split(',');
            if (node.rgb === 'rgb') {
                node.r.fill(parts[0]);
                node.g.fill(parts[1]);
                node.b.fill(parts[2]);
            } else if ( node.rgb === 'brg') {
                node.r.fill(parts[2]);
                node.g.fill(parts[0]);
                node.b.fill(parts[1]);
            }
        }

        node.on('input', function(msg){

            if (msg.hasOwnProperty('payload')) {
                var pay = msg.payload.toString().toUpperCase();
                var parts = pay.split(',');
                switch(parts.length) {
                    case 1:
                        // #rrggbb
                        var col = colours.getRGB(parts[0],"rgb");
                        parts = col.split(",");
                    case 3:
                        node.bgnd = parts.join(',');
                        setBackground();
                        break;
                    case 2:
                        // length,colour or colour,length
                        var col = "";
                        var index = -1;
                        if (isNaN(parts[1])){
                            col = colours.getRGB(parts[1],"rgb");
                            index = parts[0];
                        } else {
                            col = colours.getRGB(parts[0],"rgb");
                            index = parts[1];
                        }

                        parts = new Array(4);
                        var colParts = col.split(",");
                        parts[0] = index;
                        parts[1] = colParts[0];
                        parts[2] = colParts[1];
                        parts[3] = colParts[2];
                    case 4:
                        setBackground();
                        switch (node.mode){
                            case 'pcent':
                                var n = Math.round(node.pixels * (parts[0] / 100));
                                parts[0] = n;
                            case 'pixels':
                                if (node.rgb === 'rgb') {
                                    node.r.fill(parts[1],0,parts[0]);
                                    node.g.fill(parts[2],0,parts[0]);
                                    node.b.fill(parts[3],0,parts[0]);
                                } else if (node.rgb ==='brg'){
                                    node.r.fill(parts[3],0,parts[0]);
                                    node.g.fill(parts[1],0,parts[0]);
                                    node.b.fill(parts[2],0,parts[0]);
                                }
                                break;
                            case 'pcentneedle':
                                var n = Math.round(node.pixels * (parts[0] / 100));
                                parts[0] = n;
                            case 'pixelsneedle':
                                if (node.rgb === 'rgb') {
                                    node.r[parts[0]] = parts[1];
                                    node.g[parts[0]] = parts[2];
                                    node.b[parts[0]] = parts[3];
                                } else if (node.rgb === 'brg') {
                                    node.r[parts[0]] = parts[3];
                                    node.g[parts[0]] = parts[1];
                                    node.b[parts[0]] = parts[2];
                                }
                                break;
                        }
                        break;
                }
                sendRGB();
            }
        });

        node.on('close',function() {
            node.ipcon.disconnect();
        });

    }

    RED.nodes.registerType('TinkerForge LEDStrip', tinkerForgeLEDStrip);
}
