import {
	Person as PersonModel,
	Creds as credentials,
	Merges as merges
} from '../models'
import Credentials from './credentials'
import Github from './credentials/github'
import Gitlab from './credentials/gitlab'
import Bitbucket from './credentials/bitbucket'
import Server from './credentials/server'

/**
 * @category Modules
 * @param {person} Instance of Person module
 */

export const credential = new Credentials({
	model: credentials,
	merges
})
export const gitlab = new Gitlab({
	model: credentials
})
export const github = new Github({
	model: credentials
})
export const bitbucket = new Bitbucket({
	model: credentials
})
export const server = new Server({
	model: credentials
})