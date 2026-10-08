import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { fetchSeasonData } from './f1Api.js';

const initialIntro = {
  videoUrl: 'https://www.youtube.com/watch?v=5HTA8zs2hSA',
  eyebrow: 'Lights out. Here we go.',
  title: 'THE RACE\nSTARTS HERE.',
  description: 'Your front row seat to everything Formula 1.',
};

let youtubeApiPromise;

function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return youtubeApiPromise;
}

const stories = [
  {
    category: 'THE PADDOCK',
    title: 'The details that make a perfect lap',
    read: '6 MIN READ',
    image: 'https://images.unsplash.com/photo-1532906619279-a4b7267faa66?auto=format&fit=crop&w=900&q=85',
    className: 'story-image--track',
  },
  {
    category: 'RACE CULTURE',
    title: 'A city that comes alive on race weekend',
    read: '4 MIN READ',
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
    className: 'story-image--car',
  },
];

function getYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2];
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

function Intro({ content, onSkip }) {
  const videoId = getYoutubeId(content.videoUrl);

  useEffect(() => {
    if (!videoId || !content.durationSeconds) return undefined;
    const timeout = window.setTimeout(onSkip, content.durationSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [videoId, content.durationSeconds, onSkip]);

  return (
    <section className="intro" aria-label="F1 intro">
      {videoId && (
        <iframe
          className="intro__video"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
          title="Muted Formula 1 intro video"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="origin"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <div className="intro__shade" />
      <button className="intro__continue" type="button" onClick={onSkip}>
        <span>CONTINUE</span>
        <span aria-hidden="true">→</span>
      </button>
      <div className="intro__content">
        <p className="eyebrow"><span className="eyebrow__dot" />{content.eyebrow}</p>
        <h1>{content.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
        <p className="intro__description">{content.description}</p>
      </div>
      <span className="intro__index">01 / 01</span>
    </section>
  );
}

function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Gridline home"><img className="wordmark__mark" src="/logo.svg" alt="" aria-hidden="true" />GRIDLINE<span className="wordmark__period">.</span></Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/calander">Calendar</NavLink>
        <NavLink to="/standings">Standings</NavLink>
        <a href="/#stories">The paddock</a>
      </nav>
      <Link className="header-cta" to="/calander">Explore the grid <span aria-hidden="true">↗</span></Link>
    </header>
  );
}

function RaceHero({ videoUrl }) {
  const playerHost = useRef(null);
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = getYoutubeId(videoUrl);

  useEffect(() => {
    if (!videoId) return undefined;

    let player;
    let isActive = true;
    loadYoutubeApi().then((youtube) => {
      if (!isActive || !playerHost.current) return;
      player = new youtube.Player(playerHost.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          enablejsapi: 1,
          loop: 1,
          modestbranding: 1,
          mute: 1,
          origin: window.location.origin,
          playsinline: 1,
          playlist: videoId,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (!isActive) return;
            playerRef.current = event.target;
            setIsPlayerReady(true);
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (isActive) setIsPlaying(event.data === youtube.PlayerState.PLAYING);
          },
          onAutoplayBlocked: () => {
            if (isActive) setIsPlaying(false);
          },
        },
      });
    }).catch(() => {});

    return () => {
      isActive = false;
      playerRef.current = null;
      player?.destroy();
    };
  }, [videoId]);

  return (
    <section className="race-hero" id="top">
      <div className="race-hero__image" />
      {videoId && (
        <div className="race-hero__video" aria-hidden="true">
          <div ref={playerHost} />
        </div>
      )}
      <div className="race-hero__veil" />
      <div className="race-hero__copy">
        <p className="eyebrow"><span className="eyebrow__dot" />THE HOME OF F1 FANS</p>
        <h1>EVERY LAP.<br /><span>EVERY STORY.</span></h1>
        <p className="race-hero__text">The noise, the nerve, the moments that make you fall in love with racing. It all lives here.</p>
        <Link className="button button--light" to="/calander">Find your race weekend <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="race-hero__caption"><span>01</span><span>BUILT FOR THE LOVE OF RACING</span></div>
      {videoId && !isPlaying && (
        <button
          className="race-hero__play"
          type="button"
          disabled={!isPlayerReady}
          onClick={() => playerRef.current?.playVideo()}
          aria-label="Play background video"
          title="Play background video"
        >
          <span aria-hidden="true">▶</span> PLAY VIDEO
        </button>
      )}
      <div className="race-hero__vertical">FORMULA ONE · FAN CULTURE · COMMUNITY</div>
    </section>
  );
}

