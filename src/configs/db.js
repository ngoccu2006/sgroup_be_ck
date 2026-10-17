import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})

pool.query('SELECT NOW()', (err, res)=>{
  if(err){
    console.error('Ket noi PosgreSQL that bai: ', err.stack );
  }
  else{
    console.log('Ket noi PostgreSQL thanh cong luc', res.rows[0].now);
  }
})

export default pool;