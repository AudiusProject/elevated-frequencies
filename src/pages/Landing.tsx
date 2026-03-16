import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { useAudiusOAuth } from '@/hooks/useAudiusOAuth'
import styles from './Landing.module.css'

export function Landing() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { login, loading, error } = useAudiusOAuth()

  const handleStart = () => {
    if (user) {
      navigate('/submit')
    } else {
      login()
    }
  }

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroEyebrow}>Track Submission Portal</div>
        <h1 className={styles.heroTitle}>
          Get Your<br />Track <em>Heard</em>
        </h1>
        <p className={styles.heroDesc}>
          Submit your original track for a chance to be featured at the end of an Elevated Frequencies
          episode. Upload via Audius — a community-run music platform for connection, collaboration,
          and culture-led artist growth.
        </p>
        <div className={styles.heroStats}>
          <div>
            <div className={styles.statNum}>140+</div>
            <div className={styles.statLabel}>Episodes</div>
          </div>
          <div>
            <div className={styles.statNum}>Open</div>
            <div className={styles.statLabel}>Submissions</div>
          </div>
        </div>

        {/* Signed-in welcome banner */}
        {user ? (
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeAvatar}>
              {user.profilePicture
                ? <img src={user.profilePicture} alt="" />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div className={styles.welcomeText}>
              <strong>Welcome back, {user.name}</strong>
              <span>@{user.handle} &middot; Ready to submit</span>
            </div>
            <button onClick={() => navigate('/submit')} className={styles.ctaBtn}>
              Upload &amp; Submit a Track &nbsp;&rarr;
            </button>
          </div>
        ) : (
          <>
            <button onClick={handleStart} className={styles.ctaBtn} disabled={loading}>
              {loading ? <span className="spin" /> : null}
              Sign In with Audius to Submit &nbsp;&rarr;
            </button>
            {error ? (
              <div className={styles.authError}>{error}</div>
            ) : null}
            <p className={styles.ctaHint}>
              Free Audius account required &middot;{' '}
              <a href="https://audius.co/signup" target="_blank" rel="noreferrer">Create one in seconds</a>
            </p>
          </>
        )}
      </section>

      {/* Signed-in quick actions */}
      {user ? (
        <section className={styles.quickActions}>
          <div
            className={styles.actionCard}
            onClick={() => navigate('/submit')}
            role="button"
            tabIndex={0}
          >
            <div className={styles.actionIcon}>&uarr;</div>
            <div>
              <strong>Submit a Track</strong>
              <span>Upload your audio and fill in the details</span>
            </div>
            <div className={styles.actionArrow}>&rarr;</div>
          </div>
          <div
            className={styles.actionCard}
            onClick={() => navigate('/my-submissions')}
            role="button"
            tabIndex={0}
          >
            <div className={styles.actionIcon}>&#9835;</div>
            <div>
              <strong>My Submissions</strong>
              <span>Check the status of tracks you've submitted</span>
            </div>
            <div className={styles.actionArrow}>&rarr;</div>
          </div>
          {user.isArtist ? (
            <div
              className={styles.actionCard}
              onClick={() => navigate('/dashboard')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.actionIcon}>&#9776;</div>
              <div>
                <strong>Artist Dashboard</strong>
                <span>Review and manage submitted tracks</span>
              </div>
              <div className={styles.actionArrow}>&rarr;</div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* HOW IT WORKS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>How It Works</span>
          <div className={styles.sectionLine} />
        </div>
        <div className={styles.stepsGrid}>
          {[
            { num: '01', title: 'Sign In with Audius', desc: 'Connect your Audius account. If you don\'t have one, create a free account in seconds.' },
            { num: '02', title: 'Upload Your Track', desc: 'Select your audio file and fill in the details. Your track is uploaded privately to Audius, owned by you.' },
            { num: '03', title: 'Olivia Reviews', desc: 'Olivia personally listens to every submission, looking for original music with genuine energy.' },
            { num: '04', title: 'Get Featured', desc: 'Selected tracks are spotlighted at the end of an EF episode. You\'ll be notified via comments on your track.' },
          ].map((step) => (
            <div className={styles.step} key={step.num}>
              <div className={styles.stepNum}>{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SIDEBAR INFO (stacked on landing) */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.scard}>
            <div className={styles.scardHead}>Your Curator</div>
            <div className={styles.scardBody}>
              <div className={styles.hostRow}>
                <div className={styles.hostAvatar}>O</div>
                <div>
                  <div className={styles.hostName}>Olivia Mancuso</div>
                  <div className={styles.hostRole}>Host &middot; Chicago Music Nexus</div>
                </div>
              </div>
              <p className={styles.hostBio}>
                Entrepreneur and Chicago Music Nexus co-founder Olivia Mancuso cues up insider tips
                and real-world stories to help aspiring artists turn their passion into profit.
              </p>
            </div>
          </div>

          <div className={styles.scard}>
            <div className={styles.scardHead}>What Olivia Looks For</div>
            <div className={styles.scardBody}>
              <ul className={styles.criteria}>
                <li>Original tracks only, no uncleared samples</li>
                <li>Music with genuine underground energy</li>
                <li>Tracks that tell a story or create a feeling</li>
                <li>Lesser-known artists who deserve more ears</li>
                <li>Completed, production-ready tracks</li>
                <li>Artists engaged in their community</li>
              </ul>
            </div>
          </div>

          <div className={styles.scard}>
            <div className={styles.scardHead}>What to Expect</div>
            <div className={styles.scardBody}>
              <div className={styles.timeline}>
                {[
                  { n: '1', title: 'Submission Received', desc: 'Your track enters the queue immediately.' },
                  { n: '2', title: 'Review Period', desc: 'Olivia reviews on a rolling basis, typically 2–4 weeks.' },
                  { n: '3', title: 'If Selected', desc: 'Olivia will comment on your track directly with next steps.' },
                  { n: '4', title: 'Featured on EF', desc: 'Your track plays to the full EF audience.' },
                ].map((item, i) => (
                  <div className={styles.titem} key={i}>
                    <div className={styles.tdot}>{item.n}</div>
                    <div className={styles.tcontent}>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.scard} ${styles.audiusScard}`}>
            <div className={styles.scardHead}>Why Audius?</div>
            <div className={styles.scardBody}>
              <p>
                Audius is for people pushing music scenes forward. A community-run platform built on
                connection, collaboration, and culture-led artist growth. Your track, your ownership.
              </p>
              <a className={styles.audiusLink} href="https://audius.co/signup" target="_blank" rel="noreferrer">
                Create a free account &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
