import {Request, Response, RequestHandler} from 'express'
import {matchedData} from 'express-validator'
import Creds from '../../modules/credentials/index'
import Github from '../../modules/credentials/github'
import Gitlab from '../../modules/credentials/gitlab'
import Bitbucket from '../../modules/credentials/bitbucket'
import Server, { ServerData } from '../../modules/credentials/server'
import Ctrl from '../ctrl'
import {
    AuthMechanism,
	Providers
} from '../../models/credentials'
import { BadInputFormatException } from '@src/exceptions'

interface CredentialsConstructorInterface {
	module: Creds
	gitlab: Gitlab
	github: Github
	bitbucket: Bitbucket
	server: Server
}

/**
 * Person controller
 * @category Controllers
 */
class PersonCtrl extends Ctrl {
	/**
	 * @param {Creds} module Instance of Person module
	 */
	private module: Creds
	private gitlab: Gitlab
	private github: Github
	private bitbucket: Bitbucket
	private server: Server

	/**
	 * @constructor
	 * @param {Creds} module
	 */
	constructor(props: CredentialsConstructorInterface) {
		super()
		this.module = props.module
		this.gitlab = props.gitlab
		this.github = props.github
		this.bitbucket = props.bitbucket
		this.server = props.server
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	integrateGitlab(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {code, app, redirect_uri} = matchedData(req)
				// @ts-ignore
                const acct = req.account
                await this.module.initiate(app, acct.account)
				var response = await this.gitlab.integrateGitlab(
					code,
					acct.account,
					redirect_uri,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * Bitbucket integration
	 * @return {RequestHandler}
	 */
	integrateBitbucket(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {code, app} = matchedData(req)
				// @ts-ignore
                const acct = req.account
                await this.module.initiate(app, acct.account)
				var response = await this.bitbucket.integrateBitbucket(
					code,
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * github integration
	 * @return {RequestHandler}
	 */
	integrateGithub(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {code, app, redirect_uri} = matchedData(req)
				// @ts-ignore
                const acct = req.account
                await this.module.initiate(app, acct.account)
				var response = await this.github.integrateGithub(
					code,
					redirect_uri,
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	fetchGitlabProjects(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app} = req.params
				// @ts-ignore
				const acct = req.account
				var response = await this.gitlab.fetchGitlabProjects(acct.account, app)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	fetchBitbucketProjects(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app} = req.params
				// @ts-ignore
				const acct = req.account
				var response = await this.bitbucket.fetchBitbucketProjects(
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	fetchGithubProjects(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app} = req.params
				// @ts-ignore
				const acct = req.account
				var response = await this.github.fetchGithubProjects(acct.account, app)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	addGitlabProject(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app, project} = matchedData(req)
				// @ts-ignore
				const acct = req.account
				var response = await this.gitlab.addGitlabProject(
					project,
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	addGithubProject(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app, project} = matchedData(req)
				// @ts-ignore
				const acct = req.account
				var response = await this.github.addGithubProject(
					project,
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * complete gitlab integration
	 * @return {RequestHandler}
	 */
	addBitbucketProject(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app, project} = matchedData(req)
				// @ts-ignore
				const acct = req.account
				var response = await this.bitbucket.addBitbucketProject(
					project,
					acct.account,
					app
				)
				this.ok(res, 'ok', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * test server configuration
	 * @return {RequestHandler}
	 */
	testServerConfig(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {app, username, authMechanism, path, url} = matchedData(req)
				if (req.body.authMechanism === 'private-key') {
					if (!req.body.sshPrivateKey) {
						throw new BadInputFormatException(
							'SSH Private key is required if auth mechanism is `private-key`'
						)
					}
				}

				if (req.body.authMechanism === 'password') {
					if (!req.body.password) {
						throw new BadInputFormatException(
							'Password is required if auth mechanism is `password`'
						)
					}
				}
				let payload: ServerData = {
					username,
					authMechanism,
					path,
					url,
					commands: req.body.commands
				}
				if (authMechanism === AuthMechanism.PASSWORD) {
					payload.password = req.body.password
				}
				if (authMechanism === AuthMechanism.PRIVATE_KEY) {
					payload.sshPrivateKey = req.body.sshPrivateKey
				}
				// @ts-ignore
				const acct = req.account
				await this.server.testServerConfig(app, acct.account._id, payload)
				this.ok(res, 'Test Initiated. Output is available in logs')
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}
	/**
	 * Request handler for creating new person
	 * @return {RequestHandler}
	 */
	saveServerConfig(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			try {
				// Todo: implement create handler
				const {
					app,
					username,
					sshPrivateKey,
					password,
					authMechanism,
					path,
					url
				} = matchedData(req)
				let payload: ServerData = {
					username,
					authMechanism,
					path,
					url,
					commands: req.body.commands
				}
				if (authMechanism === AuthMechanism.PASSWORD) {
					payload.password = password
				}
				if (authMechanism === AuthMechanism.PRIVATE_KEY) {
					payload.sshPrivateKey = sshPrivateKey
				}
				// @ts-ignore
				const acct = req.account
				let response = await this.server.saveServerConfig(
					app,
					acct.account._id,
					payload
				)
				this.ok(res, 'Server Config has been saved', response)
			} catch (error) {
				this.handleError(error, req, res)
			}
		}
	}

	/**
	 * Request handler to fetch people
	 * @return {RequestHandler}
	 */
	fetch(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const {app} = req.params
			// @ts-ignore
			const acct = req.account
			let appCreds = await this.module.get(app);
			if (!appCreds) appCreds = await this.module.initiate(app, acct.account._id);
			else {
				// @ts-ignore
				appCreds.timestamp = (new Date()).toISOString();
			}
			this.ok(res, 'ok', appCreds)
		}
    }


    fetchBranchFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const { app, module } = req.params
            const { path }  = req.body
				// @ts-ignore
                const acct = req.account
                let appCreds = await this.module.branchTrees(app, module, path)
			this.ok(res, 'ok', appCreds)
		}
    }
    fetchBranchFileUrl(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const { app, module } = req.params
            const { path }  = req.body
				// @ts-ignore
                const acct = req.account
                let appCreds = await this.module.branchFile(app, module, path)
			this.ok(res, 'ok', appCreds)
		}
    }

    addToBranchFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const { app, module } = req.params
            const { path }  = req.body
				// @ts-ignore
                const acct = req.account
            let appCreds = await this.module.addToTree(app, module, path)
			this.ok(res, 'file created',)
		}
    }

    fetchDiffFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const {app, module} = req.params
				// @ts-ignore
            const acct = req.account
            let appCreds = await this.module.fetchSubmissions(app, module)
			this.ok(res, 'ok', appCreds)
		}
    }

    initQATest(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const {app, module} = req.params
				// @ts-ignore
                const acct = req.account
            let appCreds = await this.module.testModule(app, module)
			this.ok(res, 'ok', appCreds)
		}
    }
    
    /**
	 * Request handler to fetch people
	 * @return {RequestHandler}
	 */
	reset(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const {app, provider} = req.params
				// @ts-ignore
                const acct = req.account
            let appCreds = await this.module.reset(app, acct.account._id, provider as Providers)
			this.ok(res, 'ok', appCreds)
		}
    }
    
