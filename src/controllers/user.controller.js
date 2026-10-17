import userService from '../services/user.service.js';

async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ data: users });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

async function createUser(req, res, next) {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({
      message: 'Tạo user thành công!',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updatedUser = await userService.updateUser(id, req.body);
    res.status(200).json({
      message: 'Cập nhật user thành công!',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(200).json({ message: 'Xóa user thành công!' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

const userController = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

export default userController;
