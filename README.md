# A set of Node-RED nodes to access Tinkerforge bricklets

These nodes make use of [Tinkerforge's][1] [javascript][2] library to connect
to a local brickd instance or to a remote instance (via Ethernet/WiFi brick)

## Install

From npm

```npm install node-red-contrib-tinkerforge```

or to from the git head stream

```npm install tyrrellsystems/node-red-contrib-tinkerforge```

## Supported Bricklets

Currently there are nodes for the following bricklets

 - Humidity Bricklet
 - Humidity V2 Bricklet
 - Moisture Bricklet
 - Temperature Bricklet
 - CO2 Bricklet
 - Industrial Diginal In 4 Bricklet
 - Industrial Diginal Out 4 Bricklet
 - PTC Bricklet
 - LED Strip Bricklet
 - Motion Detector Bricklet
 - Analog Out Bricklet 2.0
 - Ambient Light Bricklet
 - Remote Switch Bricklet
 - Industrial Analog Out Bricklet
 - Industrial Dual Analog In Bricklet
 - Dual Relay Bricklet
 - Temperature IR
 - Tilt
 - Distance US
 - Distance IR
 - Voltage/Current
 - Hall Effect
 - Sound Intensity
 - Linear Poti
 - Rotary Poti
 - Line
 - Barometer
 - Piezo Speaker
 - Laser Range Finder
 - IO-4
 - Distance IR V2.0

Adding more should be pretty trivial, these are just the bricks I currently
access to for testing

## License
Apache 2.0


 [1]:http://www.tinkerforge.com/en
 [2]:http://www.tinkerforge.com/en/doc/index.html#/software-javascript-open
