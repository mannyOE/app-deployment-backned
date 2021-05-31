import {users} from '@src/rpc/config'

const path = require('path')
const PROTO_PATH = path.resolve(__dirname, '../../pb/user.proto')

const GRPCClient = require('node-grpc-client')
export const User = new GRPCClient(
	PROTO_PATH,
	'userpackage',
	'User',
	`${users.host}:${users.port}`
)
