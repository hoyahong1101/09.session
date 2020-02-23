const mysql = require('mysql2/promise');
const connect = mysql.createPool({
	host: "localhost",
	port: 3307,
	user: "node",
	password: process.env.dbpass,
	database: 'node',
	connectionLimit: 10,
	waitForConnections: true
});
const pool = mysql.createPool({
	host: "localhost",
	port: 3307,
	user: "node",
	password: process.env.dbpass,
	database: 'node',
	connectionLimit: 10,
	waitForConnections: true
});

const sqlErr = (err) => {
	console.error(err);
}
module.exports = {
	connect, sqlErr, pool
}