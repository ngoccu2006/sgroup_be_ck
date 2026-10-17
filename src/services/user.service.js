import userRepository from '../repositories/user.repository.js';
import bcrypt from 'bcrypt';

async function getAllUsers() {
  return await userRepository.findAll();
}

async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User không tồn tại');
  }
  return user;
}

async function createUser(userData) {
  const { password } = userData;
  if (!password) {
    throw new Error('Mật khẩu là bắt buộc!');
  }

  // Băm mật khẩu thô
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // Tạo object mới, loại bỏ password thô, thêm password_hash vào
  const newUserData = {
    id: userData.id,
    email: userData.email,
    full_name: userData.full_name,
    role: userData.role,
    password_hash: hashed // Khớp với Database cột password_hash
  };

  return await userRepository.create(newUserData);
}

async function updateUser(id, userData) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User không tồn tại để cập nhật');
  }

  let newUserData = { ...userData };

  // Nếu người dùng có cập nhật mật khẩu mới
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    newUserData.password_hash = await bcrypt.hash(userData.password, salt);
    delete newUserData.password; // Xóa key password cũ đi
  }

  return await userRepository.update(id, newUserData);
}

async function deleteUser(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('User không tồn tại để xóa');
  }
  return await userRepository.remove(id);
}

const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

export default userService;
