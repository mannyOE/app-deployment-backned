import {RequestHandler, Request, Response, NextFunction} from 'express'
import Ctrl from '@controllers/ctrl'
import {InvalidAccessCredentialsException} from '@exceptions/index'
import {User} from '@src/rpc/clients/users'

/**
 * Middleware to handles token authentication
 * @category Controllers
 */
class AuthMiddleware extends Ctrl {
	/**
	 * @return {ValidationChain[]}
	 */
	verify(): RequestHandler {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			try {
				// @ts-ignore
				let token: string = req.headers['x-access-token']
				if (!token || !token.includes('Bearer')) {
					throw new InvalidAccessCredentialsException(
						'Invalid bearer token provided'
					)
				}
				token = token.split('Bearer ')[1]
				// @ts-ignore
				const self = this
				const Res = res
				let accountInfo
				await User.runService(
					'decodeToken',
					{
						payload: JSON.stringify({token})
					},
					// @ts-ignore
					(err, res) => {
						if (err) {
							var error = new InvalidAccessCredentialsException(err.message)
							self.handleError(error, req, Res)
						} else {
							accountInfo = JSON.parse(res.account)
							// @ts-ignore
							req.account = accountInfo
							return next()
						}
					}
				)
			} catch (error) {
				if (error.name === 'TokenExpiredError') {
					error = new InvalidAccessCredentialsException(
						'This token has expired.'
					)
				} else if (error.name === 'JsonWebTokenError') {
					error = new InvalidAccessCredentialsException(
						'This token is invalid.'
					)
				}
				this.handleError(error, req, res)
			}
		}
	}
}

export default AuthMiddleware
