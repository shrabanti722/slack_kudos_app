import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let dbType = 'sqlite'; // 'sqlite' or 'postgres'
let pgPool = null;

// Initialize database - supports both SQLite and PostgreSQL
export async function initDatabase(dbPath = './kudos.db') {
  // Check if DATABASE_URL is set (PostgreSQL connection string)
  if (process.env.DATABASE_URL) {
    dbType = 'postgres';
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : false,
    });

    // Test connection
    try {
      await pgPool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL database');
    } catch (error) {
      console.error('❌ Error connecting to PostgreSQL:', error);
      throw error;
    }

    // Create kudos table for PostgreSQL
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS kudos (
        id SERIAL PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        from_user_name TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        to_user_name TEXT NOT NULL,
        message TEXT NOT NULL,
        channel_id TEXT,
        channel_name TEXT,
        sent_dm BOOLEAN DEFAULT FALSE,
        sent_channel BOOLEAN DEFAULT FALSE,
        visibility TEXT DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add visibility column if it doesn't exist (for existing databases)
    await pgPool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='kudos' AND column_name='visibility'
        ) THEN
          ALTER TABLE kudos ADD COLUMN visibility TEXT DEFAULT 'public';
        END IF;
      END $$;
    `);

    // Create manager_relationships table for PostgreSQL
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS manager_relationships (
        user_id TEXT PRIMARY KEY,
        manager_id TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for PostgreSQL
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_to_user ON kudos(to_user_id);
      CREATE INDEX IF NOT EXISTS idx_from_user ON kudos(from_user_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON kudos(created_at);
      CREATE INDEX IF NOT EXISTS idx_visibility ON kudos(visibility);
      CREATE INDEX IF NOT EXISTS idx_visibility_created ON kudos(visibility, created_at);
      CREATE INDEX IF NOT EXISTS idx_manager_user ON manager_relationships(user_id);
      CREATE INDEX IF NOT EXISTS idx_manager_manager ON manager_relationships(manager_id);
    `);

    return pgPool;
  } else {
    // Use SQLite for local development
    dbType = 'sqlite';
    if (db) {
      return db;
    }

    const fullPath = dbPath.startsWith('/') ? dbPath : join(__dirname, dbPath);
    db = new Database(fullPath);

    // Create kudos table for SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS kudos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id TEXT NOT NULL,
        from_user_name TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        to_user_name TEXT NOT NULL,
        message TEXT NOT NULL,
        channel_id TEXT,
        channel_name TEXT,
        sent_dm BOOLEAN DEFAULT 0,
        sent_channel BOOLEAN DEFAULT 0,
        visibility TEXT DEFAULT 'public',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add visibility column if it doesn't exist (for existing databases)
    // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
    const tableInfo = db.prepare("PRAGMA table_info(kudos)").all();
    const hasVisibilityColumn = tableInfo.some(col => col.name === 'visibility');
    
    if (!hasVisibilityColumn) {
      db.exec(`ALTER TABLE kudos ADD COLUMN visibility TEXT DEFAULT 'public'`);
      // Update existing rows to have 'public' visibility
      db.exec(`UPDATE kudos SET visibility = 'public' WHERE visibility IS NULL`);
    }

    // Create manager_relationships table for SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS manager_relationships (
        user_id TEXT PRIMARY KEY,
        manager_id TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for SQLite
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_to_user ON kudos(to_user_id);
      CREATE INDEX IF NOT EXISTS idx_from_user ON kudos(from_user_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON kudos(created_at);
      CREATE INDEX IF NOT EXISTS idx_visibility ON kudos(visibility);
      CREATE INDEX IF NOT EXISTS idx_visibility_created ON kudos(visibility, created_at);
      CREATE INDEX IF NOT EXISTS idx_manager_user ON manager_relationships(user_id);
      CREATE INDEX IF NOT EXISTS idx_manager_manager ON manager_relationships(manager_id);
    `);

    console.log('✅ Connected to SQLite database');
    return db;
  }
}

export async function saveKudos(kudosData) {
  const visibility = kudosData.visibility || 'public';
  
  if (dbType === 'postgres') {
    const result = await pgPool.query(`
      INSERT INTO kudos (
        from_user_id, from_user_name, to_user_id, to_user_name,
        message, channel_id, channel_name, sent_dm, sent_channel, visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      kudosData.fromUserId,
      kudosData.fromUserName,
      kudosData.toUserId,
      kudosData.toUserName,
      kudosData.message,
      kudosData.channelId || null,
      kudosData.channelName || null,
      kudosData.sentDm || false,
      kudosData.sentChannel || false,
      visibility,
    ]);
    return { lastInsertRowid: result.rows[0].id };
  } else {
    const stmt = db.prepare(`
      INSERT INTO kudos (
        from_user_id, from_user_name, to_user_id, to_user_name,
        message, channel_id, channel_name, sent_dm, sent_channel, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      kudosData.fromUserId,
      kudosData.fromUserName,
      kudosData.toUserId,
      kudosData.toUserName,
      kudosData.message,
      kudosData.channelId || null,
      kudosData.channelName || null,
      kudosData.sentDm ? 1 : 0,
      kudosData.sentChannel ? 1 : 0,
      visibility
    );
  }
}

export async function getKudosByUser(userId, limit = 10, includePrivate = true) {
  // If includePrivate is false, only return public kudos
  // If true, return all kudos (for the user themselves or authorized viewers)
  if (dbType === 'postgres') {
    let query = `SELECT * FROM kudos WHERE to_user_id = $1`;
    const params = [userId];
    
    if (!includePrivate) {
      query += ` AND visibility = 'public'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pgPool.query(query, params);
    return result.rows;
  } else {
    let query = `SELECT * FROM kudos WHERE to_user_id = ?`;
    const params = [userId];
    
    if (!includePrivate) {
      query += ` AND visibility = 'public'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }
}

export async function getAllKudos(limit = 50, visibilityFilter = null) {
  if (dbType === 'postgres') {
    let query = `SELECT * FROM kudos`;
    const params = [];
    
    if (visibilityFilter === 'public') {
      query += ` WHERE visibility = 'public'`;
    } else if (visibilityFilter === 'private') {
      query += ` WHERE visibility = 'private'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pgPool.query(query, params);
    return result.rows;
  } else {
    let query = `SELECT * FROM kudos`;
    const params = [];
    
    if (visibilityFilter === 'public') {
      query += ` WHERE visibility = 'public'`;
    } else if (visibilityFilter === 'private') {
      query += ` WHERE visibility = 'private'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }
}

// Get only public kudos (for public feeds)
export async function getPublicKudos(limit = 50) {
  return getAllKudos(limit, 'public');
}

export async function getKudosSentByUser(userId, limit = 10) {
  if (dbType === 'postgres') {
    const result = await pgPool.query(`
      SELECT * FROM kudos 
      WHERE from_user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, limit]);
    return result.rows;
  } else {
    const stmt = db.prepare(`
      SELECT * FROM kudos 
      WHERE from_user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }
}

export async function getKudosStats() {
  if (dbType === 'postgres') {
    const totalResult = await pgPool.query('SELECT COUNT(*) as count FROM kudos');
    const usersResult = await pgPool.query(`
      SELECT COUNT(DISTINCT to_user_id) as count FROM kudos
    `);
    const sendersResult = await pgPool.query(`
      SELECT COUNT(DISTINCT from_user_id) as count FROM kudos
    `);
    const recentResult = await pgPool.query(`
      SELECT COUNT(*) as count FROM kudos 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    return {
      total: parseInt(totalResult.rows[0].count),
      uniqueRecipients: parseInt(usersResult.rows[0].count),
      uniqueSenders: parseInt(sendersResult.rows[0].count),
      last7Days: parseInt(recentResult.rows[0].count),
    };
  } else {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM kudos');
    const usersStmt = db.prepare('SELECT COUNT(DISTINCT to_user_id) as count FROM kudos');
    const sendersStmt = db.prepare('SELECT COUNT(DISTINCT from_user_id) as count FROM kudos');
    const recentStmt = db.prepare(`
      SELECT COUNT(*) as count FROM kudos 
      WHERE created_at >= datetime('now', '-7 days')
    `);
    
    return {
      total: totalStmt.get().count,
      uniqueRecipients: usersStmt.get().count,
      uniqueSenders: sendersStmt.get().count,
      last7Days: recentStmt.get().count,
    };
  }
}

export async function getLeaderboard(limit = 10) {
  if (dbType === 'postgres') {
    const result = await pgPool.query(`
      SELECT 
        to_user_id,
        to_user_name,
        COUNT(*) as kudos_count
      FROM kudos
      GROUP BY to_user_id, to_user_name
      ORDER BY kudos_count DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  } else {
    const stmt = db.prepare(`
      SELECT 
        to_user_id,
        to_user_name,
        COUNT(*) as kudos_count
      FROM kudos
      GROUP BY to_user_id, to_user_name
      ORDER BY kudos_count DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

// Manager relationship functions (for future use)
export async function setManagerRelationship(userId, managerId) {
  if (dbType === 'postgres') {
    await pgPool.query(`
      INSERT INTO manager_relationships (user_id, manager_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET manager_id = $2, updated_at = CURRENT_TIMESTAMP
    `, [userId, managerId]);
  } else {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO manager_relationships (user_id, manager_id, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(userId, managerId);
  }
}

export async function getManager(userId) {
  if (dbType === 'postgres') {
    const result = await pgPool.query(`
      SELECT manager_id FROM manager_relationships WHERE user_id = $1
    `, [userId]);
    return result.rows.length > 0 ? result.rows[0].manager_id : null;
  } else {
    const stmt = db.prepare(`
      SELECT manager_id FROM manager_relationships WHERE user_id = ?
    `);
    const row = stmt.get(userId);
    return row ? row.manager_id : null;
  }
}

export async function getDirectReports(managerId) {
  if (dbType === 'postgres') {
    const result = await pgPool.query(`
      SELECT user_id FROM manager_relationships WHERE manager_id = $1
    `, [managerId]);
    return result.rows.map(row => row.user_id);
  } else {
    const stmt = db.prepare(`
      SELECT user_id FROM manager_relationships WHERE manager_id = ?
    `);
    const rows = stmt.all(managerId);
    return rows.map(row => row.user_id);
  }
}

export async function closeDatabase() {
  if (dbType === 'postgres') {
    if (pgPool) {
      await pgPool.end();
      pgPool = null;
      console.log('✅ PostgreSQL connection closed');
    }
  } else {
    if (db) {
      db.close();
      db = null;
      console.log('✅ SQLite connection closed');
    }
  }
}

