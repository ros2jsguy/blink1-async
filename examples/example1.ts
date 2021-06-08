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
