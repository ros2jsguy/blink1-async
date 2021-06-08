# blink1-async - A asynchronous TypeScript api for Blink1 LED device
Controlling a Blink1 Led is simple using this package. Much of the API is asynchronous (i.e., returns Promise that you can await on) and is fully documented using TSDoc. 


# Install
```
npm install https://github.com/ros2jsguy/node-blink-async
```

# Example
```
import {Blink1Async, BlinkRate} from '../blink1-async';

async function example() {
  console.log('devices; ', Blink1Async.devices());

  let blink1: Blink1Async = new Blink1Async();
  console.log("version: " , await blink1.version() );

  console.log('Blink green at VERY_FAST rate (100 ms) for 5 seconds');
  await blink1.blink(0, 255, 0, BlinkRate.VERY_FAST, 5000);
  
  console.log('Blink blue at SLOW rate (1000 ms) for 5 seconds');
  await blink1.blink(0, 0, 255, BlinkRate.SLOW, 5000);

  console.log('Show solid yellow for 5 seconds');
  await blink1.blink(255, 255, 0, 10000, 5000);

  await blink1.off();
  await blink1.clearPattern();
  await blink1.close();

  console.log('completed');
}

example();
```

# Developer Notes
I develop mostly in TypeScript and prefer using modern JS features when I have the option. 
Working directly with the node-blink1 package which has been around for awhile, felt too
retro for my liking, e.g., no jsdoc, callback-based api... 
I mean no disrespect to the node-blink1 author(s) who's priority 
for backward compatibility supercedes breaking the package just to use a new
wizbang language feature. While developing a robot using TypeScript 
on a Raspi4 I wanted to integrate an old Blink1 led from my kit
into the design. That led me to creating this package that makes it easier to 
to asynchronously control a Blink1 LED from TypeScript.

# Credits
This package uses the [node-blink1](https://www.npmjs.com/package/node-blink1) package to perform the low level control of Blink1 devices