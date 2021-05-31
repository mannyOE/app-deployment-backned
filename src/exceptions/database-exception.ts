import {MongoError} from 'mongodb';
import {DatabaseExceptionCode} from './codes';
import Exception from './exception';

/**
 * Handles database exception
 * @category Exceptions
 */
class DatabaseException extends Exception {
  public err: MongoError|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {Error} err
   */
  public constructor(message?: string, err?: MongoError) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = DatabaseException.name;
    this.code = DatabaseExceptionCode;
    this.err = err;
  }
}

export default DatabaseException;
