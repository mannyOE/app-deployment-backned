import {ValidationChain, validationResult, check} from 'express-validator'
import {RequestHandler, Request, Response, NextFunction} from 'express'
import Ctrl from '@controllers/ctrl'
import {BadInputFormatException} from '@exceptions/index'

/**
 * Middleware to handles validation for authentication controller
 * @category Controllers
 */
class PayValidator extends Ctrl {
	/**
	 * @return {ValidationChain[]}
	 */
	validate(): RequestHandler {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const result = validationResult(req)
			const hasErrors = !result.isEmpty()
			const errors = result.array()
			if (hasErrors) {
				const error = new BadInputFormatException(
					errors.map((i) => i.msg).join(', '),
					errors.map((e) => e.msg)
				)
				return this.handleError(error, req, res)
			}
			return next()
		}
	}

	/**
	 * validate gitlab integration input
	 * @return {ValidationChain[]}
	 */
	static gitlab(): ValidationChain[] {
		return [
			check('code')
				.exists()
				.withMessage('Please provide the authorization code'),
			check('redirect_uri')
				.exists()
				.withMessage('Please provide the redirect uri'),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential')
		]
	}

	/**
	 * validate add gitlab project to app
	 * @return {ValidationChain[]}
	 */
	static addGitlabProject(): ValidationChain[] {
		return [
			check('project')
				.exists()
				.withMessage('Please provide the gitlab project id'),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential')
		]
	}

	/**
	 * validate add gitlab project to app
	 * @return {ValidationChain[]}
	 */
	static addBitbucketProject(): ValidationChain[] {
		return [
			check('project')
				.exists()
				.withMessage('Please provide the bitbucket project full_name'),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential')
		]
	}

	/**
	 * validate add gitlab project to app
	 * @return {ValidationChain[]}
	 */
	static addGithubProject(): ValidationChain[] {
		return [
			check('project')
				.exists()
				.withMessage('Please provide the github project full_name'),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential')
		]
	}

	/**
	 * validate add gitlab project to app
	 * @return {ValidationChain[]}
	 */
	static addGitlabProjectBranches(): ValidationChain[] {
		return [
			check('project')
				.exists()
				.withMessage('Please provide the gitlab project id'),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential'),
			check('branch')
				.exists()
				.withMessage('Please provide the base branch name')
		]
	}

	/**
	 * validate server integration input
	 * @return {ValidationChain[]}
	 */
	static server(): ValidationChain[] {
		return [
			check('username').exists().withMessage('Please provide the SSH username'),
			check('sshPrivateKey')
				.exists()
				.withMessage('Please provide the SSH private key'),
			check('url').exists().withMessage('Please provide the SSH server url'),
			check('path')
				.exists()
				.withMessage(
					'Please provide the path to deploy the application files to'
				),
			check('app')
				.exists()
				.withMessage('Please provide the app id for this credential')
		]
	}
}

export default PayValidator
