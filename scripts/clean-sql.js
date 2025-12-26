
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function clearData() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Starting SQL-based cleanup...');

        // Order matters for FK constraints unless we use CASCADE
        // Using TRUNCATE with CASCADE is the cleanest way
        // But we need to keep User table.

        // Deleting in order:
        await client.query('BEGIN');

        // 1. Payment (FK to Student, Event)
        await client.query('DELETE FROM "Payment"');
        console.log('✅ Deleted Payments');

        // 2. PrintDistribution (FK to Student, Event)
        await client.query('DELETE FROM "PrintDistribution"');
        console.log('✅ Deleted PrintDistributions');

        // 3. QrCode (Independent)
        await client.query('DELETE FROM "QrCode"');
        console.log('✅ Deleted QrCodes');

        // 4. Student (FK to nothing that remains)
        await client.query('DELETE FROM "Student"');
        console.log('✅ Deleted Students');

        // 5. Event (FK to nothing that remains)
        await client.query('DELETE FROM "Event"');
        console.log('✅ Deleted Events');

        await client.query('COMMIT');
        console.log('✨ Data cleared successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

clearData();