function formatRaceDate(date) {
  const parts = new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .formatToParts(new Date(`${date}T12:00:00Z`));
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${day} ${month}`;
}

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getRaceSlug(race, season, races = []) {
  if (String(season) === '2026' && /bahrain.*malaysia/i.test(race.name)) {
    return 'bahrain-in-malaysia';
  }
  const hasDuplicateCountry = races.filter((entry) => entry.country === race.country).length > 1;
  const locationSlug = hasDuplicateCountry ? `${slugify(race.locality)}-` : '';
  return `${locationSlug}${slugify(race.country)}-gp`;
}

function getRacePath(race, season, races) {
  return `/races/${season}/${getRaceSlug(race, season, races)}`;
}

function formatSessionTime(time) {
  if (!time) return 'Time TBA';
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(`2000-01-01T${time}`));
}

function getNextRace(races) {
  const now = Date.now();
  return races.find((race) => new Date(`${race.date}T${race.time ?? '00:00:00Z'}`).getTime() >= now);
}

function RaceWeekend({ seasonData, dataError }) {
  const nextRace = seasonData ? getNextRace(seasonData.races) : null;
  const weekendDates = nextRace
    ? [...new Set(nextRace.sessionDates)].sort()
    : [];
  const firstDate = weekendDates[0] ?? nextRace?.date;
  const lastDate = weekendDates.at(-1) ?? nextRace?.date;
  const dateRange = firstDate && lastDate
    ? firstDate.slice(0, 7) === lastDate.slice(0, 7)
      ? `${firstDate.slice(8, 10)} — ${lastDate.slice(8, 10)} ${formatRaceDate(lastDate).split(' ')[1].toUpperCase()}`
      : `${formatRaceDate(firstDate).toUpperCase()} — ${formatRaceDate(lastDate).toUpperCase()}`
    : '';

  return (
    <section className="weekend section-wrap" id="weekend">
      <div className="section-heading">
        <div><p className="section-kicker">MARK YOUR CALENDAR</p><h2>Next up <span>on track</span></h2></div>
        <Link className="text-link" to="/calander">Full {seasonData?.season ?? 'F1'} calendar <span aria-hidden="true">↗</span></Link>
      </div>
      {nextRace ? (
        <Link className="weekend__row" to={getRacePath(nextRace, seasonData.season, seasonData.races)}>
          <div className="weekend__round"><span>ROUND</span><strong>{String(nextRace.round).padStart(2, '0')}</strong></div>
          <div className="weekend__name"><p>{nextRace.name.toUpperCase()}</p><h3>{nextRace.locality.toUpperCase()} <span>/</span> {nextRace.country.toUpperCase()}</h3><span className="weekend__venue">{nextRace.circuit}</span></div>
          <div className="weekend__date"><span>RACE WEEKEND</span><strong>{dateRange}</strong><span className="weekend__year">{seasonData.season} SEASON</span></div>
          <span className="weekend__arrow" aria-hidden="true">↗</span>
        </Link>
      ) : (
        <p className="data-message" role={dataError ? 'alert' : 'status'}>
          {dataError ? `Could not load the next race: ${dataError}` : seasonData ? 'No upcoming races are listed for this season.' : 'Loading the live race calendar…'}
        </p>
      )}
    </section>
  );
}

function Standings({ fullPage = false, seasonData, dataError }) {
  const [activeTab, setActiveTab] = useState('Drivers');
  const standings = activeTab === 'Drivers' ? seasonData?.drivers : seasonData?.constructors;
  const shownRows = fullPage ? standings : standings?.slice(0, 4);

  return (
    <section className={`standings section-wrap${fullPage ? ' standings--page' : ''}`} id="standings">
      <div className="section-heading">
        <div><p className="section-kicker">{seasonData ? `${seasonData.season} SEASON · ROUND ${seasonData.standingsRound}` : 'LIVE CHAMPIONSHIP'}</p><h2>{fullPage ? <>Championship <span>standings.</span></> : <>Made of <span>points.</span></>}</h2></div>
        <div className="tab-switch" role="tablist" aria-label="Championship standings">
          {['Drivers', 'Constructors'].map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
      </div>
      <div className="standings__table">
        <div className="standings__head"><span>POS</span><span>{activeTab === 'Drivers' ? 'DRIVER' : 'TEAM'}</span><span>POINTS</span></div>
        {shownRows?.map((row) => (
          <div className="standing-row" key={row.pos}>
            <span className="standing-row__pos">{row.pos}</span>
            <span className="standing-row__name"><i style={{ '--team-color': row.color }} />{row.name}<small>{row.team}</small></span>
            <strong>{row.points}<span> PTS</span></strong>
          </div>
        ))}
      </div>
      {!shownRows?.length && <p className="data-message" role={dataError ? 'alert' : 'status'}>{dataError ? `Could not load live standings: ${dataError}` : 'Loading live standings…'}</p>}
      <p className="standings__note">{seasonData ? `Official standings after round ${seasonData.standingsRound}.` : 'Standings are loading from the F1 data service.'}</p>
    </section>
  );
}

function CalendarPage({ seasonData, dataError }) {
  return (
    <section className="calendar-page section-wrap">
      <div className="section-heading">
        <div><p className="section-kicker">{seasonData ? `OFFICIAL ${seasonData.season} SEASON` : 'LIVE SEASON DATA'}</p><h1>Race <span>calendar.</span></h1></div>
        <span className="calendar-page__status">{seasonData ? `${seasonData.races.length} RACES` : 'LOADING'}</span>
      </div>
      {dataError && <p className="data-message" role="alert">Could not load the live race calendar: {dataError}</p>}
      <div className="calendar-table" aria-label={`${seasonData?.season ?? 'F1'} race calendar`}>
        <div className="calendar-table__head"><span>ROUND</span><span>GRAND PRIX</span><span>LOCATION</span><span>CIRCUIT</span><span>DATE</span></div>
        {seasonData?.races.map((race) => (
          <Link className="calendar-table__row" key={race.round} to={getRacePath(race, seasonData.season, seasonData.races)} aria-label={`View ${race.name}`}>
            <span className="calendar-table__round">{String(race.round).padStart(2, '0')}</span>
            <strong>{race.name}</strong>
            <span>{race.locality}, {race.country}</span>
            <span className="calendar-table__circuit">{race.circuit}</span>
            <span className="calendar-table__date">{formatRaceDate(race.date)}</span>
          </Link>
        ))}
      </div>
      {!seasonData && !dataError && <p className="data-message" role="status">Loading the official race calendar…</p>}
    </section>
  );
}

function RacePage({ seasonData, dataError }) {
  const { season, slug } = useParams();
  const race = seasonData && String(seasonData.season) === season
    ? seasonData.races.find((entry) => getRaceSlug(entry, season, seasonData.races) === slug)
    : null;

  if (!seasonData && !dataError) {
    return <section className="section-wrap race-detail"><p className="data-message" role="status">Loading race details…</p></section>;
  }
  if (dataError) {
    return <section className="section-wrap race-detail"><p className="data-message" role="alert">Could not load race details: {dataError}</p></section>;
  }
  if (!race) {
    return (
      <section className="section-wrap route-not-found">
        <p className="section-kicker">NOT ON THE GRID</p>
        <h1>Race <span>not found.</span></h1>
        <Link className="text-link" to="/calander">Back to calendar <span aria-hidden="true">↗</span></Link>
      </section>
    );
  }

  return (
    <section className="race-detail section-wrap">
      <Link className="text-link race-detail__back" to="/calander">← Race calendar</Link>
      <p className="section-kicker">{season} SEASON · ROUND {String(race.round).padStart(2, '0')}</p>
      <h1>{race.name}<span>.</span></h1>
      <p className="race-detail__location">{race.locality}, {race.country}</p>
      <div className="race-detail__facts">
        <div><span>RACE DATE</span><strong>{formatRaceDate(race.date)} {season}</strong></div>
        <div><span>CIRCUIT</span><strong>{race.circuit}</strong></div>
        <div><span>LOCATION</span><strong>{race.locality}, {race.country}</strong></div>
      </div>
      <div className="race-detail__sessions">
        <p className="section-kicker">WEEKEND SCHEDULE</p>
        <h2>Session <span>times.</span></h2>
        {race.sessions?.length ? (
          <div className="race-detail__session-list">
            {race.sessions.map((session) => (
              <div className="race-detail__session" key={session.name}>
                <strong>{session.name}</strong>
                <span>{formatRaceDate(session.date)}</span>
                <span>{formatSessionTime(session.time)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="data-message">Session times have not been published yet.</p>
        )}
      </div>
    </section>
  );
}

function Stories() {
  return (
    <section className="stories section-wrap" id="stories">
      <div className="section-heading">
        <div><p className="section-kicker">BEYOND THE CHEQUERED FLAG</p><h2>Inside the <span>paddock.</span></h2></div>
        <a className="text-link" href="#stories">All stories <span aria-hidden="true">↗</span></a>
      </div>
      <div className="story-grid">
        {stories.map((story, index) => (
          <article className="story" key={story.title}>
            <a className={`story__image ${story.className}`} href="#stories" aria-label={`Read ${story.title}`}>
              <img src={story.image} alt="" loading="lazy" />
              <span className="story__number">0{index + 1}</span>
              <span className="story__arrow" aria-hidden="true">↗</span>
            </a>
            <div className="story__meta"><span>{story.category}</span><span>{story.read}</span></div>
            <h3><a href="#stories">{story.title}</a></h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomePage({ intro, showIntro, seasonData, dataError }) {
  return (
    <>
      {!showIntro && <RaceHero videoUrl={intro.videoUrl} />}
      <RaceWeekend seasonData={seasonData} dataError={dataError} />
      <Standings seasonData={seasonData} dataError={dataError} />
      <Stories />
    </>
  );
}

function App() {
  const [intro, setIntro] = useState(initialIntro);
  const [showIntro, setShowIntro] = useState(true);
  const [seasonData, setSeasonData] = useState(null);
  const [dataError, setDataError] = useState('');
  const closeIntro = useCallback(() => setShowIntro(false), []);

  useEffect(() => {
    let isActive = true;
    fetchSeasonData()
      .then((data) => {
        if (isActive) setSeasonData(data);
      })
      .catch((error) => {
        if (isActive) setDataError(error.message);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    fetch('/intro.json')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load intro.json');
        return response.json();
      })
      .then((content) => {
        if (!isActive) return;
        setIntro({ ...initialIntro, ...content });
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage intro={intro} showIntro={showIntro} seasonData={seasonData} dataError={dataError} />} />
          <Route path="/standings" element={<Standings fullPage seasonData={seasonData} dataError={dataError} />} />
          <Route path="/calander" element={<CalendarPage seasonData={seasonData} dataError={dataError} />} />
          <Route path="/races/:season/:slug" element={<RacePage seasonData={seasonData} dataError={dataError} />} />
          <Route path="*" element={<section className="section-wrap route-not-found"><p className="section-kicker">NOT ON THE GRID</p><h1>Page <span>not found.</span></h1><Link className="text-link" to="/">Back to home <span aria-hidden="true">↗</span></Link></section>} />
        </Routes>
      </main>
      <footer className="site-footer"><Link className="wordmark" to="/" aria-label="Gridline home"><img className="wordmark__mark" src="/logo.svg" alt="" aria-hidden="true" />GRIDLINE<span className="wordmark__period">.</span></Link><span>MADE FOR THE LOVE OF RACING.</span><span>NOT AFFILIATED WITH FORMULA 1.</span></footer>
      {showIntro && <Intro content={intro} onSkip={closeIntro} />}
    </>
  );
}

export default App;
