import { Pool } from 'pg'

const pool = new Pool({
	host: 'localhost',
	user: 'rodrigo',
	password: 'calabresa',
	database: 'LivePoll',
	port: 5432,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
})

// const pool = new Pool({
// 	connectionString: process.env.POSTGRES_URL,
// })

export default pool
