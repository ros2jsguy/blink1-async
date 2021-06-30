

const _blink1Lib = require('node-blink1');

export enum Blink1_LEDN {
  ALL = 0,
  LEDA = 1,
  LEDB = 2
}

export type RGBData = {
  r: number;
  g: number;
  b: number;
}

export type PatternLineData = {
  r: number;
  g: number;
  b: number;
  fadeMillis: number
}

export enum BlinkRate {
  SLOW = 1000,
  MED = 500,
  FAST = 250,
  VERY_FAST = 100
} 

const MAX_BLINK_DURATION = 0x1 << 30;

/**
 * An asynchronous api for controlling blink(1) USB LED devices.
 */
export class Blink1 {

  // The blink(1) instance from node-blink1 package that does all of the work.
  private _blink1: any;
  private _isClosed: boolean;
  private _timeout: number | undefined;

  /**
   * Find all connected blink(1) devices.
   * @returns Array of found blink(1) serial numbers.
   */
  static devices(): Array<string> {
    return _blink1Lib.devices();
  }

  /**
   * Utility method that a sender can await on from an async function or method 
   * to create a delay-like execution experience.
   * @param [millis=1000] - delay period in milliseconds, if millis <= 0 then 2^31
   * @returns A Promise that the sender can await on to simulate a delay
   */
  static delay(millis=1000): Promise<void> {
    let duration = millis <= 0 || millis > MAX_BLINK_DURATION ? MAX_BLINK_DURATION : millis;
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  } 

  /**
   * Create a high-level reference to a blink(1) HID device.
   * @param [serialNumber] The serial number of the device to reference (see devices()). 
   *                       When undefined choose the first blink(1) device found.
   * @param [enableDegamma=true] Enablement for degamma color correction (crappy name)
   */
  constructor(serialNumber?: string, enableDegamma=true) {
    this._blink1 = new _blink1Lib(serialNumber);
    this._isClosed = false;

    process.on('SIGINT', async () => {
      if (!this.isClosed()) {
        await this.close();
        process.exit(0);
      }
    })
  }

  /**
   * Get the degamma setting. 
   * Default value is true
   * @returns degamma enabled flag
   */
  get enableDegamma(): boolean {
    return this._blink1.enableDegamma;
  }

  /**
   * Update the degamma setting.
   * @param enabled The new enabled or disabled value
   */
  set enableDegamma(enabled: boolean) {
    this._blink1.enableDegamma = enabled;
  }
  
  /**
   * Return the version number of the blink(1) HID device.
   * @returns Promise<number> with version string to await for completion
   */
  version(): Promise<number> {
    return new Promise(resolve => {
      this._blink1.version(resolve);
    });
  }

  // TODO - commented out getSerialNumber() and getId() as they are causing
  // blink(1) device to crash. Investigate asap.
  // /**
  //  * Access the blink(1) serial number
  //  * @returns a Promise that returns the blink(1) device serialNumber
  //  */
  // getSerialNumber(): Promise<string> {
  //   return new Promise((resolve) => {
  //     this._blink1.getId(resolve);
  //   });
  // }

  // /**
  //  * Access the blink(1) serial number
  //  * @returns a Promise that returns the blink(1) device serialNumber
  //  * @deprecated use getSerialNumber()
  //  */
  // getId(): Promise<string> {
  //   return new Promise((resolve) => {
  //     this._blink1.getId(resolve);
  //   });
  // }

  /**
   * Close the underlying HID device.
   * @returns Promise<void> to await for completion
   */
   async close(): Promise<void> {
    if (this.isClosed()) return;
    
    this._isClosed = true;
    await this.off(); 
    await new Promise(resolve => this._blink1.close(resolve));
  }

  isClosed(): boolean {
    return this._isClosed;
  }

  /**
   * Transition one or both LEDs to a new RGB color.
   * @param fadeMillis The milliseconds for the transition.
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @param [led=Blink1_LEDN.ALL] Led(s) to update.
   * @returns Promise<void> to await for completion
   */
  fadeToRGB(fadeMillis: number, red=0, green=0, blue=0, led=Blink1_LEDN.ALL): Promise<void> {
    return fadeMillis > 0 ?
      new Promise(resolve => this._blink1.fadeToRGB(fadeMillis, red, green, blue, led, resolve)) :
      new Promise(resolve => this._blink1.setRGB(red, green, blue, resolve));
  }

  /**
   * Access the device current RGB value.
   * @param led The led to read the RGB value from.
   * @returns A promise that resolves to the current RGB values.
   */
  rgb(led: Blink1_LEDN): Promise<RGBData> {
    return new Promise(resolve => this._blink1.rgb(led, resolve));
  }

  /**
   * Immediately output an RGB color. For mk2 devices both LEDs will 
   * present the RGB color.
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @returns Promise<void> to await for completion
   */
  setRGB(red=0, green=0, blue=0): Promise<void> {
    return new Promise(resolve => {
      this._blink1.setRGB(red, green, blue, resolve);
    });
  }

