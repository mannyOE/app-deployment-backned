import {BadInputFormatExceptionCode} from './codes';
import Exception from './exception';

interface InputError {
  mapped?: Function;
}

/**
 * Handles invalid and bad input exceptions
 * @category Exceptions
 */
class BadInputFormatException extends Exception {
  public meta: object|undefined;
  public errors: object|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {InputError} errors
   */
  public constructor(message?: string, errors?: InputError[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = BadInputFormatException.name;
    this.code = BadInputFormatExceptionCode;
    this.errors = errors;
  }
}

export default BadInputFormatException;
