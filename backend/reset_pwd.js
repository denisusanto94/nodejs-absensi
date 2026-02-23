const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
    try {
        const newPassword = '12345678';
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        require('fs').writeFileSync('new_hash.txt', hashedPassword);
        console.log('New Hash saved to new_hash.txt');

        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@company.com']
        );

        if (result.affectedRows > 0) {
            console.log('Password updated successfully for admin@company.com');
        } else {
            console.log('Admin user not found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error updating password:', err);
        process.exit(1);
    }
}

updateAdminPassword();
