import {config} from 'dotenv'
// Load environment variables
config()
import Application from './app'
import RPCServer from './rpc/server'

// instantiate application
new Application()

const rcpServer = new RPCServer()

rcpServer.start()
