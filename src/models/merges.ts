import {Connection, Model, Schema, Document} from 'mongoose'

/**
 * Attributes of a merge request
 * @category Models
 */
export interface MergeInterface extends Document {
	/**
	 * @param {string} module The id of the module
	 */
	module: string
	/**
	 * @param {string} app The id of the app
	 */
	app: string
	/**
	 * @param {string} mergeRequest The id of the merge request
	 */
    mergeRequest: string
    changes: any[]

	/**
	 * @param {Date} createdAt
	 */
	createdAt?: Date
	/**
	 * @param {Date} createdAt
	 */
	updatedAt?: Date
}

/**
 * Mogoose schema of a Person
 * @category Models
 */
const MergeSchema = new Schema(
	{
		app: {
			type: Schema.Types.String,
			required: true
		},
		module: {
			type: Schema.Types.String,
			required: true
		},
		mergeRequest: {
			type: Schema.Types.String,
			required: true
        },
        changes: [
            {
                name: String,
                versions: [
                    {
                        download_url: String,
                        path: String,
                        diff: String,
                        created_at: Date
                    }
                ]
            }
        ]
	},
	{
		collection: 'merges',
		timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'}
	}
)

/**
 * Factory to generate Person Model
 * @param {Connection} conn
 * @return {Model<MergeInterface>}
 * @category Models
 */
export default function factory(conn: Connection): Model<MergeInterface> {
	return conn.model<MergeInterface>('Merges', MergeSchema)
}