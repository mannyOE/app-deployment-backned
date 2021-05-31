/**
 * @category Credentialss
 */
import {Model} from 'mongoose'
import {
	CredentialsInterface,
	Repository,
	Server,
	AuthMechanism,
	Providers
} from '../../models/credentials'
import {Module, QueryInterface} from '../module'
import {post, get, del, put, RequestPromiseOptions} from 'request-promise'
import {
	BadInputFormatException,
	InvalidAccessCredentialsException
} from '@src/exceptions'
import { Branches } from './index'
import {saveMsgToFirebaseDatabase} from "../../utils/firebase";
interface CredentialsConstructorInterface {
	model: Model<CredentialsInterface>
}

/**
 * @type NewCredentialsInput
 * Definition of input required to create a project
 */
type NewCredentialsInput = Pick<
	CredentialsInterface,
	'appId' | 'server' | 'repository'
>

/**
 * Credentials module: handle all app interaction with database and business logic
 * @category Modules
 */
class Github extends Module {
	private model: Model<CredentialsInterface>

	/**
	 * @constructor
	 * @param {Object} props
	 * @param {Model<CredentialsInterface>} props.model Mongoose Credentials model
	 */
	constructor(props: CredentialsConstructorInterface) {
		super()
		this.model = props.model
	}

	/**
	 * fetch all repositories from a users gitlab account
	 * @param {string} appId
	 */
	async integrateGithub(
		code: string,
		redirect_uri: string,
		account: string,
		app: string
	): Promise<Record<string, unknown>> {
		// Todo: implement fetch single app
		try {
			let application: CredentialsInterface | null = await this.model.findOne({
				account,
				appId: app
			})
			if (!application) {
				throw new Error("No apps matching this id")
			}
			
			var auth = await post('https://github.com/login/oauth/access_token', {
				json: true,
				body: {
					redirect_uri,
					code: code,
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET
				},
				headers: {
                    'Content-Type': 'application/json',
                    'X-OAuth-Scopes': "user, repo"
				}
            })
            if (auth && auth.access_token && application.repository) {
                let index = application.repository.findIndex(e => e.provider === Providers.GITHUB)
                
                if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
                await saveMsgToFirebaseDatabase('git-set', app)
				application.repository[index].accessToken = auth.access_token
				application.repository[index].url = ''
                application.repository[index].provider = Providers.GITHUB
                await application.save()
			}
			return {message: "Complete"}
		} catch (error) {
			throw new InvalidAccessCredentialsException(error.message)
		}
	}

	/**
	 * fetch all repositories from a users gitlab account
	 * @param {string} app app id of current app
	 * @param {string} account team id of the company
	 */
	async fetchGithubProjects(
		account: string,
		app: string
	): Promise<Record<string, unknown>> {
		try {
			// Todo: implement fetch single app
			let application: CredentialsInterface | null = await this.model.findOne({
				account,
				appId: app
			})
			if (
				!application ||
				!application.repository 
			) {
				throw new BadInputFormatException(
					'This app does not exist for this team'
				)
            }
            let index = application.repository.findIndex(e => e.provider === Providers.GITHUB)
            if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
			var projects = await get(
				`https://api.github.com/user/repos?type=all&per_page=100&page=1`,
				{
					json: true,
                    headers: {
                        accept: 'application/vnd.github.v3+json',
						'Content-Type': 'application/json',
						Authorization: `token ${application.repository[index].accessToken}`,
                        'User-Agent': 'Zeedas',
                        'X-OAuth-Scopes': "user, repo"
					}
				}
			)

            return projects.map((e:any) => {
                return {
                    id: e.full_name,
                    name: e.name
                }
            })
		} catch (error) {
			throw new InvalidAccessCredentialsException(error.message)
		}
    }
    
