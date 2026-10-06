import { useCallback, useEffect, useRef, useState } from 'react';

const initialIntro = {
  videoUrl: 'https://www.youtube.com/watch?v=8AYy-BcjRXg',
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

const drivers = [
  { pos: '01', name: 'Lando Norris', team: 'McLaren', points: '390', color: '#ff8000' },
  { pos: '02', name: 'Max Verstappen', team: 'Red Bull Racing', points: '381', color: '#3671c6' },
  { pos: '03', name: 'Oscar Piastri', team: 'McLaren', points: '366', color: '#ff8000' },
  { pos: '04', name: 'Charles Leclerc', team: 'Ferrari', points: '290', color: '#e8002d' },
];

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
  const playerHost = useRef(null);
  const videoId = getYoutubeId(content.videoUrl);

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
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === youtube.PlayerState.ENDED) onSkip();
          },
        },
      });
    }).catch(() => {});

    return () => {
      isActive = false;
      player?.destroy();
    };
  }, [videoId, onSkip]);

  return (
    <section className="intro" aria-label="F1 intro">
      {videoId && <div className="intro__video" ref={playerHost} aria-hidden="true" />}
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
      <a className="wordmark" href="#top" aria-label="Gridline home"><span className="wordmark__mark">G</span>GRIDLINE<span className="wordmark__period">.</span></a>
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#weekend">Race weekend</a>
        <a href="#standings">Standings</a>
        <a href="#stories">The paddock</a>
      </nav>
      <a className="header-cta" href="#weekend">Explore the grid <span aria-hidden="true">↗</span></a>
    </header>
  );
}

function RaceHero() {
  return (
    <section className="race-hero" id="top">
      <div className="race-hero__image" />
      <div className="race-hero__veil" />
      <div className="race-hero__copy">
        <p className="eyebrow"><span className="eyebrow__dot" />THE HOME OF F1 FANS</p>
        <h1>EVERY LAP.<br /><span>EVERY STORY.</span></h1>
        <p className="race-hero__text">The noise, the nerve, the moments that make you fall in love with racing. It all lives here.</p>
        <a className="button button--light" href="#weekend">Find your race weekend <span aria-hidden="true">↗</span></a>
      </div>
      <div className="race-hero__caption"><span>01</span><span>BUILT FOR THE LOVE OF RACING</span></div>
      <div className="race-hero__vertical">FORMULA ONE · FAN CULTURE · COMMUNITY</div>
    </section>
  );
}

function RaceWeekend() {
  return (
    <section className="weekend section-wrap" id="weekend">
      <div className="section-heading">
        <div><p className="section-kicker">MARK YOUR CALENDAR</p><h2>Next up <span>on track</span></h2></div>
        <a className="text-link" href="https://www.formula1.com/en/racing/2026" target="_blank" rel="noreferrer">Full 2026 calendar <span aria-hidden="true">↗</span></a>
      </div>
      <div className="weekend__row">
        <div className="weekend__round"><span>ROUND</span><strong>19</strong></div>
        <div className="weekend__name"><p>UNITED STATES GRAND PRIX</p><h3>AUSTIN <span>/</span> TEXAS</h3><span className="weekend__venue">Circuit of The Americas · 5.513 km · 56 laps</span></div>
        <div className="weekend__date"><span>RACE WEEKEND</span><strong>23 — 25 <small>OCT</small></strong><span className="weekend__year">2026 SEASON</span></div>
        <a className="weekend__arrow" href="https://www.formula1.com/en/racing/2026" target="_blank" rel="noreferrer" aria-label="View United States Grand Prix details">↗</a>
      </div>
    </section>
  );
}

function Standings() {
  const [activeTab, setActiveTab] = useState('Drivers');
  const shownRows = activeTab === 'Drivers' ? drivers : [
    { pos: '01', name: 'McLaren', team: 'Constructor', points: '756', color: '#ff8000' },
    { pos: '02', name: 'Ferrari', team: 'Constructor', points: '652', color: '#e8002d' },
    { pos: '03', name: 'Red Bull Racing', team: 'Constructor', points: '589', color: '#3671c6' },
    { pos: '04', name: 'Mercedes', team: 'Constructor', points: '468', color: '#27f4d2' },
  ];

  return (
    <section className="standings section-wrap" id="standings">
      <div className="section-heading">
        <div><p className="section-kicker">THE CHAMPIONSHIP</p><h2>Made of <span>points.</span></h2></div>
        <div className="tab-switch" role="tablist" aria-label="Championship standings">
          {['Drivers', 'Constructors'].map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
      </div>
      <div className="standings__table">
        <div className="standings__head"><span>POS</span><span>{activeTab === 'Drivers' ? 'DRIVER' : 'TEAM'}</span><span>POINTS</span></div>
        {shownRows.map((row) => (
          <div className="standing-row" key={row.pos}>
            <span className="standing-row__pos">{row.pos}</span>
            <span className="standing-row__name"><i style={{ '--team-color': row.color }} />{row.name}<small>{row.team}</small></span>
            <strong>{row.points}<span> PTS</span></strong>
          </div>
        ))}
      </div>
      <p className="standings__note">Sample standings preview · Connect official live timing and points data here</p>
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

function App() {
  const [intro, setIntro] = useState(initialIntro);
  const [showIntro, setShowIntro] = useState(true);
  const closeIntro = useCallback(() => setShowIntro(false), []);

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
        <RaceHero />
        <RaceWeekend />
        <Standings />
        <Stories />
      </main>
      <footer className="site-footer"><a className="wordmark" href="#top"><span className="wordmark__mark">G</span>GRIDLINE<span className="wordmark__period">.</span></a><span>MADE FOR THE LOVE OF RACING.</span><span>NOT AFFILIATED WITH FORMULA 1.</span></footer>
      {showIntro && <Intro content={intro} onSkip={closeIntro} />}
    </>
  );
}

export default App;
