import {InvalidAccessCredentialExceptionCode} from './codes';
import Exception from './exception';

/**
 * Handles exception when resource is access with wrong credentials
 * @category Exceptions
 */
class InvalidAccessCredentialsException extends Exception {
  /**
   * The credential used in making the request
   * @param {object} cred
   */
  private cred: object|undefined;

  /**
   * @constructor
   * @param {string} message
   * @param {object} cred
   */
  public constructor(message?: string, cred?: object) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = InvalidAccessCredentialsException.name;
    this.code = InvalidAccessCredentialExceptionCode;
    this.cred = cred;
  }
}

export default InvalidAccessCredentialsException;
