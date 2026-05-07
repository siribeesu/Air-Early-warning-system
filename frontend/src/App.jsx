import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import Heatmap from './Heatmap'
import Forecast from './Forecast'
import Alerts from './Alerts'
import Auth from './Auth'
import Settings from './Settings'
import Sidebar from './Sidebar'

// SVGs as inline components to avoid extra dependencies while keeping high quality
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const WindIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A2 2 0 1 1 11 8H2" />
  </svg>
);

const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('landing');
  };

  if (currentView === 'login') {
    return <Auth initialMode="login" onNavigate={setCurrentView} onLogin={handleLogin} />
  }

  if (currentView === 'signup') {
    return <Auth initialMode="signup" onNavigate={setCurrentView} onLogin={handleLogin} />
  }

  const renderAppView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} onLogout={handleLogout} locationQuery={searchQuery} user={user} />;
      case 'heatmap': return <Heatmap onNavigate={setCurrentView} onLogout={handleLogout} locationQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;
      case 'forecast': return <Forecast onNavigate={setCurrentView} onLogout={handleLogout} locationQuery={searchQuery} user={user} />;
      case 'alerts': return <Alerts onNavigate={setCurrentView} onLogout={handleLogout} locationQuery={searchQuery} user={user} />;
      case 'settings': return <Settings onNavigate={setCurrentView} onLogout={handleLogout} user={user} />;
      default: return null;
    }
  }

  const appViews = ['dashboard', 'heatmap', 'forecast', 'alerts', 'settings'];

  if (appViews.includes(currentView)) {
    return (
      <div className="dashboard-layout">
        <Sidebar onNavigate={setCurrentView} onLogout={handleLogout} user={user} currentView={currentView} />
        {renderAppView()}
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <header className="site-header">
        <div className="container header-container">
          <div className="brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#brand-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <defs>
                <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9"/>
                  <stop offset="100%" stopColor="#2563eb"/>
                </linearGradient>
              </defs>
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
            </svg>
            Air<span>Intelligence</span>
          </div>
          <nav>
            <ul className="nav-links">
              <li><a href="#" onClick={() => setCurrentView('dashboard')}>Dashboard</a></li>
              <li><a href="#" onClick={() => setCurrentView('heatmap')}>Heatmap</a></li>
              <li><a href="#" onClick={() => setCurrentView('forecast')}>Forecast</a></li>
              <li><a href="#" onClick={() => setCurrentView('alerts')}>Alerts</a></li>
            </ul>
          </nav>
          <div className="auth-buttons">
            {isLoggedIn ? (
              <div className="user-profile-header">
                <span className="user-name">Hi, {user?.name || 'Observer'}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setCurrentView('login')}>Login</button>
                <button className="btn btn-primary" onClick={() => setCurrentView('signup')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="container">
        <section className="hero">
          <div className="hero-content animate-fade-in delay-100">
            <div className="badge-outline">
              <SparklesIcon /> ATMOSPHERIC INTELLIGENCE NETWORK (v2.4)
            </div>
            <h1 className="hero-title">
              Advanced Air Quality <span>Early Warning System</span>
            </h1>
            <p className="hero-desc">
              Harnessing multi-spectral satellite data and hyper-local neural sensors to predict toxic dispersion patterns before they impact society.
            </p>
            
            <div className="search-bar">
              <LocationIcon />
              <input 
                type="text" 
                placeholder="Search by city or sensor ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setCurrentView('dashboard'); }}
              />
              <button className="btn btn-primary" onClick={() => setCurrentView('dashboard')}>Initiate Scan</button>
            </div>
          </div>
        </section>
        </div>

      <section className="pollutant-intelligence animate-fade-in delay-200">
        <div className="container">
          <div className="section-header">
            <h2>Pollutant Intelligence</h2>
            <p>Critical threshold analysis for primary atmospheric contaminants.</p>
          </div>
          <div className="intelligence-grid">
            <div className="intel-card">
              <div className="intel-label">PM 2.5</div>
              <h3>Fine Particulate Matter</h3>
              <p>Microscopic particles that bypass respiratory defenses to enter the bloodstream directly. Primary driver of cardiovascular degradation.</p>
              <div className="intel-threshold text-poor">Danger: &gt;35µg/m³</div>
            </div>
            <div className="intel-card">
              <div className="intel-label">NO2</div>
              <h3>Nitrogen Dioxide</h3>
              <p>Highly reactive gas primarily from vehicle combustion. Causes severe airway inflammation and photochemical smog formation.</p>
              <div className="intel-threshold text-moderate">Alert: &gt;40ppb</div>
            </div>
            <div className="intel-card">
              <div className="intel-label">O3</div>
              <h3>Ground-Level Ozone</h3>
              <p>Formed by chemical reactions between oxides of nitrogen and VOCs in sunlight. Reduces lung function and triggers asthma.</p>
              <div className="intel-threshold text-moderate">Warning: &gt;70ppb</div>
            </div>
          </div>
        </div>
      </section>


      <section className="crisis-section animate-fade-in delay-200">
        <div className="container">
          <div className="crisis-header">
            <span className="badge-outline" style={{borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)'}}>
              CRITICAL REGION ALERT
            </span>
            <h2>India's Accelerating Air Quality Crisis</h2>
            <p>A day-by-day analysis of the sub-continent's atmospheric degradation.</p>
          </div>
          
          <div className="crisis-grid">
            <div className="crisis-card">
              <div className="crisis-content">
                <div className="crisis-stat text-poor">42%</div>
                <h4>Winter Spike Velocity</h4>
                <p>During winter months (Oct-Jan), Northern India sees a 42% faster day-by-day accumulation of PM2.5 due to seasonal agricultural burning and severe thermal inversion.</p>
              </div>
            </div>
            <div className="crisis-card">
              <div className="crisis-content">
                <div className="crisis-stat text-moderate">1.2M+</div>
                <h4>Annual Health Impact</h4>
                <p>Prolonged exposure to PM10 and NO2 in Tier-1 cities like Delhi and Mumbai leads to an estimated 1.2 million severe respiratory hospital admissions annually.</p>
              </div>
            </div>
            <div className="crisis-card">
              <div className="crisis-content">
                <div className="crisis-stat text-poor">9 of 10</div>
                <h4>Global Toxic Ranking</h4>
                <p>Nine of the top ten most polluted cities globally are routinely located in the Indo-Gangetic Plain, showing an exponential day-over-day toxic growth trajectory.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="observer-section">
        <div className="container">
          <div className="observer-header animate-fade-in delay-300">
            <div className="observer-title">
              <h2>The Ethereal Observer</h2>
              <p>Advanced environmental intelligence isn't just about reading sensors. It's about understanding the fluid dynamics of our world.</p>
            </div>
            <div className="global-sensors">
              <CloudIcon />
              <div className="global-sensors-text">
                <span>GLOBAL SENSORS</span>
                <span>14,200+</span>
              </div>
            </div>
          </div>

          <div className="observer-cards animate-fade-in delay-300">
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon"><ActivityIcon /></div>
                <h3 className="feature-title">Hyper-Local Forecasting</h3>
                <p className="feature-desc">
                  Utilizing 48-hour predictive modeling to visualize how wind patterns and traffic density affect your neighborhood's breathable air.
                </p>
              </div>
              <div className="feature-visual">
                {/* A decorative graph placeholder matching the pale look of the mockup */}
                <svg className="feature-graph" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <path d="M0 200 L0 150 C50 120, 100 180, 150 140 C200 100, 250 160, 300 110 C350 60, 380 90, 400 40 L400 200 Z" fill="url(#gradient-graph)" opacity="0.3" />
                  <path d="M0 150 C50 120, 100 180, 150 140 C200 100, 250 160, 300 110 C350 60, 380 90, 400 40" fill="none" stroke="url(#gradient-line)" strokeWidth="4" />
                  <defs>
                    <linearGradient id="gradient-graph" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-color)" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="100%" stopColor="var(--accent-color)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="feature-card card-blue">
              <div className="feature-content">
                <div className="feature-icon"><BellIcon /></div>
                <h3 className="feature-title">Instant Alerts</h3>
                <p className="feature-desc">
                  Receive smart notifications the moment air quality drops below your personal safety threshold.
                </p>
                <button className="btn btn-secondary">Enable Alerts</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">Air<span>Intelligence</span></div>
              <p className="footer-desc">
                Synthesizing global sensor data into actionable wellness intelligence for the modern world.
              </p>
            </div>
            
            <div>
              <div className="footer-col-title">PLATFORM</div>
              <div className="footer-links">
                <a href="#">Dashboard</a>
                <a href="#">Heatmap</a>
                <a href="#">API Docs</a>
              </div>
            </div>
            
            <div>
              <div className="footer-col-title">COMPANY</div>
              <div className="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
            </div>

            <div>
              <div className="footer-col-title">NEWSLETTER</div>
              <div className="newsletter-form">
                <input type="email" placeholder="Email" className="newsletter-input" />
                <button className="btn-newsletter"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="copyright">© 2026 Air Intelligence. Breathing room for your data.</div>
            <div className="social-icons">
              <a href="#" aria-label="Globe"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>
              <a href="#" aria-label="Share"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></a>
              <a href="#" aria-label="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
