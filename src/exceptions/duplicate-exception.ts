import {DuplicateExceptionCode} from './codes';
import Exception from './exception';

/**
* Handles Duplicate exception
* @category Exceptions
*/
class DuplicateException extends Exception {
  public field: string|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {string} field
   */
  public constructor(message?: string, field?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = DuplicateException.name;
    this.code = DuplicateExceptionCode;
    this.field = field;
  }
}

export default DuplicateException;
