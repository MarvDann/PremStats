import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
})

async function checkSchema() {
  const client = await pool.connect()
  
  try {
    // Check matches table schema
    console.log('🔍 MATCHES TABLE SCHEMA:')
    const matchesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      ORDER BY ordinal_position
    `)
    
    for (const col of matchesSchema.rows) {
      console.log(`   • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    }
    
    console.log('')
    console.log('🏷️ CURRENT TEAMS IN DATABASE:')
    const teams = await client.query('SELECT name FROM teams ORDER BY name')
    
    for (const team of teams.rows) {
      console.log(`   • ${team.name}`)
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

checkSchema()