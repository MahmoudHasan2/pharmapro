const bcrypt = require('bcryptjs');
const { owners } = require('../db');
const generateToken = require('../utils/generateToken');

const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 15 * 60 * 1000;

async function login(req, res) {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });

  const owner = owners.findOne((d) => d.username === String(username).trim().toLowerCase());
  if (!owner) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

  const isLocked = owner.lockUntil && new Date(owner.lockUntil).getTime() > Date.now();
  if (isLocked) {
    const minsLeft = Math.ceil((new Date(owner.lockUntil).getTime() - Date.now()) / 60000);
    return res.status(423).json({ message: `الحساب مقفل مؤقتاً. حاول بعد ${minsLeft} دقيقة` });
  }
  if (!owner.isActive) return res.status(403).json({ message: 'هذا الحساب معطل' });

  const match = await bcrypt.compare(password, owner.passwordHash);
  if (!match) {
    const attempts = (owner.failedLoginAttempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      owners.updateById(owner._id, { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_TIME_MS).toISOString() });
    } else {
      owners.updateById(owner._id, { failedLoginAttempts: attempts });
    }
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  owners.updateById(owner._id, { failedLoginAttempts: 0, lockUntil: null });
  const token = generateToken(owner._id, !!rememberMe);
  res.json({
    token,
    user: { id: owner._id, username: owner.username, name: owner.name, pharmacyName: owner.pharmacyName, role: 'owner' },
  });
}

async function getMe(req, res) {
  const owner = owners.findById(req.user.id);
  if (!owner) return res.status(404).json({ message: 'غير موجود' });
  const { passwordHash, ...safe } = owner;
  res.json({ ...safe, role: 'owner' });
}

// PUT /api/auth/password  { currentPassword, newPassword }
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبتين' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });

  const owner = owners.findById(req.user.id);
  const match = await bcrypt.compare(currentPassword, owner.passwordHash);
  if (!match) return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  owners.updateById(owner._id, { passwordHash });
  res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
}

module.exports = { login, getMe, changePassword };
