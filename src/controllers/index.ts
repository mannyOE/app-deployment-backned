import {credential, github, gitlab, bitbucket, server} from '../modules'
import Ctrl from './ctrl'
import Credentials from './credentials'
export const credentialsCtrl = new Credentials({
	module: credential,
	gitlab,
	bitbucket,
	github,
	server
})
export const ctrl = new Ctrl()
