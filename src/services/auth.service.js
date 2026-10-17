import authRepository from '../repositories/auth.repository.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

async function login(email, password) {
  // 1. Kiểm tra xem email có tồn tại trong hệ thống không
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác!');
  }

  // 2. So sánh mật khẩu thô client gửi lên với mật khẩu đã băm trong DB
  // dung cai co trong bcrypt laf compare(pass minh tu nhap, user.pass)
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không chính xác!');
  }

  // 3. Tạo JWT Token (chứa id và role của user, hết hạn trong 1 ngày)
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // 4. Trả về thông tin cần thiết (ẩn password_hash đi cho an toàn)
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  };
}

const authService = {
  login
};

export default authService;
