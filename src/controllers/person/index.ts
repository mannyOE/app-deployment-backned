import {Request, Response, RequestHandler} from 'express'

import {PersonInterface} from '../../models/person'
import Person from '../../modules/person'
import Creds from '../../modules/credentials'
import Ctrl from '../ctrl'

/**
 * Person controller
 * @category Controllers
 */
class PersonCtrl extends Ctrl {
	/**
	 * @param {Person} module Instance of Person module
	 */
	private module: Person

	/**
	 * @constructor
	 * @param {Person} module
	 */
	constructor(module: Person) {
		super()
		this.module = module
	}

	/**
	 * Request handler for creating new person
	 * @return {RequestHandler}
	 */
	create(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			// Todo: implement create handler
			const {body} = req
			const record: PersonInterface | undefined = await this.module.create(body)
			this.ok(res, 'ok', record)
		}
	}

	/**
	 * Request handler to fetch people
	 * @return {RequestHandler}
	 */
	fetch(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			// Todo: implement create handler
			res.send(req.body)
		}
	}

	/**
	 * Request handler to delete person
	 * @return {RequestHandler}
	 */
	delete(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			// Todo: implement delete handler
			res.send(req.body)
		}
	}
}

export default PersonCtrl
