import {Error as MongooseError} from 'mongoose'
import {DatabaseException, DatabaseValidationException} from '../exceptions'
import {MongoError} from 'mongodb'

export interface QueryInterface {
	page?: number
	limit?: number
	search?: 'string'
	sort?: object
	range: string[]
}

/**
 * Base model class
 * @category Modules
 */
export class Module {
	/**
	 * Handle generic error in modules
	 * @param {Error} error
	 */
	handleException(error: Error): void {
		if (error instanceof MongooseError.ValidationError) {
			throw new DatabaseValidationException(error.message, 'person', error)
		} else if (error instanceof MongoError) {
			throw new DatabaseException(error.errmsg, error)
		} else {
			throw error
		}
	}
}

export default Module
