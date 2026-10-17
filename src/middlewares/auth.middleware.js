import jwt from 'jsonwebtoken';

// xac thuc nguoi dung da dang nhap hay ch

async function authenticate(req, res, next) {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này!' });
    }

    const token = authHeader.split(' ')[1];

    // giai ma token 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán thông tin user giải mã được vào đối tượng req để các hàm phía sau sử dụng
    req.user = decoded; 

    next();
  } catch(error){
    return res.status(401).json({message: 'Token khong hop le hoac da het han'})
  }
}

// phan quyen (chi cho phep admin di qua)

function authorizeAdmin(req, res, next){
  if(!req.user || req.user.role !== 'ADMIN'){
    return res.status(403).json({ message: 'Ban khong co quyen thuc hien hanh dong nay'})
  }

  next();
}

// phan quyen (chi cho phep admin hoac mentor di qua)
function authorizeMentorOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "MENTOR")) {
    return res.status(403).json({ message: "Chỉ Admin hoặc Mentor mới có quyền thực hiện thao tác này!" });
  }
  next();
}

// Phân quyền linh hoạt (Dynamic Roles Check)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này!" });
    }
    next();
  };
}

const authMiddleware = {
  authenticate,
  authorizeAdmin,
  authorizeMentorOrAdmin,
  authorizeRoles
}

export default authMiddleware;