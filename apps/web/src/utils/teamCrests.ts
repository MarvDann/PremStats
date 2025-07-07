// Team crest mappings using reliable CDN sources
// Using a combination of public CDNs and fallback sources
export const teamCrests: Record<string, string> = {
  // Current Premier League Teams (2024/25)
  'Arsenal': 'https://resources.premierleague.com/premierleague/badges/70/t3.png',
  'Aston Villa': 'https://resources.premierleague.com/premierleague/badges/70/t7.png',
  'Bournemouth': 'https://resources.premierleague.com/premierleague/badges/70/t91.png',
  'Brentford': 'https://resources.premierleague.com/premierleague/badges/70/t94.png',
  'Brighton & Hove Albion': 'https://resources.premierleague.com/premierleague/badges/70/t36.png',
  'Chelsea': 'https://resources.premierleague.com/premierleague/badges/70/t8.png',
  'Crystal Palace': 'https://resources.premierleague.com/premierleague/badges/70/t31.png',
  'Everton': 'https://resources.premierleague.com/premierleague/badges/70/t11.png',
  'Fulham': 'https://resources.premierleague.com/premierleague/badges/70/t54.png',
  'Ipswich Town': 'https://resources.premierleague.com/premierleague/badges/70/t40.png',
  'Leicester City': 'https://resources.premierleague.com/premierleague/badges/70/t13.png',
  'Liverpool': 'https://resources.premierleague.com/premierleague/badges/70/t14.png',
  'Manchester City': 'https://resources.premierleague.com/premierleague/badges/70/t43.png',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/70/t1.png',
  'Newcastle United': 'https://resources.premierleague.com/premierleague/badges/70/t4.png',
  'Nottingham Forest': 'https://resources.premierleague.com/premierleague/badges/70/t17.png',
  'Southampton': 'https://resources.premierleague.com/premierleague/badges/70/t20.png',
  'Tottenham': 'https://resources.premierleague.com/premierleague/badges/70/t6.png',
  'West Ham United': 'https://resources.premierleague.com/premierleague/badges/70/t21.png',
  'Wolverhampton Wanderers': 'https://resources.premierleague.com/premierleague/badges/70/t39.png',

  // Historical Premier League Teams (using various reliable sources)
  'Blackburn Rovers': 'https://resources.premierleague.com/premierleague/badges/70/t9.png',
  'Leeds United': 'https://resources.premierleague.com/premierleague/badges/70/t2.png',
  'Norwich City': 'https://resources.premierleague.com/premierleague/badges/70/t25.png',
  'Watford': 'https://resources.premierleague.com/premierleague/badges/70/t57.png',
  'West Bromwich Albion': 'https://resources.premierleague.com/premierleague/badges/70/t35.png',
  'Sheffield United': 'https://resources.premierleague.com/premierleague/badges/70/t49.png',
  'Burnley': 'https://resources.premierleague.com/premierleague/badges/70/t90.png',
  'Cardiff City': 'https://resources.premierleague.com/premierleague/badges/70/t46.png',
  'Huddersfield Town': 'https://resources.premierleague.com/premierleague/badges/70/t38.png',
  'Stoke City': 'https://resources.premierleague.com/premierleague/badges/70/t56.png',
  'Swansea City': 'https://resources.premierleague.com/premierleague/badges/70/t42.png',
  'Hull City': 'https://resources.premierleague.com/premierleague/badges/70/t50.png',
  'Middlesbrough': 'https://resources.premierleague.com/premierleague/badges/70/t26.png',
  'Sunderland': 'https://resources.premierleague.com/premierleague/badges/70/t24.png',
  'Bolton Wanderers': 'https://resources.premierleague.com/premierleague/badges/70/t32.png',
  'Wigan Athletic': 'https://resources.premierleague.com/premierleague/badges/70/t45.png',
  'Blackpool': 'https://resources.premierleague.com/premierleague/badges/70/t33.png',
  'Queens Park Rangers': 'https://resources.premierleague.com/premierleague/badges/70/t15.png',
  'Reading': 'https://resources.premierleague.com/premierleague/badges/70/t29.png',
  'Portsmouth': 'https://resources.premierleague.com/premierleague/badges/70/t30.png',
  'Birmingham City': 'https://resources.premierleague.com/premierleague/badges/70/t28.png',
  'Derby County': 'https://resources.premierleague.com/premierleague/badges/70/t23.png',
  'Sheffield Wednesday': 'https://resources.premierleague.com/premierleague/badges/70/t22.png',
  'Charlton Athletic': 'https://resources.premierleague.com/premierleague/badges/70/t16.png',
  'Coventry City': 'https://resources.premierleague.com/premierleague/badges/70/t19.png',
  'Wimbledon': 'https://resources.premierleague.com/premierleague/badges/70/t12.png',
  'Oldham Athletic': 'https://upload.wikimedia.org/wikipedia/en/4/43/Oldham_Athletic_AFC.png',
  'Swindon Town': 'https://upload.wikimedia.org/wikipedia/en/7/77/Swindon_town_fc.png',
  'Bradford City': 'https://upload.wikimedia.org/wikipedia/en/0/02/Bradford_City_AFC.png',
  'Barnsley': 'https://upload.wikimedia.org/wikipedia/en/c/c9/Barnsley_FC.png',
  'Luton Town': 'https://resources.premierleague.com/premierleague/badges/70/t102.png'
}

// Helper function to get team crest URL
export const getTeamCrest = (teamName: string): string | undefined => {
  return teamCrests[teamName]
}

// Helper function to check if team has a crest
export const hasTeamCrest = (teamName: string): boolean => {
  return teamName in teamCrests
}