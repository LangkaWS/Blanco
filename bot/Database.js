const mysql = require('mysql');

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

exports.getConnection = () => {
    
    con.connect((err) => {
        if(err) {
            throw err;
        }
        console.log('Connected to database !');

    });
}