    async checkGithubBranch(
		branch: string,
		app: CredentialsInterface
): Promise <boolean> {
    try {
        let repo = app.repository.find(e => e.provider === Providers.GITHUB);
        let branches: any[] = await get(
            `https://api.github.com/repos/${repo?.project}/branches`,
            {
                json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${repo?.accessToken}`,
                            'User-Agent': 'Zeedas',
                            'X-OAuth-Scopes': "user, repo"
						}
            }
        )
        let info = branches.filter(e => e.name === branch)
        return info.length>0
    } catch (error) {
        throw new BadInputFormatException("")
    }
}

	/**
	 * fetch all repositories from a users gitlab account
	 * @param {string} appId
	 */
	async addGithubProject(
		project: string,
		account: string,
		app: string
	): Promise<Record<string, unknown>> {
		// Todo: implement fetch single app
		try {
			let application: CredentialsInterface | null = await this.model.findOne({
				account,
				appId: app
			})
			if (
				!application ||
				!application.repository
			) {
				throw new BadInputFormatException(
					'This app does not exist for this team'
				)
            }
            let index = application.repository.findIndex(e => e.provider === Providers.GITHUB)
            if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
            }
            let previous = application.repository.findIndex(e => e.url.length >0&&e.default)
			var projectInfo = await get(`https://api.github.com/repos/${project}`, {
				json: true,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `token ${application.repository[index].accessToken}`,
                    'User-Agent': 'Zeedas',
                    'X-OAuth-Scopes': "user, repo"
				}
			})
			if (projectInfo) {
                if (application.repository[index].url !== projectInfo.clone_url) {
                    application.repository[index].project = project
					application.repository[index].url = projectInfo.clone_url
                    application.repository[index].provider = Providers.GITHUB
                    for (let i = 0; i < application.repository.length; i++) {
                        if (i === index) {
                            application.repository[i].default = true
                        } else {
                            application.repository[i].default = false
                        }
                    }
                    await application.save()
                    // if (previous !== -1) {
                    //     await saveMsgToFirebaseDatabase('git-changed', app)
                    // }
					let url = `https://api.github.com/repos/${project}/git/refs`
					let commits = await get(url, {
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${application.repository[index].accessToken}`,
                            'User-Agent': 'Zeedas',
                            'X-OAuth-Scopes': "user, repo"
						}
					})
					let by = {
						ref: `refs/heads/${Branches.MAIN}`,
						sha: ''
					}
					// @ts-ignore
					let mainExists = commits.find((e) => e.ref === by.ref)
					if (!mainExists) {
						// @ts-ignore
                        let master = commits.find((e) => e.ref === `refs/heads/master`||e.ref === `refs/heads/main`)
                        if (!master) {
                            master = commits[0]
                        }
						let branch = master.object.sha
						by.sha = branch
                        post(`https://api.github.com/repos/${project}/git/refs`, {
                        json: true,
                        body: by,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `token ${application.repository[index].accessToken}`,
                            'User-Agent': 'Zeedas',
                            'X-OAuth-Scopes': "user, repo"
                        }
                    })
						// try {
                        // } catch (error) {
                            
                        // }
					}
					by.ref = `refs/heads/${Branches.QA}`
					// @ts-ignore
					let qaExists = commits.find((e) => e.ref === by.ref)
					if (!qaExists) {
						// @ts-ignore
                        let master = commits.find((e) => e.ref === `refs/heads/master`||e.ref === `refs/heads/main`)
                        if (!master) {
                            master = commits[0]
                        }
						let branch = master.object.sha
						by.sha = branch
						try {
                            post(`https://api.github.com/repos/${project}/git/refs`, {
							json: true,
							body: by,
							headers: {
								'Content-Type': 'application/json',
								Authorization: `token ${application.repository[index].accessToken}`,
                                'User-Agent': 'Zeedas',
                                'X-OAuth-Scopes': "user, repo"
							}
						})
                        } catch (error) {
                            
                        }
					}

					
				}
			}
			return {config: application}
		} catch (error) {
            if (error.response&&error.response.body) {
                let response = error.response.body
			throw new InvalidAccessCredentialsException(response.message)
            } else {
                throw new InvalidAccessCredentialsException(error.message)
            }
		}
	}
}

export default Github
