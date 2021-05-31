
import {createConnection, Connection, Model} from 'mongoose'

import MongoConfig from '../configs/mongo'
import mergeFactory, {MergeInterface} from './merges'
import credsFactory, {CredentialsInterface} from './credentials'

export const conn: Connection = createConnection(
	MongoConfig.uri,
	MongoConfig.options
)

export const Person: Model<MergeInterface> = mergeFactory(conn)
export const Creds: Model<CredentialsInterface> = credsFactory(conn)
export const Merges: Model<MergeInterface> = mergeFactory(conn)

conn.once('open', (): void => console.log('db connection open'))