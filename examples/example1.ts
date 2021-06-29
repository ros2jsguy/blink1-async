import {Blink1, Blink1_LEDN, BlinkRate} from '../blink1-async';

async function example() {
  console.log('devices; ', Blink1.devices());

  let blink1: Blink1 = new Blink1();
  console.log("version: " , await blink1.version() );

  console.log('set color: red', await blink1.setRGB(255));
  console.log('read rgb: ', await blink1.rgb(Blink1_LEDN.LEDA));
  await Blink1.delay(2000);

  console.log('Blink green at VERY_FAST rate (100 ms) for 5 seconds');
  await blink1.blink(0, 255, 0, BlinkRate.VERY_FAST, 5000);
  
  console.log('Blink blue at SLOW rate (1000 ms) for 5 seconds');
  await blink1.blink(0, 0, 255, BlinkRate.SLOW, 5000);

  console.log('Show solid yellow for 5 seconds');
  await blink1.blink(255, 255, 0, 10000, 5000);

  await blink1.off();

  console.log('Color pattern (line-1):', await blink1.readPatternLine(1));

  console.log('Clearing pattern');
  await blink1.clearPattern();
  console.log('Color pattern (line-1):', await blink1.readPatternLine(1));

  await blink1.clearPattern();
  await blink1.close();

  console.log('completed');
}

example();
