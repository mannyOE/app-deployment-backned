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
class Bitbucket extends Module {
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
	 * integrate bitbucket
	 * @param {string} appId
	 */
	async integrateBitbucket(
		code: string,
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
			var auth = await post(
				`https://${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}@bitbucket.org/site/oauth2/access_token`,
				{
					json: true,
					formData: {
						code: code,
						grant_type: 'authorization_code'
					},
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			)
            if (auth && auth.access_token && application.repository) {
                let index = application.repository.findIndex(e => e.provider === Providers.BITBUCKET)
                if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
                
                await saveMsgToFirebaseDatabase('git-set', app)
				application.repository[index].refreshToken = auth.refresh_token
				application.repository[index].accessToken = auth.access_token
                application.repository[index].provider = Providers.BITBUCKET
				await application.save()
				
			}

            return {
                message: "Complete"
            }
		} catch (error) {
			throw new InvalidAccessCredentialsException(error.message)
		}
	}

	/**
	 * fetch all repositories from a users bitbucket account
	 * @param {string} app app id of current app
	 * @param {string} account team id of the company
	 */
	async fetchBitbucketProjects(
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
            let index = application.repository.findIndex(e => e.provider === Providers.BITBUCKET)
            if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
                }
			var projects = await get(
				`https://api.bitbucket.org/2.0/repositories?access_token=${application.repository[index].accessToken}&role=admin&pagelen=100`,
				{
					json: true,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)

            return projects.values.map((e: any) => {
                return {
                    id: e.full_name,
                    name: e.name
                }
            })
		} catch (error) {
			throw new InvalidAccessCredentialsException(error.message)
		}
    }
    
    async checkBitbucketBranch(
		branch: string,
		app: CredentialsInterface
): Promise <boolean> {
    try {
        let repo = app.repository.find(e => e.provider === Providers.BITBUCKET);
        let branches: any = await get(
            `https://api.bitbucket.org/2.0/repositories/${repo?.project}/refs/branches?access_token=${repo?.accessToken}&pagelen=100`,
            {
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        let info = branches.values.filter((e: any) => e.name === branch)
        return info.length>0
    } catch (error) {
        throw new BadInputFormatException("")
    }
}

	/**
	 * fetch all repositories from a users BITBUCKET account
	 * @param {string} appId
	 */
	async addBitbucketProject(
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
            let index = application.repository.findIndex(e => e.provider === Providers.BITBUCKET)
            if (index===-1) {
                    throw new BadInputFormatException("No config for this provider")
            }
            let previous = application.repository.findIndex(e => e.url.length >0&&e.default)
			var projectInfo = await get(
				`https://api.bitbucket.org/2.0/repositories/${project}?access_token=${application.repository[index].accessToken}`,
				{
					json: true,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
			let gitUrl = `https://bitbucket.org/${project}.git`
			if (projectInfo) {
                if (application.repository[index].url !== gitUrl) {
                    application.repository[index].project = project
					application.repository[index].url = gitUrl
                    application.repository[index].provider = Providers.BITBUCKET
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
					let url = `${projectInfo.links.commits.href}?access_token=${application.repository[index].accessToken}`
					var commits = await get(url, {json: true})
                    let branch = commits.values[0].hash
                    let exist = await this.checkBitbucketBranch(Branches.MAIN, application)
                    if (!exist) {
                        Promise.all([
                            post(
                                `https://api.bitbucket.org/2.0/repositories/${project}/refs/branches?access_token=${application.repository[index].accessToken}`,
                                {
                                    json: true,
                                    body: {
                                        name: Branches.QA,
                                        target: {
                                            hash: branch
                                        }
                                    },
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }
                            ),
                            post(
                                `https://api.bitbucket.org/2.0/repositories/${project}/refs/branches?access_token=${application.repository[index].accessToken}`,
                                {
                                    json: true,
                                    body: {
                                        name: Branches.MAIN,
                                        target: {
                                            hash: branch
                                        }
                                    },
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }
                            )
                        ])
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

export default Bitbucket
