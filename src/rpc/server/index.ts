import {Server, loadPackageDefinition, ServerCredentials} from 'grpc'
import {loadSync} from '@grpc/proto-loader'
import {join} from 'path'
import { deployment } from '../config'
import {credential} from '@modules/index'

/**
 * RPC Server
 * @category service
 */
class RPCServer {
	private server: Server
	private readonly port: number
	private readonly host: string

	/**
	 * @constructor
	 * @param {string} host
	 * @param {number} port
	 */
	public constructor() {
		this.port = deployment.port
		this.host = deployment.host
		this.server = new Server()
		this.setup()
	}

	/**
	 * Start the rpc server
	 */
	public start(): void {
		this.server.start()
		console.log(`RPC server is listening on port: ${this.port}`)
	}

	/**
	 * Setup the server
	 */
	private setup(): void {
		const PROTO_PATH = join(__dirname, '../pb/deployments.proto')
		const credentials = ServerCredentials.createInsecure()

		const packageDefinition = loadSync(PROTO_PATH, {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true
		})
		const protoDescriptor = loadPackageDefinition(packageDefinition)
		const deploymentPackage = protoDescriptor.deploymentPackage
		// @ts-ignore
		this.server.addService(deploymentPackage.Deployment.service, {
            createBranch: this.createBranch,
            approve: this.approveSubmission,
			submit: this.submitModule,
			reject: this.rejectSubmission
		})
		this.server.bind(`${this.host}:${this.port}`, credentials)
	}

	private async createBranch(call: object, callback: Function): Promise<void> {
		// @ts-ignore
		try {
			// @ts-ignore
			let {payload} = call.request
			payload = JSON.parse(payload)
			const {module, app} = payload
			if (!app || !module) {
				throw new Error(
					'Both module and app ids are required tto create a branch'
				)
			}
			await credential.createBranch(app, module)
			callback(null, {done: true})
		} catch (e) {
			callback(e)
		}
	}
	private async submitModule(call: object, callback: Function): Promise<void> {
		// @ts-ignore
		try {
			// @ts-ignore
			let {payload} = call.request
			payload = JSON.parse(payload)
			const {module, app} = payload
			if (!app || !module) {
				throw new Error(
					'Both module and app ids are required tto create a branch'
				)
			}
			
			await credential.submitModule(app, module)
			callback(null, {done: true})
		} catch (e) {
			callback(e)
		}
	}

	private async approveSubmission(
		call: object,
		callback: Function
	): Promise<void> {
		// @ts-ignore
		try {
			// @ts-ignore
			let {payload} = call.request
			payload = JSON.parse(payload)
			const {module, app} = payload
			if (!app || !module) {
				throw new Error(
					'Both module and app ids are required tto create a branch'
				)
			}
			await credential.approveModule(app, module)
			callback(null, {done: true})
		} catch (e) {
			callback(e)
		}
	}

	private async rejectSubmission(
		call: object,
		callback: Function
	): Promise<void> {
		// @ts-ignore
		try {
			// @ts-ignore
			let {payload} = call.request
			payload = JSON.parse(payload)
			const {module, app} = payload
			if (!app || !module) {
				throw new Error(
					'Both module and app ids are required tto create a branch'
				)
			}
			let info = await credential.rejectModule(app, module)
			callback(null, {done: true})
		} catch (e) {
			callback(e)
		}
	}
}

export default RPCServer