    /**
	 * Request handler to fetch people
	 * @return {RequestHandler}
	 */
	default(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            // Todo: implement create handler
            const {app, provider} = req.params
				// @ts-ignore
                const acct = req.account
            let appCreds = await this.module.setDefaultProvider(app, acct.account._id, provider as Providers)
			this.ok(res, 'ok', appCreds)
		}
	}

	/**
	 * Request handler to delete person
	 * @return {RequestHandler}
	 */
	delete(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			// Todo: implement delete handler
			this.ok(res, 'ok')
		}
	}

	getFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
            try {
                const { app } = req.params;
			let files = await this.module.getFiles(app);
			res.set('Content-Type','application/octet-stream'); 
			res.set('Content-Disposition',`attachment; filename=${app}.zip`); 
			res.set('Content-Length',files.length); 
			res.send(files);
            } catch (error) {
                this.handleError(error, req, res)
            }
		}
	}

	updateFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			const { app } = req.params;
            const files = (req as any).files;
			await this.module.updateFiles(app, files.file);
			this.ok(res, 'ok');
		}
	}

	commitFiles(): RequestHandler {
		return async (req: Request, res: Response): Promise<void> => {
			const { app, module } = req.params;
			await this.module.commitChanges(app, module);
			this.ok(res, 'ok');
		}
	}
}

export default PersonCtrl
