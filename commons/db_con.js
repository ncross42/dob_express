var mysql = require('promise-mysql');
const config = require('../commons/secrets').db_info.local;
 
module.exports = mysql.createPool({
  connectionLimit : 10,
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database
});

