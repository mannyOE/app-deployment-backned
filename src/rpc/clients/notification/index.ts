import {notification} from '@src/rpc/config'

const path = require('path')
const PROTO_PATH = path.resolve(__dirname, '../../pb/notification.proto')

const GRPCClient = require('node-grpc-client')
export const Notify = new GRPCClient(
	PROTO_PATH,
	'notifypackage',
	'Notify',
	`${notification.host}:${notification.port}`
)
