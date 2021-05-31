import { createServer } from 'https'
import {join} from 'path'
import {json, urlencoded} from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import {Request, Response} from 'express'
import * as logger from 'morgan'
import * as helmet from 'helmet'
import * as cors from 'cors'
import * as compression from 'compression'
import AppConfig from './configs/app'
import {ctrl} from './controllers'
import router from './routes'
import SocketUpload from '@src/utils/socket-upload'
import { readFileSync } from 'fs'
require('./utils/worker')
const socket = require('socket.io')
const fileUpload = require('express-fileupload')
const serverOptions = {
	key: readFileSync(join(__dirname, '../', 'certs', 'privkey.pem')),
	cert: readFileSync(join(__dirname, '../', 'certs', 'fullchain.pem'))
  };

/**
 * Express application
 */
class Application {
	/**
	 * Express application
	 */
	public express: express.Application

	/**
	 * @constructor
	 */
	constructor() {
		this.express = express()
		this.configure()
		this.handleExceptions()
		// const server = this.express.listen(AppConfig.port, () => {
		// 	console.log(`${AppConfig.appName} is listening at port ${AppConfig.port}`)
		// })
		const server = createServer(serverOptions, this.express).listen(AppConfig.port, () => {
			console.log(`${AppConfig.appName} is listening at port ${AppConfig.port}`)
		})
        const io = socket(server, {
            cors: {
                origin: true,
                methods: ["*"]
              }
        })
		io.sockets.on('connection', (socket: any) => {
			console.log(`new socket connection id: ${socket.id}`)
			SocketUpload(socket)
		});
	}

	/**
	 * Configure express application
	 */
	private configure(): void {
		this.express.use(logger('dev'))
		this.express.use(json({limit: AppConfig.clientBodyLimit}))
		this.express.use(urlencoded({extended: true}))
		this.express.use(cookieParser())
		this.express.use(express.static(join(__dirname, '../', 'public')))
		this.express.use(express.static(join(__dirname, '../', 'zeedas')))
		this.express.use(compression())
		this.express.use(fileUpload())
		this.express.use(cors("*"))
		this.express.use(helmet())
		this.express.use('/', router)
	}

	/**
	 * Handles express application exceptions
	 */
	private handleExceptions(): void {
		this.express.use(ctrl.handleNotFound)
		this.express.use(ctrl.handleError)
	}
}

// Initialize application
export default Application
