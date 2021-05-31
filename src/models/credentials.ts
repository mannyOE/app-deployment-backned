import {Connection, Model, Schema, Document} from 'mongoose'

/**
 * Attributes of a project
 * @category Project Model
 */

export enum AuthMechanism {
	/**
	 * uses password to ssh into server
	 */
	PASSWORD = 'password',
	/**
	 * uses private key to ssh into server
	 */
	PRIVATE_KEY = 'private-key'
}

export enum Providers {
	GITLAB = 'gitlab',
	GITHUB = 'github',
	BITBUCKET = 'bitbucket'
}

export interface Repository {
	/**
	 * @param {string} url repository url for this app
	 */
    url: string
    project: string
	/**
	 * @param {Providers} provider repository provider for this app
	 */
	provider: Providers
	/**
	 * @param {string} accessToken repository access_token for this app
	 */
    accessToken: string
	/**
	 * @param {string} refreshToken repository refresh_token for this app
	 */
    refreshToken: string
    default: boolean
}

export interface Server {
	ip: string
	user: string
	path: string
	authMechanism?: AuthMechanism
	password?: string
	sshPrivateKey?: string
}

export interface CredentialsInterface extends Document {
	/**
	 * @param {string} appId The id of the app that owns this credential
	 */
	appId: string
	/**
	 * @param {string} account The id of the company account that owns the app
	 */
	account: string
	/**
	 * @param {Server} server server to deploy this app
	 */
	server?: Server
	/**
	 * @param {Repository} repository repository to store this app
	 */
	repository: Repository[]
	commands?: {
		build?: string
		run?: string
	}
	/**
	 * @param {Date} createdAt The date this document was created
	 */
	createdAt?: Date
	/**
	 * @param {Date} createdAt The last time this document was updated
	 */
	updatedAt?: Date
}

const __serverSchema = new Schema({
	ip: {
		type: Schema.Types.String
	},
	user: {
		type: Schema.Types.String
	},
	sshPrivateKey: {
		type: Schema.Types.String
	},
	path: {
		type: String
	}
})

const __repoSchema = new Schema({
	url: {
		type: Schema.Types.String
    },
    project: {
        type: String
    },
	provider: {
		type: Schema.Types.String,
		enum: Object.values(Providers)
	},
	accessToken: {
		type: Schema.Types.String
    },
	refreshToken: {
		type: Schema.Types.String
    },
    default: {
		type: Schema.Types.Boolean
	}
})

const __commands = new Schema({
	build: {
		type: Schema.Types.String
	},
	run: {
		type: Schema.Types.String
	}
})

/**
 * Mogoose schema of a Person
 * @category Models
 */
const CredentialSchema = new Schema(
	{
		appId: {
			type: Schema.Types.ObjectId,
			required: true
		},
		account: {
			type: Schema.Types.ObjectId,
			required: true
		},
		repository: {
			type: [__repoSchema],
			required: true
		},
		server: {
			type: __serverSchema,
			required: true
		},
		commands: {
			type: __commands
		}
	},
	{
		collection: 'credentials',
		timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'}
	}
)

CredentialSchema.pre<CredentialsInterface>('validate', function (next): void {
	// eslint-disable-next-line no-invalid-this
	next()
})

/**
 * Factory to generate Person Model
 * @param {Connection} conn
 * @return {Model<CredentialsInterface>}
 * @category Models
 */
export default function factory(conn: Connection): Model<CredentialsInterface> {
	return conn.model<CredentialsInterface>('Credentials', CredentialSchema)
}
