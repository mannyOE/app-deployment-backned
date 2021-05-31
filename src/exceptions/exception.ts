import {ExceptionCode} from './codes';

/**
 * Base exception class
 * @category Exceptions
 */
class Exception extends Error {
  public name: string;
  public code: number;
  public meta: object|string|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {Object|string} meta
   */
  public constructor(message?: string, meta?: object|string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = Exception.name;
    this.code = ExceptionCode;
    this.meta = meta;
  }
}

export default Exception;
