import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgres://premstats:premstats@localhost:5432/premstats'
});

async function checkEvents() {
  const result = await pool.query(`
    SELECT match_id, COUNT(*) as event_count 
    FROM match_events 
    GROUP BY match_id 
    ORDER BY event_count DESC 
    LIMIT 5
  `);
  console.log('Matches with events:', result.rows);
  await pool.end();
}
checkEvents();
