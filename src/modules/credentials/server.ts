/**
 * @category Credentialss
 */
import {Model} from 'mongoose'
var Client = require('ssh2').Client
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
import {Branches} from '.'
import {initializeApp, database, credential, app} from 'firebase-admin'
const Ping = require('ping')

var execSh = require('exec-sh')
import {join} from 'path'
const fs = require('fs')
const NodeSSH = require('node-ssh')

const ssh = new NodeSSH()

const firebaseServiceAccountJson = require('../../../firebase-service.json')
const firebaseInitOptions = {
	credential: credential.cert(firebaseServiceAccountJson),
	databaseURL: `https://${firebaseServiceAccountJson.project_id}.firebaseio.com`
}
const firebaseApp = initializeApp(firebaseInitOptions, 'databaseApp')

interface CredentialsConstructorInterface {
	model: Model<CredentialsInterface>
}
export interface ServerData {
	username: string
	url: string
	path: string
	authMechanism: AuthMechanism
	password?: string
	sshPrivateKey?: string
	commands?: {
		build?: string
		run?: string
	}
}

interface SSHConnectOptions {
	host?: string
	port?: number
	username?: string
	password?: string
	privateKey?: string
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
class ServerCredentials extends Module {
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

	private async formatKey(key: string, path: string) {
		var stream = fs.createWriteStream(path, {flags: 'a'})
		let initial = '-----BEGIN RSA PRIVATE KEY-----',
			end = '-----END RSA PRIVATE KEY-----',
			body = []
		key = key.replace(initial, '')
		key = key.replace(end, '')
		key = key.trim()
		let keys = key.split(' ')
		body = [initial, ...keys, end]
		for (let key of body) {
			stream.write(key + '\n')
		}
	}

	private async workDirectory(app: string, password: string): Promise<string> {
		var dir = join(__dirname, '../../../public/')

		// create directory if not already exist;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir)
		}
		if (!fs.existsSync(dir + app)) {
			fs.mkdirSync(dir + app)
		}
		if (!fs.existsSync(dir + app + '/' + app + '.key')) {
			await this.formatKey(password, dir + app + '/' + app + '.key')
		}
		return dir + app
	}

	private async saveLogToFirebaseDatabase(
		log: string,
		appId: string,
		fresh?: boolean
	) {
		const dbRef = database(firebaseApp).ref(appId)
		if (fresh) {
			dbRef.remove()
		}
		const time = Date.now()
		dbRef
			.child('deployment-logs')
			.push({
				message: log,
				timestamp: time
			})
			.then((resp) => {})
			.catch((error: Error) => console.log(error))
	}

	public async saveServerConfig(
		appId: string,
		account: string,
		data: ServerData
	): Promise<CredentialsInterface> {
		let application: CredentialsInterface | null = await this.model.findOne({
			account,
			appId
		})
		if (!application) {
			throw new BadInputFormatException('Cannot find this app')
		}
		application.server = {
			ip: data.url,
			user: data.username,
			path: data.path,
			authMechanism: data.authMechanism
		}
		if (data.authMechanism === AuthMechanism.PRIVATE_KEY) {
			application.server.sshPrivateKey = data.sshPrivateKey
		}
		if (data.authMechanism === AuthMechanism.PASSWORD) {
			application.server.password = data.password
		}
		if (data.commands) {
			application.commands = data.commands
		}
		await application.save()
		return application
	}

	public async testServerConfig(
		appId: string,
		account: string,
		data: ServerData
	): Promise<void> {
		await this.setup(appId, account, data, false)
	}