  /**
   * Immediately disable output. 
   * @returns Promise<void> to await for completion
   */
  async off(): Promise<void> {
    await this.stop();
    await this.setRGB();
    await new Promise((resolve) => this._blink1.off(resolve));
  }

  /**
   * Animate the sequence of color patterns in RAM beginning at a specific index in the sequence.
   * @param startPosition The index [0-31] into the sequence of color patterns.
   * @returns Promise<void> to await for completion
   */
  play(startPosition=0): Promise<void> {
    return new Promise(resolve => {
      this._blink1.play(startPosition, resolve);
    });
  }

  /**
   * Repeatedly animate a range of color patterns in RAM 
   * beginning at start index in the sequence to an end index
   * the sequence. 
   * @param [startIndex=0] The start index [0-31] in the sequence of color patterns
   * @param [endIndex=0] The end index [0-31] in the sequence of color patterns
   * @param [count=1] The number of times to loop, 0 = loop infinitely
   * @returns Promise<void> to await for completion
   */
  playLoop(startPosition=0, endPosition=0, count=0): Promise<void> {
    return new Promise(resolve => {
      this._blink1.playLoop(startPosition, endPosition, count, resolve);
    });
  }

  /**
   * Immediately stop presenting color patterns from RAM.
   * @returns Promise<void> to await for completion
   */
  stop(): Promise<void> {
    return new Promise(resolve => this._blink1.pause(resolve));
  }

  /**
   * Return the color pattern data at position in RAM.
   * @param [position=0] The index [0-31] into the sequence of color patterns
   * @returns Promise<string> returnin the pattern line read
   */
  readPatternLine(position=0): Promise<string> {
    return new Promise(resolve => {
      this._blink1.readPatternLine(position, resolve);
    });
  }

  /**
   * Insert a new color pattern into the sequence of color patterns in RAM.
   * @param fadeMillis The duration in milliseconds for the transition from the current color to the new RGB colors of this pattern
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @param [position=0] The position [0-31] in the color sequence to insert this pattern.
   * @returns Promise<void> to await for completion
   */
  writePatternLine(fadeMillis: number, red=0, green=0, blue=0, position=0): Promise<void> {
    return new Promise(resolve => 
      this._blink1.writePatternLine(fadeMillis, red, green, blue, position, resolve));
  }

  /**
   * Save all patterns in to Blink(1) non-volatile memory.
   * @returns Promise<void> to await for completion
   */
  savePattern(): Promise<void> {
    return new Promise(resolve => this._blink1.savePattern(resolve));
  }

   /**
   * Clear all pattern data from Blink(1) non-volatile memory.
   * @returns Promise<void> to await for completion
   */
  clearPattern(): Promise<void> {
    return new Promise(async resolve => {
      for (let i=0; i< 32; i++) {
        await this._blink1.writePatternLine(0, 0, 0, 0, i);
      }
    });
  }

  /**
   * Set the led to which future writePattern() calls will apply.
   * @param led The led to make default
   * @returns Promise<void> to await for completion
   */
  setLedN(led=Blink1_LEDN.ALL): Promise<void> {
    return new Promise(resolve => this._blink1.setLedN(led, resolve));
  }

  /**
   * Enable the ServerDown feature that will trigger a display pattern
   * @param triggerMillis
   * @returns Promise<void> to await for completion
   */
  enableServerDown(triggerMillis=10000) {
    return new Promise((resolve) =>
      this._blink1.enableServerDown(triggerMillis, resolve));
  }

  /**
   * Disable the ServerDown feature.
   * @returns A promise to await on.
   */
  disableServerDown() {
    return new Promise(resolve => this._blink1.disableServerDown(resolve));
  }

  /**
   * Continuously play an alternating pattern of the rgb color parameter in an on/off sequence.
   * Senders should call stop() or off() to cancel the blink loop.
   * 
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @returns Promise<void> to await for completion
   */
  async blink(red=0, green=0, blue=0, rate=BlinkRate.MED): Promise<void> {
    let cnt = 0;

    // setup COLOR ON pattern
    await this.writePatternLine(rate, red, green, blue, cnt++)
        
    // setup COLOR OFF pattern
    await this.writePatternLine(rate, 0, 0, 0, cnt++)
    
    // start blink loop
    await this.playLoop(0, cnt-1, 0) // play continuously
  }

  /**
   * Send an array of PatternLineData to a blink(1) device.
   * @param patterns The array of PatternLineData
   * @param [startPos=0] Start writing patternLineData at this line 
   * @returns Promise<void> to await for completion
   */
  async writePattern(patterns: Array<PatternLineData>, startPos=0): Promise<void> {
    let pos = startPos;
    return new Promise(resolve => {
      patterns.forEach(async pattern => {
        await this.writePatternLine(pattern.fadeMillis, pattern.r, pattern.g, pattern.b, pos++);
      });
    })
  }

}
