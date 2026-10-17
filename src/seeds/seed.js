import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../configs/db.js';

async function seedData() {
  try {
    console.log(' Đang bắt đầu seed dữ liệu mẫu...');

    // 1. Mã hóa mật khẩu chung cho dữ liệu mẫu (ví dụ: "123456")
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('123456', saltRounds);

    // 2. Định nghĩa dữ liệu Admin và Member
    const adminId = uuidv4();
    const mentorId = uuidv4();
    const memberId = uuidv4();

    // 3. Chèn Users
    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES 
        ($1, 'admin1@sgroup.com', $4, 'S-Group Admin', 'ADMIN'),
        ($2, 'mentor1@sgroup.com', $4, 'Nguyen Van Mentor', 'MEMBER'),
        ($3, 'member1@sgroup.com', $4, 'Tran Van Học Viên', 'MEMBER')
       ON CONFLICT (email) DO NOTHING`,
      [adminId, mentorId, memberId, passwordHash]
    );

    console.log('✅ Seed Users thành công!');
    console.log('   - Admin: admin1@sgroup.com');
    console.log('   - Mentor: mentor1@sgroup.com');
    console.log('   - Member: member1@sgroup.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Thất bại khi seed dữ liệu:', error);
    process.exit(1);
  }
}

seedData();