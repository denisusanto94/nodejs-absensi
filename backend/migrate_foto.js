require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateFoto() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absensi',
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        // Check if columns already exist before adding
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendances'
        `, [process.env.DB_NAME || 'absensi']);

        const existingColumns = columns.map(c => c.COLUMN_NAME);

        // Add check_in_foto column
        if (!existingColumns.includes('check_in_foto')) {
            await connection.query(`
                ALTER TABLE attendances 
                ADD COLUMN check_in_foto VARCHAR(255) DEFAULT NULL 
                AFTER check_in_long
            `);
            console.log('✅ Added column: check_in_foto');
        } else {
            console.log('⏭️  Column check_in_foto already exists, skipping.');
        }

        // Add check_out_foto column
        if (!existingColumns.includes('check_out_foto')) {
            await connection.query(`
                ALTER TABLE attendances 
                ADD COLUMN check_out_foto VARCHAR(255) DEFAULT NULL 
                AFTER check_out_long
            `);
            console.log('✅ Added column: check_out_foto');
        } else {
            console.log('⏭️  Column check_out_foto already exists, skipping.');
        }

        console.log('\n✅ Migration completed: attendance foto columns ready.');

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrateFoto();
