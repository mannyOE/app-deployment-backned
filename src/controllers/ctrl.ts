import {Request, Response} from 'express'
import {
	Exception,
	InvalidAccessCredentialsException,
	BadInputFormatException,
	NetworkException,
	ResourceNotFoundException,
	DuplicateException,
	DatabaseException,
	DatabaseValidationException
} from '../exceptions'

/**
 * @interface
 * @category Controllers
 */
interface ResponseInterface {
	code: number
	message: string | undefined
	data?: object | string
}

/**
 * Base controller which would be inherited by other controllers.
 * @category Controllers
 */
class Ctrl {
	public HTTP_OK = 200
	public HTTP_CREATED = 201
	public HTTP_BAD_REQUEST = 400
	public HTTP_RESOURCE_NOT_FOUND = 404
	public HTTP_INTERNAL_SERVER_ERROR = 500
	public HTTP_UNAUTHENTICATED = 401
	public HTTP_UNAUTHORIZED = 403

	/**
	 * handle successful response
	 * @param {Response} res
	 * @param {string} message
	 * @param {Object|string} data
	 */
	public ok(res: Response, message?: string, data?: object | string): void {
		const fData = this.format(this.HTTP_OK, message, data)
		res.status(this.HTTP_OK).json(fData)
	}

	/**
	 * @param {Exception} error
	 * @param {Request} req
	 * @param {Response} res
	 */
	public handleError(error: Exception, req: Request, res: Response): void {
		// set locals, only providing error in development
		res.locals.message = error.message
		res.locals.error = req.app.get('env') === 'development' ? error : {}

		if (error instanceof InvalidAccessCredentialsException) {
			res
				.status(this.HTTP_UNAUTHORIZED)
				.json(this.format(error.code, error.message))
		} else if (error instanceof BadInputFormatException) {
			res
				.status(this.HTTP_BAD_REQUEST)
				.json(this.format(error.code, error.message))
		} else if (error instanceof NetworkException) {
			res
				.status(this.HTTP_INTERNAL_SERVER_ERROR)
				.json(this.format(error.code, error.message))
		} else if (error instanceof ResourceNotFoundException) {
			res
				.status(this.HTTP_RESOURCE_NOT_FOUND)
				.json(this.format(error.code, error.message))
		} else if (error instanceof DuplicateException) {
			res
				.status(this.HTTP_BAD_REQUEST)
				.json(this.format(error.code, error.message))
		} else if (error instanceof DatabaseException) {
			res
				.status(this.HTTP_INTERNAL_SERVER_ERROR)
				.json(this.format(error.code, 'A database error has occurred'))
		} else if (error instanceof DatabaseValidationException) {
			res
				.status(this.HTTP_BAD_REQUEST)
				.json(
					this.format(
						error.code,
						'There was an error with your request',
						error.err
					)
				)
		} else {
			res.status(500)
		}
	}

	/**
	 * Handler non existent routes
	 * @param {Request} req
	 * @param {Response} res
	 */
	public handleNotFound(req: Request, res: Response): void {
		res.status(404).send('Resource not found.')
	}

	/**
	 * Standardize response format
	 * @param {number} code
	 * @param {string} message
	 * @param {object} data
	 * @return {ResponseInterface}
	 */
	protected format(
		code: number,
		message?: string,
		data?: object | string
	): ResponseInterface {
		return {
			code,
			message,
			data
		}
	}
}

export default Ctrl
