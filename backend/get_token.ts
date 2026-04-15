import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: '031a1e76-1921-442e-ba7d-955ee2e87b18', role: 'MASTER' }, 'nailbook_pro_super_secret_jwt_key_2026', { expiresIn: '1h' });
console.log(token);
