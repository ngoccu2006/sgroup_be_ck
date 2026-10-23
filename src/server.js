import 'dotenv/config';
import app from './app.js';
import http from "http";
import { initSocket } from './configs/socket.config.js';

const PORT = process.env.PORT || 3107;

// 1. Tạo HTTP Server bọc ứng dụng Express
const server = http.createServer(app);

// 2. Khởi tạo Socket.io truyền instance server vào
initSocket(server);

// app->server
server.listen(PORT, ()=>{
  console.log( `Server running at http://localhost:${PORT}`);
})