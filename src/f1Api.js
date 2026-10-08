const API_BASE = 'https://api.jolpi.ca/ergast/f1/current';

const teamColors = {
  alpine: '#ff87bc',
  aston_martin: '#229971',
  audi: '#bb0a1e',
  cadillac: '#d0d0d0',
  ferrari: '#e8002d',
  haas: '#b6babd',
  mclaren: '#ff8000',
  mercedes: '#27f4d2',
  racing_bulls: '#6692ff',
  red_bull: '#3671c6',
  williams: '#64c4ff',
};

async function fetchJson(path) {
  const endpoint = path ? `${API_BASE}/${path}` : API_BASE;
  const response = await fetch(`${endpoint}.json?limit=100`);
  if (!response.ok) {
    throw new Error(`F1 data request failed (${response.status})`);
  }
  return response.json();
}

function getFirstStandingsList(table) {
  return table?.StandingsLists?.[0];
}

export async function fetchSeasonData() {
  const [scheduleResponse, driversResponse, constructorsResponse] = await Promise.all([
    fetchJson(''),
    fetchJson('driverStandings'),
    fetchJson('constructorStandings'),
  ]);
  const schedule = scheduleResponse.MRData?.RaceTable;
  const driverStandings = getFirstStandingsList(driversResponse.MRData?.StandingsTable);
  const constructorStandings = getFirstStandingsList(constructorsResponse.MRData?.StandingsTable);

  if (!schedule || !Array.isArray(schedule.Races) || !driverStandings || !constructorStandings) {
    throw new Error('The F1 data service returned an incomplete season response.');
  }

  return {
    season: schedule.season,
    races: schedule.Races.map((race) => ({
      round: race.round,
      name: race.raceName,
      date: race.date,
      time: race.time,
      circuit: race.Circuit.circuitName,
      locality: race.Circuit.Location.locality,
      country: race.Circuit.Location.country,
      sessions: Object.entries(race)
        .filter(([, session]) => session && typeof session === 'object' && typeof session.date === 'string')
        .map(([name, session]) => ({
          name: name.replace(/([a-z])([A-Z])/g, '$1 $2'),
          date: session.date,
          time: session.time,
        }))
        .sort((first, second) => `${first.date}T${first.time ?? ''}`.localeCompare(`${second.date}T${second.time ?? ''}`)),
      sessionDates: [
        race.date,
        ...Object.entries(race)
          .filter(([key]) => key !== 'date' && key !== 'time' && key !== 'season' && key !== 'round' && key !== 'url' && key !== 'raceName' && key !== 'Circuit')
          .map(([, session]) => session?.date)
          .filter(Boolean),
      ],
    })),
    drivers: (driverStandings.DriverStandings ?? []).map((standing) => {
      const constructor = standing.Constructors?.[0];
      return {
        pos: standing.position,
        name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
        team: constructor?.name ?? '—',
        points: standing.points,
        color: teamColors[constructor?.constructorId] ?? '#747675',
      };
    }),
    constructors: (constructorStandings.ConstructorStandings ?? []).map((standing) => ({
      pos: standing.position,
      name: standing.Constructor.name,
      team: 'Constructor',
      points: standing.points,
      color: teamColors[standing.Constructor.constructorId] ?? '#747675',
    })),
    standingsRound: driverStandings.round,
  };
}
