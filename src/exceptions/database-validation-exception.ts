import {Error as MongooseError} from 'mongoose';
import {DatabaseValidationExceptionCode} from './codes';
import Exception from './exception';

/**
 * Handles database validation exception
 * @category Exceptions
 */
class DatabaseValidationException extends Exception {
  /**
   * Hold mongoose validation
   */
  public err: MongooseError|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {string} path
   * @param {MongooseError} err
   */
  public constructor(message?: string, path?: string, err?: MongooseError) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = DatabaseValidationException.name;
    this.code = DatabaseValidationExceptionCode;
    this.err = err;
  }
}

export default DatabaseValidationException;
