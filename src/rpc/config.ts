export const notification = {
	port: 40003,
	host:
		process.env.NODE_ENV === 'development'
			? 'api.staging.zeedas.com'
			: 'api.prod.zeedas'
}

export const users = {
	port: 40002,
	host:
		process.env.NODE_ENV === 'development'
			? 'api.staging.zeedas.com'
			: 'api.prod.zeedas'
}
export const deployment = {
	port: 40004,
	host: process.env.NODE_ENV === 'development' ? '0.0.0.0' : '0.0.0.0'
}

export const billing = {
	port: 40001,
	host:
		process.env.NODE_ENV === 'development'
			? 'api.staging.zeedas.com'
			: 'api.prod.zeedas'
}
