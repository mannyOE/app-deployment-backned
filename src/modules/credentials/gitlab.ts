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
import {post, get, del, RequestPromiseOptions} from 'request-promise'
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
class Gitlab extends Module {
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
	async integrateGitlab(
		code: string,
		account: string,
		redirect_uri: string,
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
			var auth = await post('https://gitlab.com/oauth/token', {
				json: true,
				body: {
					redirect_uri,
					code: code,
					grant_type: 'authorization_code',
					client_id: process.env.GITLAB_APP_ID,
					client_secret: process.env.GITLAB_APP_SECRET
				},
				headers: {
					'Content-Type': 'application/json'
				}
			})
            if (auth && auth.access_token && application.repository) {
                let index = application.repository.findIndex(e => e.provider === Providers.GITLAB)
                if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
				application.repository[index].accessToken = auth.access_token
                application.repository[index].provider = Providers.GITLAB
				await application.save()
                await saveMsgToFirebaseDatabase('git-set', app)
			}

			return {message: "Complete"}
		} catch (error) {
			throw new InvalidAccessCredentialsException(
				'Could not access this gitlab account: '+error.message
			)
		}
	}

	/**
	 * fetch all repositories from a users gitlab account
	 * @param {string} app app id of current app
	 * @param {string} account team id of the company
	 */
	async fetchGitlabProjects(account: string, app: string): Promise<object[]> {
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
            let index = application.repository.findIndex(e => e.provider === Providers.GITLAB)
            if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
			let projects = []
			var gitlabprojects = await get(
				`https://gitlab.com/api/v4/projects?access_token=${application.repository[index].accessToken}&owned=true&per_page=100`,
				{
					json: true,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)

			for (let project of gitlabprojects) {
				projects.push({
					id: project.id,
					name: project.name
				})
			}

			return projects
		} catch (error) {
			throw new InvalidAccessCredentialsException(error.message)
		}
    }
    
    
    async checkGitlabBranch(
		branch: string,
		app: CredentialsInterface
): Promise <boolean> {
    try {
        let repo = app.repository.find(e => e.provider === Providers.GITLAB);
        let branches: any[] = await get(
            `https://gitlab.com/api/v4/projects/${repo?.project}/repository/branches?access_token=${repo?.accessToken}`,
            {
                json: true,
                headers: {
                    'Content-Type': 'application/json'
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
	async addGitlabProject(
		project: string,
		account: string,
		app: string
	): Promise<Record<string, unknown>> {
		// Todo: implement fetch single app
		try {
			const branch = 'master'
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
            let index = application.repository.findIndex(e => e.provider === Providers.GITLAB)
                if (index === -1) {
                    throw new BadInputFormatException("No config for this provider")
                }
                let previous = application.repository.findIndex(e => e.url.length >0&&e.default)
			var projectInfo = await get(
				`https://gitlab.com/api/v4/projects/${project}?access_token=${application.repository[index].accessToken}`,
				{
					json: true,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
            if (projectInfo) {
                let index = application.repository.findIndex(e => e.provider === Providers.GITLAB)
                if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
				if (application.repository[index].url !== projectInfo.http_url_to_repo) {
                    application.repository[index].url = projectInfo.http_url_to_repo
                    application.repository[index].project = project
                    application.repository[index].provider = Providers.GITLAB
                    for (let i = 0; i < application.repository.length; i++) {
                        if (i === index) {
                            application.repository[i].default = true
                        } else {
                            application.repository[i].default = false
                        }
                    }
                    await application.save()
                    if (previous !== -1) {
                        // await saveMsgToFirebaseDatabase('git-changed', app)
                    }
                    let exist = await this.checkGitlabBranch(Branches.QA, application)
                    if (!exist) {
                        post(
                            `https://gitlab.com/api/v4/projects/${project}/repository/branches?access_token=${application.repository[index].accessToken}&branch=${Branches.QA}&ref=${branch}`
                        )
                    }
                    exist = await this.checkGitlabBranch(Branches.MAIN, application)
                    if (!exist) {
                        post(
                            `https://gitlab.com/api/v4/projects/${project}/repository/branches?access_token=${application.repository[index].accessToken}&branch=${Branches.MAIN}&ref=${branch}`
                        )
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

export default Gitlab
