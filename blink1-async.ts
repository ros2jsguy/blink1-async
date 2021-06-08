

const Blink1 = require('node-blink1');

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

/**
 * An asynchronouse Blink1 api.
 */
export class Blink1Async {

  // The Blink1 instance from node-blink1 package that does all of the work.
  private _blink1: any;

  /**
   * Find all connected Blink1 devices.
   * @returns Array of found Blink1 serial numbers.
   */
  static devices(): Array<string> {
    return Blink1.devices();
  }

  /**
   * Create a high-level refernece to a Blink1 HID device.
   * @param [serialNumber] The serial number of the device to reference (see devices()). 
   *                       When undefined choose the first Blink1 device found.
   * @param [enableDegamma=true] Enablement for degamma color correction (crappy name)
   */
  constructor(serialNumber?: string, enableDegamma=true) {
    this._blink1 = new Blink1(serialNumber);
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
   * Return the version number of the Blink1 HID device
   * @returns The version string.
   */
  version(): Promise<number> {
    return new Promise((resolve) => {
      this._blink1.version(resolve);
    });
  }

  // TODO - commented out getSerialNumber() and getId() as they are causing
  // blink(1) device to crash. Investigate asap.
  /**
   * Access the Blink1 serial number
   * @returns a Promise that returns the Blink1 device serialNumber
   */
  // getSerialNumber(): Promise<string> {
  //   return new Promise((resolve) => {
  //     this._blink1.getId(resolve);
  //   });
  // }

  /**
   * Access the Blink1 serial number
   * @returns a Promise that returns the Blink1 device serialNumber
   * @deprecated use getSerialNumber()
   */
  // getId(): Promise<string> {
  //   return new Promise((resolve) => {
  //     this._blink1.getId(resolve);
  //   });
  // }

  /**
   * Close the underlying HID device.
   */
   close(): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.close(resolve);
    });
  }

  /**
   * Transition one or both LEDs to a new RGB color.
   * @param fadeMillis The milliseconds for the transition.
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @param [led=Blink1_LEDN.ALL] Led(s) to update. 
   */
  fadeToRGB(fadeMillis: number, red=0, green=0, blue=0, led=Blink1_LEDN.ALL) {
    return new Promise((resolve) => {
      this._blink1.fadeToRGB(fadeMillis, red, green, blue, led, resolve);
    });
  }

  /**
   * Access the device current RGB value.
   * @param led The led to read the RGB value from.
   * @returns The current RGB values.
   */
  rgb(led: Blink1_LEDN): Promise<RGBData> {
    return new Promise((resolve) => {
      this._blink1.rgb(led, resolve);
    });
  }

  /**
   * Immediately output an RGB color. For mk2 devices both LEDs will 
   * present the RGB color.
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   */
  setRGB(red=0, green=0, blue=0): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.setRGB(red, green, blue, resolve);
    });
  }

  /**
   * Immediately disable output. 
   */
  off(): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.off(resolve);
    });
  }

  /**
   * Animate the sequence of color patterns in RAM beginning at a specific index in the sequence.
   * @param startPosition The index [0-31] into the sequence of color patterns.
   */
  play(startPosition=0): Promise<void> {
    return new Promise((resolve) => {
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
   */
  playLoop(startPosition=0, endPosition=0, count=0): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.playLoop(startPosition, endPosition, count, resolve);
    });
  }

  /**
   * Immediately stop presenting color patterns from RAM.
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.pause(resolve);
    });
  }

  /**
   * Immediately stop presenting display patterns from RAM.
   * @deprecated Use stop()
   */
  pause(): Promise<void> {
    return this.stop();
  }

  /**
   * Play an alternating pattern of the provided color in an on/off sequence for
   * the number cycles or infinitely.
   * 
   * Note this method returns as soon as the play command is sent 
   * to the Blink1 device, not when the blinking command has completed.
   * 
   * @param [red=0] The red color value [0-255].
   * @param [green=0] The green color value [0-255].
   * @param [blue=0] The blue color value [0-255].
   * @param [duration=1000] Blink for duration milliseconds, 0 = blink infinitely
   */
  async blink(red=0, green=0, blue=0, rate=BlinkRate.MED, duration=1000): Promise<void> {
    let cnt = 0;

    // COLOR ON
    await this.writePatternLine(10, red, green, blue, cnt++);
    await this.writePatternLine(rate, red, green, blue, cnt++);

    // COLOR OFF
    await this.writePatternLine(10, 0, 0, 0, cnt++);
    await this.writePatternLine(rate, 0, 0, 0, cnt++);

    await this.playLoop(0, cnt-1, 0); // play continuously

    return new Promise( (resolve) => {
      setTimeout(resolve, duration === 0 ? Number.MAX_SAFE_INTEGER : duration);
    });
  }

  /**
   * Return the color pattern data at position in RAM.
   * @param [position=0] The index [0-31] into the sequence of color patterns
   */
  readPatternLine(position=0): Promise<string> {
    return new Promise((resolve) => {
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
   */
  writePatternLine(fadeMillis: number, red=0, green=0, blue=0, position=0): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.writePatternLine(fadeMillis, red, green, blue, position, resolve);
    });
  }

  /**
   * Save all patterns in to Blink(1) non-volatile memory.
   */
  savePattern(): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.savePattern(resolve);
    });
  }

   /**
   * Clear all pattern data from Blink(1) non-volatile memory.
   */
  async clearPattern(): Promise<void> {
      for (let i=0; i< 32; i++) {
        await this._blink1.writePatternLine(0, 0, 0, 0, i);
      }
    }

  /**
   * Set the led to which future writePattern() calls will apply.
   * @param led The led to make default
   */
  setLedN(led=Blink1_LEDN.ALL): Promise<void> {
    return new Promise((resolve) => {
      this._blink1.setLedN(led, resolve);
    });
  }

  /**
   * Enable the ServerDown feature that will trigger a display pattern
   * if a
   * @param triggerMillis 
   */
  enableServerDown(triggerMillis=10000) {
    return new Promise((resolve) => {
      this._blink1.enableServerDown(triggerMillis, resolve);
    });
  }

  disableServerDown() {
    return new Promise((resolve) => {
      this._blink1.disableServerDown(resolve);
    });
  }
}