	/**
	 * add  server to app
	 * @param {string} appId
	 */
	async setup(
		appId: string,
		account: string,
		data: ServerData,
		run: boolean
	): Promise<void> {
		let application: CredentialsInterface | null = await this.model.findOne({
			account,
			appId
		})
		if (!application) {
			throw new BadInputFormatException('Cannot find this app')
		}
		if (!application.repository) {
			throw new BadInputFormatException('Cannot add server without repository')
        }
        let index = application.repository.findIndex(e => e.default)
        if (index === -1) {
            throw new BadInputFormatException("No default config set for this app")
        }
		if (!application.repository[index].url || !application.repository[index].accessToken) {
			throw new BadInputFormatException('Cannot add server without repository')
		}

		// ping server
		await this.saveLogToFirebaseDatabase(
			`😢😢Pinging server at ${data.url}`,
			appId,
			true
		)
		let response = await Ping.promise.probe(data.url, {
			timeout: 2
		})
		if (!response.alive) {
			await this.saveLogToFirebaseDatabase(
				`👎👎👎Process Terminated: This server is not online, please check the credential again`,
				appId,
				true
			)
			return
		}
		await this.saveLogToFirebaseDatabase('👍👍👍' + response.output, appId)

		let path =
			data.authMechanism === AuthMechanism.PRIVATE_KEY && data.sshPrivateKey
				? await this.workDirectory(appId, data.sshPrivateKey)
				: './'

		//make directory git enabled
		// @ts-ignore
		let keyFile = `${path + '/' + appId}.key`
		const self = this

		execSh(
			data.authMechanism === AuthMechanism.PRIVATE_KEY
				? `chmod 600 ${appId}.key`
				: ``,
			{cwd: path},
			function () {
				let options: SSHConnectOptions = {
					host: data.url,
					username: data.username
				}
				if (data.authMechanism === AuthMechanism.PRIVATE_KEY) {
					options.privateKey = keyFile
				}
				if (data.authMechanism === AuthMechanism.PASSWORD) {
					options.password = data.password
				}
				ssh
					.connect(options) // @ts-ignore
					.then(async function (dis) {
						await self.saveLogToFirebaseDatabase(
							'👍👍👍SERVER Connected Successfully',
							appId
						)
						dis
							.exec(`cd ${data.path}`, [], {
								cwd: '/' + data.username,
								stream: 'stdout',
								options: {pty: true}
							}) // @ts-ignore
							.then(async function (result) {
								await self.saveLogToFirebaseDatabase('👍👍👍Path found', appId)
								dis
									.exec(`git pull origin ${Branches.QA}`, [], {
										cwd: data.path,
										stream: 'stdout',
										options: {pty: true}
									}) // @ts-ignore
									.then(async function (result) {
										await self.saveLogToFirebaseDatabase(
											'👍👍👍Files fetched from ' +
												application?.repository[index].provider,
											appId
										)
										dis
											.exec(`git checkout ${Branches.QA}`, [], {
												cwd: data.path,
												stream: 'stdout',
												options: {pty: true}
											}) // @ts-ignore
											.then(async function (result) {
												await self.saveLogToFirebaseDatabase(
													'👍👍👍checking out files',
													appId
												)
												if (run) {
													dis
														.exec(
															`${data.commands?.build} && ${data.commands?.run}`,
															[],
															{
																cwd: data.path,
																stream: 'stdout',
																options: {pty: true}
															}
														) // @ts-ignore
														.then(async function (result) {
															fs.unlinkSync(keyFile)
															fs.rmdirSync(path)
															await self.saveLogToFirebaseDatabase(
																'👍👍👍Running commands',
																appId
															)
														}) // @ts-ignore
														.catch(async function (error) {
															fs.unlinkSync(keyFile)
															fs.rmdirSync(path)
															await self.saveLogToFirebaseDatabase(
																'👎👎👎Process Terminated:' + error.message,
																appId
															)
														})
												} else {
													fs.unlinkSync(keyFile)
													fs.rmdirSync(path)
												}
											}) // @ts-ignore
											.catch(async function (error) {
												fs.unlinkSync(keyFile)
												fs.rmdirSync(path)
												await self.saveLogToFirebaseDatabase(
													'👎👎👎Process Terminated:' + error.message,
													appId
												)
											})
									}) // @ts-ignore
									.catch(async function (error) {
										fs.unlinkSync(keyFile)
										fs.rmdirSync(path)
										await self.saveLogToFirebaseDatabase(
											'👎👎👎Process Terminated:' + error.message,
											appId
										)
									})
							}) // @ts-ignore
							.catch(async function (error) {
								fs.unlinkSync(keyFile)
								fs.rmdirSync(path)
								await self.saveLogToFirebaseDatabase(
									'👎👎👎Process Terminated:' + error.message,
									appId
								)
							})
					})
			}
		)

		return
	}

	async gitRevertServer(
		appId: string,
		data: ServerData,
		commits: string[],
		module: string
	): Promise<void> {
		let path =
			data.authMechanism === AuthMechanism.PRIVATE_KEY && data.sshPrivateKey
				? await this.workDirectory(appId, data.sshPrivateKey)
				: './'

		//make directory git enabled
		// @ts-ignore
		let keyFile = `${path + '/' + appId}.key`
		const self = this

		execSh(
			data.authMechanism === AuthMechanism.PRIVATE_KEY
				? `chmod 600 ${appId}.key`
				: ``,
			{cwd: path},
			function () {
				let options: SSHConnectOptions = {
					host: data.url,
					username: data.username
				}
				if (data.authMechanism === AuthMechanism.PRIVATE_KEY) {
					options.privateKey = keyFile
				}
				if (data.authMechanism === AuthMechanism.PASSWORD) {
					options.password = data.password
				}
				ssh
					.connect(options) // @ts-ignore
					.then(async function (dis) {
						for (let commit of commits) {
							dis
								.exec(`git revert -n ${commit}`, [], {
									cwd: data.path,
									stream: 'stdout',
									options: {pty: true}
								}) // @ts-ignore
								.then(async function (result) {}) // @ts-ignore
								.catch(async function (error) {
									if (data.authMechanism === AuthMechanism.PRIVATE_KEY) {
										fs.unlinkSync(keyFile)
										fs.rmdirSync(path)
									}
								})
						}
						dis
							.exec(
								`git add . && git commit -m 'Reverting Submission for ${module}' && git push`,
								[],
								{
									cwd: data.path,
									stream: 'stdout',
									options: {pty: true}
								}
							) // @ts-ignore
							.then(async function (result) {}) // @ts-ignore
							.catch(async function (error) {
								if (data.authMechanism === AuthMechanism.PRIVATE_KEY) {
									fs.unlinkSync(keyFile)
									fs.rmdirSync(path)
								}
							})
					})
			}
		)

		return
	}
}

export default ServerCredentials