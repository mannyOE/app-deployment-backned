import {createQueue} from 'kue'
import App from '../configs/app'
export const queue = createQueue(
	process.env.NODE_ENV === 'development'
		? App.redisConnectionDev
		: App.redisConnection
)
