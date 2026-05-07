const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read supabase credentials from lib/supabase.js via regex
const supabaseFile = fs.readFileSync('src/lib/supabase.js', 'utf8');
const urlMatch = supabaseFile.match(/const supabaseUrl = '([^']+)';/);
const keyMatch = supabaseFile.match(/const supabaseAnonKey = '([^']+)';/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

// Player Category Logic
function computePerformanceScore(role, stats) {
  const m   = parseFloat(stats.matches)    || 0;
  const r   = parseFloat(stats.runs)       || 0;
  const sr  = parseFloat(stats.strikeRate) || 0;
  const w   = parseFloat(stats.wickets)    || 0;
  const eco = parseFloat(stats.economy)    || 0;
  const ct  = parseFloat(stats.catches)    || 0;
  const st  = parseFloat(stats.stumps)     || 0;

  switch (role) {
    case 'Batsman':
      return (0.4 * (r / 100)) + (0.3 * sr) + (0.3 * m);
    case 'Bowler':
      return (0.5 * w) + (0.3 * m) - (0.2 * eco * 10);
    case 'All-Rounder':
      return (0.25 * (r / 100)) + (0.25 * sr) + (0.25 * w) + (0.15 * m) - (0.1 * eco * 10);
    case 'Wicketkeeper Batsman':
      return (0.30 * (r / 100)) + (0.25 * sr) + (0.15 * m) + (0.15 * ct) + (0.15 * st);
    default:
      return 0;
  }
}

function classifyCategory(score) {
  if (score >= 100) return 'A';
  if (score >= 60)  return 'B';
  return 'C';
}

function computePredictedPrice(score, category) {
  const CATEGORY_BASE_PRICE = { A: 25000000, B: 12000000, C: 8000000 };
  const base  = CATEGORY_BASE_PRICE[category] || 8000000;
  const bonus = Math.floor(score * 150000);
  return base + bonus;
}

async function run() {
  const rawData = fs.readFileSync('temp_players.json', 'utf8');
  const playersData = JSON.parse(rawData);

  const rowsToInsert = [];

  for (let p of playersData) {
    let rawRole = p['Role'] || '';
    let role = 'Batsman';
    if (rawRole.toLowerCase().includes('all-rounder') || rawRole.toLowerCase().includes('all rounder')) role = 'All-Rounder';
    if (rawRole.toLowerCase().includes('bowl')) role = 'Bowler';
    if (rawRole.toLowerCase().includes('wicket')) role = 'Wicketkeeper Batsman';

    const matches = parseInt(p['Matches']) || 0;
    const runs = parseInt(p['Runs']) || 0;
    const strikeRate = parseFloat(p['Strike Rate']) || 0.0;
    const wickets = parseInt(p['Wickets']) || 0;
    const economy = parseFloat(p['Economy Rate']) || parseFloat(p['Economy']) || 0.0;
    const catches = parseInt(p['Catches']) || 0;
    const stumps = parseInt(p['Stumping']) || parseInt(p['Stumpings']) || 0;

    const stats = { matches, runs, strikeRate, wickets, economy, catches, stumps };
    const score = computePerformanceScore(role, stats);
    const category = classifyCategory(score);
    const price = computePredictedPrice(score, category);

    rowsToInsert.push({
      name: p['Player Name'],
      role,
      matches,
      runs,
      strike_rate: strikeRate,
      wickets,
      economy,
      catches,
      stumps,
      category,
      price
    });
  }

  console.log(`Prepared ${rowsToInsert.length} players for insertion. Preview of first:`, rowsToInsert[0]);

  const { data, error } = await supabase.from('players').insert(rowsToInsert);
  
  if (error) {
    console.error('Error inserting players:', error);
  } else {
    console.log('Successfully inserted all players into the database!');
  }
}

run();
