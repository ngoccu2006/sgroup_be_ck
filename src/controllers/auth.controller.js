import authService from '../services/auth.service.js';

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Gọi sang service xử lý login
    const result = await authService.login(email, password);

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      data: result
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

const authController = {
  login
};

export default authController;
