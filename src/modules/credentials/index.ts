/**
 * @category Credentialss
 */
import { unlinkSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import {Model} from 'mongoose'
import {
	CredentialsInterface,
	Repository,
	Server,
	AuthMechanism,
	Providers
} from '../../models/credentials'
import {Module, QueryInterface} from '../module'
import {server, gitlab, bitbucket, github} from '../index'
import {post, get, put, del, RequestPromiseOptions} from 'request-promise'
import {
	BadInputFormatException,
	InvalidAccessCredentialsException
} from '@src/exceptions'
import {MergeInterface} from '@src/models/merges'
import {ServerData} from './server'
import Uploader from '@src/utils/Uploader';
import GitHelper from '@src/utils/git-helper';
const Zip = require('adm-zip');

interface CredentialsConstructorInterface {
	model: Model<CredentialsInterface>
	merges: Model<MergeInterface>
}

export enum Branches {
	MAIN = 'master-zeedas',
	QA = 'qa-zeedas',
	FEATURE = '-zeedas'
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
class Credentials extends Module {
	private model: Model<CredentialsInterface>
	private merges: Model<MergeInterface>

	/**
	 * @constructor
	 * @param {Object} props
	 * @param {Model<CredentialsInterface>} props.model Mongoose Credentials model
	 */
	constructor(props: CredentialsConstructorInterface) {
		super()
		this.model = props.model
		this.merges = props.merges
	}


	/**
	 * Fetch projects
	 * @param {string} appId
	 */
	async get(appId: string): Promise<CredentialsInterface> {
		// Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId});
        const refreshedApp = await this.refreshAccessToken(appId);
        if (app && refreshedApp) app = refreshedApp;
		return JSON.parse(JSON.stringify(app))
	}

	/**
	 * Update a project record
	 * @param {object} update the project properties to update
	 * @param {string} appId other option that would influence how the update will be performed.
	 * @throws MongoError
	 * @return {CredentialsInterface}
	 */
	async update(
		update: object,
		appId: string
	): Promise<CredentialsInterface | undefined> {
		let app: CredentialsInterface | undefined
		return JSON.parse(JSON.stringify(app))
		// Todo: implement update
	}

	/**
	 * Deletes a project from the database
	 * @param {string} appId Id of the project
	 * @throws MongoError
	 */
	public async delete(appId: string): Promise<boolean> {
		// Todo: implement delete operation
		return Promise.resolve(true)
    }

    private async parsePlainText(data: string): Promise<any[]>{
        let files = data.split("diff --git a/")
        files.shift()
        
        return files.map(e => {
            let str = e.trim()
            let start = 0, end = str.indexOf(' ')
            return {
                diff: e.substr(e.indexOf("@"), e.length - 1),
                filename: e.substr(start, end)
            }
        })

    }

    public async reset(appId: string, account: string, provider: Providers): Promise<CredentialsInterface> {
        // Todo: implement delete operation
        let application: CredentialsInterface | null = await this.model.findOne({
            account,
            appId
        })
        if (!application) {
            application = await this.initiate(appId, account)
         }
        let index = application.repository.findIndex(e => e.provider === provider)
        if (index === -1) {
            throw new BadInputFormatException("No config for this provider")
        }
        application.repository[index].url = '';
        application.repository[index].project = '';
        application.repository[index].default = false;
        application.repository[index].accessToken = '';
        application.repository[index].refreshToken = '';
        
        await application.save()

		return Promise.resolve(application)
    }

    public async setDefaultProvider(appId: string, account: string, provider: Providers): Promise<CredentialsInterface> {
        // Todo: implement delete operation
        let application: CredentialsInterface | null = await this.model.findOne({
            account,
            appId
        })
        if (!application) {
            application = await this.initiate(appId, account)
         }
        let index = application.repository.findIndex(e => e.provider === provider)
        if (index === -1) {
            throw new BadInputFormatException("No config for this provider")
        }
        for (let repo of application.repository) {
            if (repo.provider === provider) {
                repo.default = true
            } else {
                repo.default = false
            }
        }
        await application.save()

		return Promise.resolve(application)
    }
    
    public async initiate(appId: string, account: string): Promise<CredentialsInterface>{
        let application: CredentialsInterface | null = await this.model.findOne({
            account,
            appId
        })
        if (!application) {
            let server: Server = {
                ip: '',
                user: '',
                sshPrivateKey: '',
                path: ''
            }
            application = new this.model({
                account,
                appId,
                repository: [],
                server
            })
            let repo: Repository = {
                url: '',
                project: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.GITHUB
            }
            application.repository.push(repo)

            repo = {
                project: '',
                url: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.GITLAB
            }
            application.repository.push(repo)
            repo = {
                project: '',
                url: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.BITBUCKET
            }
            application.repository.push(repo)
            
            
            await application.save()
        }
        if (!Array.isArray(application.repository)) {
            application.repository = []
            let repo: Repository = {
                url: '',
                project: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.GITHUB
            }
            application.repository.push(repo)
            await application.save()

            repo = {
                project: '',
                url: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.GITLAB
            }
            application.repository.push(repo)
            await application.save()
            repo = {
                project: '',
                url: '',
                default: false,
                accessToken: '',
                refreshToken: '',
                provider: Providers.BITBUCKET
            }
            application.repository.push(repo)
            
            
            await application.save()
        }
        return application
    }

    async saveFile(path: string, module: string, appId: string): Promise<string>{
        try {
            let parent = path.split('/')
            let filename = parent.pop();
            let { download_url } = await this.branchFile(appId, module, path);
            var options = {
                directory: "./public/",
                filename: filename
            }
            if (!existsSync(options.directory))
              mkdirSync(options.directory);

            var Request = require('request-promise');
            var optionsStart = {
                uri: download_url,
                method: "GET",
                encoding: null
              };
            let fileUrl = ""
            var policyReport = await Request(optionsStart);
            
            writeFileSync(options.directory+options.filename, policyReport);
            fileUrl = await new Uploader().upload(options.directory + options.filename, 'files', { resource_type: "raw" })
            unlinkSync(options.directory+options.filename)
            return fileUrl;
        } catch (error) {
            throw new Error(error.message)
        }
    }

    async refreshAccessToken(appId: string): Promise<CredentialsInterface | null>{
        let app: CredentialsInterface | null = await this.model.findOne({ appId });
        
        if (!app || !app.repository) return null;
        
        let index = app.repository.findIndex(e => e.default);
        if (index === -1) return null;
        
        if (app.repository[index].provider !== Providers.BITBUCKET)
            return null;

        // refresh token
        let auth = await post(
            `https://${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}@bitbucket.org/site/oauth2/access_token`,
            {
                json: true,
                formData: {
                    refresh_token: app.repository[index].refreshToken,
                    grant_type: 'refresh_token'
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )                
        if (auth && auth.access_token && app.repository) {
            let index = app.repository.findIndex(e => e.provider === Providers.BITBUCKET);
            if (index===-1) return null;
            app.repository[index].refreshToken = auth.refresh_token;
            app.repository[index].accessToken = auth.access_token;
            await app.save();
        }

        return app;
    }

    async submitModule(appId: string, module: string): Promise<void> {
		// Todo: implement fetch single app
        try {
            await this.commitChanges(appId, module);

            let app: CredentialsInterface | null = await this.model.findOne({ appId })
        
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		let merge_request = await this.merges.findOne({
			module,
			app: appId
        })

        let mergeRequest, commits
		switch (app.repository[index].provider) {
            case Providers.GITLAB:
                if (!merge_request) {
                    mergeRequest = await post(
                        `https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests?access_token=${app.repository[index].accessToken}`,
                        {
                            json: true,
                            body: {
                                source_branch: `${module + Branches.FEATURE}`,
                                target_branch: `${Branches.QA}`,
                                squash: true,
                                title: "submission for "+module
                            }
                        }
                    )
                    merge_request = new this.merges({
                        module,
                        app: appId,
                        submissions: 0,
                        mergeRequest: mergeRequest.iid,

                    })
                    await merge_request.save()
                }
				
                commits = await get(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests/${merge_request.mergeRequest}/commits?access_token=${app.repository[index].accessToken}`,
					{
						json: true
					}
                )
                for (let commit of commits) {
                    let changes = await get(
                        `https://gitlab.com/api/v4/projects/${app.repository[index].project}/repository/commits/${commit.id}/diff?access_token=${app.repository[index].accessToken}`,
                        {
                            json: true
                        }
                    )
                    for (let diff of changes) {
                        let filename = diff.new_path.split('/')[diff.new_path.split('/').length-1]
                        if (merge_request.changes.find(e => e.name === filename)) {
                            let ind = merge_request.changes.findIndex(e => e.name === filename)
                            let exist = merge_request.changes[ind].versions.findIndex((e:any) => e.path === diff.new_path&&e.diff===diff.diff)
                            if (exist === -1) {
                                let download_url = await this.saveFile(diff.new_path, module, appId)
                                if (download_url)
                                    merge_request.changes[ind].versions.push(
                                        {
                                            path: diff.new_path,
                                            diff: diff.diff,
                                            created_at: commit.created_at,
                                            download_url
                                        }
                                    )
                            }
                        } else {
                            let download_url = await this.saveFile(diff.new_path, module, appId)
                            if (download_url)
                                merge_request.changes.push(
                                    {
                                        name: filename,
                                        versions: [
                                            {
                                                download_url,
                                                path: diff.new_path,
                                                diff: diff.diff,
                                                created_at: commit.created_at
                                            }
                                        ]
                                    }
                                )
                        }
                    }
                }
                merge_request.submissions+=1
                await merge_request.save()
				break
			case Providers.BITBUCKET:
                const refreshedApp = await this.refreshAccessToken(appId);
                if (refreshedApp) app = refreshedApp;

                if (!merge_request) {
                    mergeRequest = await post(
                        `https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests?access_token=${app.repository[index].accessToken}`,
                        {
                            json: true,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: {
                                title: `Submission for ${module}`,
                                source: {
                                    branch: {
                                        name: `${module + Branches.FEATURE}`
                                    }
                                },
                                destination: {
                                    branch: {
                                        name: `${Branches.QA}`
                                    }
                                }
                            }
                        }
                    )
                    merge_request = await new this.merges({
                        module,
                        app: appId,
                        submissions: 0,
                        mergeRequest: mergeRequest.id
                    }).save()
                }

                commits = await get(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests/${merge_request.mergeRequest}/commits?access_token=${app.repository[index].accessToken}`,
					{
                        json: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
					}
                )
                for (let commit of commits.values) {
                    let result:any = await get(
                        `https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/diff/${commit.hash}?access_token=${app.repository[index].accessToken}`,
                        {
                            json: true,
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }
                    )
                    let files = await this.parsePlainText(result)
                    for (let diff of files) {
                        let filename = diff.filename.split('/')[diff.filename.split('/').length-1]
                        if (merge_request.changes.find(e => e.name === filename)) {
                            let ind = merge_request.changes.findIndex(e => e.name === filename)
                            let exist = merge_request.changes[ind].versions.findIndex((e:any) => e.path === diff.filename&&e.diff===diff.diff)
                            if (exist === -1) {
                                let download_url = await this.saveFile(diff.filename, module, appId)
                                if (download_url)
                                    merge_request.changes[ind].versions.push(
                                        {
                                            download_url,
                                            path: diff.filename,
                                            diff: diff.diff,
                                            created_at: commit.date
                                        }
                                    )
                            }
                        } else {
                            let download_url = await this.saveFile(diff.filename, module, appId)
                            if (download_url)
                                merge_request.changes.push(
                                    {
                                        name: filename,
                                        versions: [
                                            {
                                                download_url,
                                                path: diff.filename,
                                                diff: diff.diff,
                                                created_at: commit.date
                                            }
                                        ]
                                    }
                                )
                        }
                    }
                }
                console.log("submission complete")
                merge_request.submissions+=1
                await merge_request.save()
				break
            case Providers.GITHUB:
                if (!merge_request) {
                    mergeRequest = await post(
                        `https://api.github.com/repos/${app.repository[index].project}/pulls`,
                        {
                            json: true,
                            body: {
                                head: `${module + Branches.FEATURE}`,
                                base: `${Branches.QA}`,
                                title: `Submission for ${module}`
                            },
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `token ${app.repository[index].accessToken}`,
                                'User-Agent': 'Zeedas',
                                accept: 'application/vnd.github.v3+json'
                            }
                        }
                    )
                    
                    merge_request = new this.merges({
                        module,
                        app: appId,
                        submissions: 0,
                        mergeRequest: mergeRequest.number
                    })
                    await merge_request.save()
                }
                commits = await get(
					`https://api.github.com/repos/${app.repository[index].project}/pulls/${merge_request.mergeRequest}/commits`,
					{
                        json: true,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `token ${app.repository[index].accessToken}`,
                            'User-Agent': 'Zeedas',
                            accept: 'application/vnd.github.v3+json'
                        }
					}
                )
                
                for (let commit of commits) {
                    let result:any = await get(
                        `https://api.github.com/repos/${app.repository[index].project}/commits/${commit.sha}`,
                        {
                            json: true,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `token ${app.repository[index].accessToken}`,
                                'User-Agent': 'Zeedas',
                                accept: 'application/vnd.github.v3+json'
                            }
                        }
                    )
                    for (let diff of result.files) {
                        let filename = diff.filename.split('/')[diff.filename.split('/').length-1]
                        if (merge_request.changes.find(e => e.name === filename)) {
                            let ind = merge_request.changes.findIndex(e => e.name === filename)
                            let exist = merge_request.changes[ind].versions.findIndex((e:any) => e.path === diff.filename&&e.diff===diff.patch)
                            if (exist === -1) {
                                let download_url = await this.saveFile(diff.filename, module, appId)
                                if (download_url)
                                    merge_request.changes[ind].versions.push(
                                        {
                                            download_url, 
                                            path: diff.filename,
                                            diff: diff.patch,
                                            created_at: diff.commit ? diff.commit.committer.date : new Date().toISOString()
                                        }
                                    )
                            }
                        } else {
                            let download_url = await this.saveFile(diff.filename, module, appId)                            
                            if (download_url)
                                merge_request.changes.push(
                                    {
                                        name: filename,
                                        versions: [
                                            {
                                                download_url,
                                                path: diff.filename,
                                                diff: diff.patch,
                                                created_at: diff.commit ? diff.commit.committer.date : new Date().toISOString()
                                            }
                                        ]
                                    }
                                )
                        }
                    }
                }
                merge_request.submissions+=1
                await merge_request.save()
				break
			default:
				break
		}
        } catch (error) {
            throw new Error(error.message)   
        }

	}
    

    async fetchSubmissions(appId: string, module: string): Promise<any> {
		// Todo: implement fetch single app
		let merge_request = await this.merges.findOne({
			module,
			app: appId
		})
		return merge_request
	}

	async testModule(
		appId: string,
		module: string
	): Promise<CredentialsInterface> {
		// Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		let merge_request = await this.merges.findOne({
			module,
			app: appId
		})
		if (!merge_request) {
			throw new BadInputFormatException(
				'There was an error fetching this submission. Ensure this module has been submitted'
			)
		}
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				await put(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests/${merge_request.mergeRequest}?access_token=${app.repository[index].accessToken}`,
					{
						json: true
					}
				)
				break
			case Providers.BITBUCKET:
				await post(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests/${merge_request.mergeRequest}/merge?access_token=${app.repository[index].accessToken}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json'
						},
						body: {}
					}
				)
				break
			case Providers.GITHUB:
				await put(
					`https://api.github.com/repos/${app.repository[index].project}/pulls/${merge_request.mergeRequest}/merge`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				break
			default:
				break
		}
		this.deploy(app)
		return app
	}

	async approveModule(appId: string, module: string): Promise<void> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		let merge_request = await this.merges.findOne({
			module,
			app: appId
		})
		if (!merge_request) {
			throw new BadInputFormatException(
				'There was an error fetching this submission. Ensure this module has been submitted'
			)
		}
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				let mergeRequest = await post(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests?access_token=${app.repository[index].accessToken}`,
					{
						json: true,
						body: {
							source_branch: `${Branches.QA}`,
							target_branch: `${Branches.MAIN}`,
							squash: true
						}
					}
				)
				await put(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests/${mergeRequest.iid}?access_token=${app.repository[index].accessToken}`,
					{
						json: true
					}
				)
				break
			case Providers.BITBUCKET:
				mergeRequest = await post(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests?access_token=${app.repository[index].accessToken}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json'
						},
						body: {
							title: `Submission for ${merge_request.module}`,
							source: {
								branch: {
									name: `${Branches.QA}`
								}
							},
							destination: {
								branch: {
									name: `${Branches.MAIN}`
								}
							}
						}
					}
				)
				await post(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests/${mergeRequest.id}/merge?access_token=${app.repository[index].accessToken}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json'
						},
						body: {}
					}
				)
				break
			case Providers.GITHUB:
				mergeRequest = await post(
					`https://api.github.com/repos/${app.repository[index].project}/pulls`,
					{
						json: true,
						body: {
							base: `${Branches.MAIN}`,
							head: `${Branches.QA}`,
							title: `Submission for ${merge_request.module}`
						},
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				await put(
					`https://api.github.com/repos/${app.repository[index].project}/pulls/${mergeRequest.number}/merge`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				break
			default:
				break
		}

		if (merge_request) {
			await merge_request.remove()
		}
        } catch (error) {
            throw new BadInputFormatException(error.message)   
        }
	}

	async rejectModule(appId: string, module: string): Promise<void> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		let merge_request = await this.merges.findOne({
			module,
			app: appId
		})
		if (!merge_request) {
			throw new BadInputFormatException(
				'There was an error fetching this submission. Ensure this module has been submitted'
			)
		}
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				let commits = await put(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/merge_requests/${merge_request.mergeRequest}/commits?access_token=${app.repository[index].accessToken}`,
					{
						json: true
					}
				)
				// @ts-ignore
				commits = commits.map((commit) => commit.id)
				this.revertDeployment(app, commits, module)
				break
			case Providers.BITBUCKET:
				commits = await get(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/pullrequests/${merge_request.mergeRequest}/commits?access_token=${app.repository[index].accessToken}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				// @ts-ignore
				commits = commits.map((commit) => commit.id)
				this.revertDeployment(app, commits, module)
				break
			case Providers.GITHUB:
				commits = await get(
					`https://api.github.com/repos/${app.repository[index].project}/pulls/${merge_request.mergeRequest}/commits`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				// @ts-ignore
				commits = commits.map((commit) => commit.sha)
				this.revertDeployment(app, commits, module)
				break
			default:
				break
		}
		await merge_request.remove()
        } catch (error) {
            throw new BadInputFormatException(error.message)
        }
    }

    async branchFile(appId: string, module: string, path: string): Promise<any> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
            let trees = []
            let parent = path.split('/')
            let filename = parent.pop();
            path = parent.join("/")
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				trees = await get(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/repository/tree?access_token=${app.repository[index].accessToken}&ref=${module + Branches.FEATURE}&path=${path}`,
					{
						json: true
					}
                )
                trees = trees.map((e:any) => {
                    if (e.type === 'blob') {
                        e.type = 'file'
                    }
                    if (e.type === 'tree') {
                        e.type = 'dir'
                    }
                    return {
                        type: e.type,
                        path: e.path,
                        name: e.name,
                        download_url: e.type = 'file'?`https://gitlab.com/api/v4/projects/${app?.repository[index].project}/repository/blobs/${e.id}/raw?access_token=${app?.repository[index].accessToken}&ref=${module + Branches.FEATURE}`:''
                    }
                })
				break
			case Providers.BITBUCKET:
				let response = await get(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/src/${module + Branches.FEATURE}/${path}?access_token=${app.repository[index].accessToken}&pagelen=100`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
                )
                trees = response.values
                trees = trees.map((e:any) => {
                    if (e.type === 'commit_file') {
                        e.type = 'file'
                    }
                    if (e.type === 'commit_directory') {
                        e.type = 'dir'
                    }
                    let paths = e.path.split('/')
                    let name = paths[paths.length-1]
                    return {
                        type: e.type,
                        path: e.path,
                        name: name,
                        download_url: e.type = 'file'?`https://api.bitbucket.org/2.0/repositories/${app?.repository[index].project}/src/${module + Branches.FEATURE}/${e.path}?access_token=${app?.repository[index].accessToken}`:''
                    }
                })
				break
			case Providers.GITHUB:
				trees = await get(
					`https://api.github.com/repos/${app.repository[index].project}/contents/${path}?ref=${module + Branches.FEATURE}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
                )
                trees = trees.map((e:any) => {
                    if (e.type === 'blob') {
                        e.type = 'file'
                    }
                    if (e.type === 'tree') {
                        e.type = 'dir'
                    }
                    return {
                        type: e.type,
                        download_url: e.type = 'file'?e.download_url:'',
                        path: e.path,
                        name: e.name
                    }
                })
				break
			default:
				break
		}
		return trees.find((e:any)=>e.name===filename)
        } catch (error) {
            throw new BadInputFormatException("Failed to fetch trees")
        }
    }
    
    async branchTrees(appId: string, module: string, path: string): Promise<object[]> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
        let trees = []
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				trees = await get(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/repository/tree?access_token=${app.repository[index].accessToken}&ref=${module + Branches.FEATURE}&path=${path}`,
					{
						json: true
					}
                )
                trees = trees.map((e:any) => {
                    if (e.type === 'blob') {
                        e.type = 'file'
                    }
                    if (e.type === 'tree') {
                        e.type = 'dir'
                    }
                    return {
                        type: e.type,
                        path: e.path,
                        name: e.name,
                        download_url: e.type = 'file'?`https://gitlab.com/api/v4/projects/${app?.repository[index].project}/repository/blobs/${e.id}/raw?access_token=${app?.repository[index].accessToken}&ref=${module + Branches.FEATURE}`:''
                    }
                })
				break
			case Providers.BITBUCKET:
				let response = await get(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/src/${module + Branches.FEATURE}/${path}?access_token=${app.repository[index].accessToken}&pagelen=100`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
                )
                trees = response.values
                trees = trees.map((e:any) => {
                    if (e.type === 'commit_file') {
                        e.type = 'file'
                    }
                    if (e.type === 'commit_directory') {
                        e.type = 'dir'
                    }
                    let paths = e.path.split('/')
                    let name = paths[paths.length-1]
                    return {
                        type: e.type,
                        path: e.path,
                        name: name,
                        download_url: e.type = 'file'?`https://api.bitbucket.org/2.0/repositories/${app?.repository[index].project}/src/${module + Branches.FEATURE}/${e.path}?access_token=${app?.repository[index].accessToken}`:''
                    }
                })
				break
			case Providers.GITHUB:
				trees = await get(
					`https://api.github.com/repos/${app.repository[index].project}/contents/${path}?ref=${module + Branches.FEATURE}`,
					{
						json: true,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
                )
                trees = trees.map((e:any) => {
                    if (e.type === 'blob') {
                        e.type = 'file'
                    }
                    if (e.type === 'tree') {
                        e.type = 'dir'
                    }
                    return {
                        type: e.type,
                        download_url: e.type = 'file'?e.download_url:'',
                        path: e.path,
                        name: e.name
                    }
                })
				break
			default:
				break
		}
		return trees
        } catch (error) {
            throw new BadInputFormatException("Failed to fetch trees")
        }
    }
    async addToTree(appId: string, module: string, path: string): Promise<void> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		switch (app.repository[index].provider) {
			case Providers.GITLAB:
				await post(
					`https://gitlab.com/api/v4/projects/${app.repository[index].project}/repository/files/${encodeURIComponent(path)}?access_token=${app.repository[index].accessToken}`,
					{
                        json: true,
                        body: {
                            branch: `${module + Branches.FEATURE}`,
                            "commit_message": "Adding file to task "+`${module + Branches.FEATURE}`,
                            "content": ""
                        }
					}
				)
				break
            case Providers.BITBUCKET:
                let data: any = {
                    message: "Adding file to task " + `${module + Branches.FEATURE}`,
                    branch: `${module + Branches.FEATURE}`
                }
                data[path] = ""
				await post(
					`https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/src/?access_token=${app.repository[index].accessToken}`,
					{
                        json: true,
                        formData: data,
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						}
					}
				)
				break
			case Providers.GITHUB:
				await put(
					`https://api.github.com/repos/${app.repository[index].project}/contents/${path}`,
					{
                        json: true,
                        body: {
                            branch: `${module + Branches.FEATURE}`,
                            "message": "Adding file to task "+`${module + Branches.FEATURE}`,
                            "content": ""
                        },
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas',
							accept: 'application/vnd.github.v3+json'
						}
					}
				)
				break
			default:
				break
		}
        } catch (error) {
            throw new BadInputFormatException("Failed to add path to tree")
        }
	}

	async createBranch(appId: string, module: string): Promise<void> {
		try {
            // Todo: implement fetch single app
		let app: CredentialsInterface | null = await this.model.findOne({appId})
		if (
            !app ||
            !app.repository
        ) {
            throw new BadInputFormatException(
                'This app does not exist for this team'
            )
        }
        let index = app.repository.findIndex(e => e.default)
            if (index === -1) {
                throw new BadInputFormatException("No default config set for this app")
            }
		switch (app.repository[index].provider) {
            case Providers.GITLAB:
                let exists = await gitlab.checkGitlabBranch(`${module + Branches.FEATURE}`, app )
                if (!exists) {
                    await post(
                        `https://gitlab.com/api/v4/projects/${
                            app.repository[index].project
                        }/repository/branches?access_token=${
                            app.repository[index].accessToken
                        }&branch=${module + Branches.FEATURE}&ref=${Branches.QA}`
                    )
                }
				break
            case Providers.BITBUCKET:
                let exist = await bitbucket.checkBitbucketBranch(`${module + Branches.FEATURE}`, app)
                if (!exist) {
                    await post(
                        `https://api.bitbucket.org/2.0/repositories/${app.repository[index].project}/refs/branches?access_token=${app.repository[index].accessToken}`,
                        {
                            json: true,
                            body: {
                                name: module + Branches.FEATURE,
                                target: {
                                    hash: Branches.QA
                                }
                            },
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                }
                console.log("Branch created")
				break
            case Providers.GITHUB:
				let url = `https://api.github.com/repos/${app.repository[index].project}/git/refs`
				var commits = await get(url, {
					json: true,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `token ${app.repository[index].accessToken}`,
						'User-Agent': 'Zeedas'
					}
				})
				let by = {
					ref: `refs/heads/${Branches.QA}`,
					sha: ''
				}
				// @ts-ignore
				let qaBranch = commits.find((e) => e.ref === by.ref)
				if (!qaBranch) {
					throw new BadInputFormatException('could not create this branch.')
				}
				let branch = qaBranch.object.sha
				by.sha = branch
				by.ref = `refs/heads/${module + Branches.FEATURE}`
				await post(
					`https://api.github.com/repos/${app.repository[index].project}/git/refs`,
					{
						json: true,
						body: by,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `token ${app.repository[index].accessToken}`,
							'User-Agent': 'Zeedas'
						}
					}
				)
				break
			default:
				break
		}
        } catch (error) {
        }
    }
    
    async revertDeployment(
		app: CredentialsInterface,
		commits: string[],
		module: string
	): Promise<void> {
		if (app.server) {
			let data: ServerData = {
				// @ts-ignore
				authMechanism: app.server.authMechanism,
				path: app.server.path,
				url: app.server.ip,
				username: app.server.user,
				commands: app.commands,
				password: app.server.password,
				sshPrivateKey: app.server.sshPrivateKey
			}
			await server.gitRevertServer(app.appId.toString(), data, commits, module)
		}
    }
    
    async deploy(app: CredentialsInterface): Promise<void> {
		if (app.server) {
			let data: ServerData = {
				// @ts-ignore
				authMechanism: app.server.authMechanism,
				path: app.server.path,
				url: app.server.ip,
				username: app.server.user,
				commands: app.commands,
				password: app.server.password,
				sshPrivateKey: app.server.sshPrivateKey
			}
			await server.testServerConfig(
				app.appId.toString(),
				app.account.toString(),
				data
			)
		}
	}

    
	/**
	 * Get app files
	 * @param {string} appId
	 */
    async getFiles(appId: string): Promise<any> {
		const app: CredentialsInterface | null = await this.model.findOne({ appId })
        
		if (!app || !app.repository)
            throw new BadInputFormatException('This app does not exist for this team');

        const index = app.repository.findIndex(e => e.default);
        if (index === -1)
            throw new BadInputFormatException("No default config set for this app");
                
        const repo = app.repository[index];
        const projectRoot = process.env.CLOUDINARY_NAME || 'zeedas';
        // @ts-ignore
        const projectPath =  projectRoot.concat('/', appId);
        if (!existsSync(projectPath)) {
            const git = new GitHelper(repo.url, projectPath, repo.accessToken, repo.provider);
            await git.clone();
        }
        
        // File Compression
        const zip = new Zip(); 
        zip.addLocalFolder(projectPath);
        const files = zip.toBuffer();
        return files;
	}

    
	/**
	 * Update app files
	 * @param {string} appId
	 */
    async updateFiles(appId: string, file: any, filePath?: string): Promise<void> {
        if (!filePath)
            if (!file || file.mimetype !== 'application/zip')
                throw new BadInputFormatException('This is not a valid zip file');

        const projectRoot = process.env.CLOUDINARY_NAME || 'zeedas';
        // @ts-ignore
        const projectPath =  projectRoot.concat('/', appId);
        // File Decompression
        if (filePath) {
            const zip = new Zip(filePath); 
            zip.extractAllTo(projectPath, true);
            unlinkSync(filePath);
        } else {
            if (existsSync(projectPath)) {
                await file.mv(`${projectPath}.zip`);
                const zip = new Zip(`${projectPath}.zip`); 
                zip.extractAllTo(projectPath, true);
                unlinkSync(`${projectPath}.zip`);
            }
        }
	}

    
	/**
	 * Commit app changes
	 * @param {string} appId
	 * @param {string} moduleId
	 */
    async commitChanges(appId: string, moduleId: string): Promise<void> {
		const app: CredentialsInterface | null = await this.model.findOne({ appId })
        
		if (!app || !app.repository)
            throw new BadInputFormatException('This app does not exist for this team');

        const index = app.repository.findIndex(e => e.default);
        if (index === -1)
            throw new BadInputFormatException("No default config set for this app");
                
        const repo = app.repository[index];
        const projectRoot = process.env.CLOUDINARY_NAME || 'zeedas';
        // @ts-ignore
        const projectPath =  projectRoot.concat('/', appId);
        if (existsSync(projectPath)) {
            const git = new GitHelper(repo.url, projectPath, repo.accessToken, repo.provider);
            await git.commit(`initial commit on ${String(new Date().getTime())}`);
            await git.push(`${moduleId}-zeedas`);
        }
	}
}

export default Credentials
