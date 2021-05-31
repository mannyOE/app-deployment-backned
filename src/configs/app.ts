/**
 * General app configuration
 * @category Configurations
 */
class App {
	/**
	 * Name of the app
	 * @param {string} appName
	 */
	public static appName = 'App Configuration and Deployment'

	/**
	 * The port to run the application
	 * @param {number} port
	 */
	public static port = parseInt(process.env.PORT || '3200')

	/**
	 * The environment of the current running context
	 * @param {string} env
	 */
	public static env = process.env.NODE_ENV || 'development'

	/**
	 * Maximum size of the client upload
	 * @param {string} clientBodyLimit
	 */
	static clientBodyLimit = '50mb'

	static redisConnection = {
		prefix: 'q',
		redis: {
			port: 6379,
			no_ready_check: true,
			host:
				process.env.NODE_ENV !== 'development' ? 'zeedas_redis' : '127.0.0.1',
			auth: process.env.REDIS_PASS,
			db: 3, // if provided select a non-default redis db
			options: {
				// see https://github.com/mranney/node_redis#rediscreateclient
			}
		}
	}

	static redisConnectionDev = {
		prefix: 'q',
		redis: {
			port: 6379,
			no_ready_check: true,
			host:
				process.env.NODE_ENV !== 'development' ? 'zeedas_redis' : '127.0.0.1',
			db: 3, // if provided select a non-default redis db
			options: {
				// see https://github.com/mranney/node_redis#rediscreateclient
			}
		}
	}
}

export default App
