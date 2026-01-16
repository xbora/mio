import { Footer } from './footer';
import styles from './mio-landing.module.css';

export function MioLanding() {
  return (
    <div className={styles.mioLanding}>
      <section className={styles.hero}>
        <h1 className={styles.wordmark}>Mio</h1>
        <p className={styles.heroTagline}>The home for your personal AI</p>
        <p className={styles.heroSubline}>One AI instead of 100 apps to manage your life. Name it, give it skills, own it.</p>
        <a 
          href="https://www.linkedin.com/in/xbora/" 
          className={styles.ctaButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          Request Invite
        </a>
      </section>

      <section className={`${styles.section} ${styles.problemSection}`}>
        <h2 className={styles.sectionHeadline}>Your life is scattered across 100 apps.</h2>
        <div className={styles.sectionBody}>
          <p>
            One app for todos. Another for meals. Another for workouts. Another for recipes. 
            Another for groceries. Another for notes.
          </p>
          <p>
            Each one has a slice of your life. None of them talk to each other. 
            And none of them belong to you.
          </p>
          <p>
            What if you had one AI that knew it all - because you taught it yourself?
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.solutionSection}`}>
        <h2 className={styles.sectionHeadline}>Meet Mio.</h2>
        <div className={styles.sectionBody}>
          <p>
            Mio is the home for your personal AI. Give it a name - Jim, Sage, Friday, whatever you want. Give it skills through conversation. It&apos;s yours.
          </p>
          <p>
            Want to track meals? Tell your AI. Need a grocery list? Ask your AI. Storing recipes? Managing todos? Your AI.
          </p>
          <p>
            No new apps to download. No interfaces to learn. Just one AI that grows with you - through conversation.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.howSection}`}>
        <h2 className={styles.sectionHeadline}>Skills, not apps.</h2>
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>01</span>
            <div className={styles.stepContent}>
              <h3>Name your AI</h3>
              <p>Give your AI a name. Jim, Sage, Friday - whatever feels right. This is yours.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>02</span>
            <div className={styles.stepContent}>
              <h3>Teach it skills</h3>
              <p>&ldquo;Track my meals.&rdquo; &ldquo;Remember my recipes.&rdquo; &ldquo;Manage my todos.&rdquo; Just tell it what you need - Mio designs the skill through conversation.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>03</span>
            <div className={styles.stepContent}>
              <h3>Talk to it anywhere</h3>
              <p>Chat, email, SMS, voice, WhatsApp. Your AI meets you where you are. No app required.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.philosophySection}`}>
        <h2 className={styles.sectionHeadline}>Because your AI should belong to you.</h2>
        <div className={styles.sectionBody}>
          <p>
            Mio is built on a simple belief: your personal AI - and everything it learns about you - 
            should be yours to keep.
          </p>
          <p>
            Not locked in someone else&apos;s platform. Not training someone else&apos;s model. 
            Not monetized by someone else&apos;s ads.
          </p>
          <p>
            Your skills. Your data. Your AI.
          </p>
          <p>
            Mio is part of{' '}
            <a 
              href="https://andea.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.andeaLink}
            >
              Andea
            </a>
            {' '}- the personal AI company.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.featuresSection}`}>
        <h2 className={styles.sectionHeadline}>What Mio can do.</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <h4>Track anything</h4>
            <p>Meals, workouts, weight, sleep, habits - teach your AI what matters to you.</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Remember everything</h4>
            <p>Recipes, favorites, preferences, contacts - your AI remembers so you don&apos;t have to.</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Manage your life</h4>
            <p>Todos, grocery lists, wishlists - one place, one AI.</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Talk your way</h4>
            <p>Chat, email, SMS, WhatsApp, voice calls - Your AI meets you where you are.</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Private by design</h4>
            <p>Your data lives in your private <a href="https://arca.build" target="_blank" rel="noopener noreferrer" className={styles.arcaLink}>Arca</a> vault, not on our servers.</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.finalCta}`}>
        <h2 className={styles.sectionHeadline}>Ready to meet your AI?</h2>
        <p className={styles.sectionBody}>
          Mio is in early development. Request an invite to be among the first.
        </p>
        <a 
          href="https://www.linkedin.com/in/xbora/" 
          className={styles.ctaButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          Request Invite
        </a>
        <p className={styles.ctaNote}>You&apos;ll connect with Bora, Mio&apos;s founder.</p>
      </section>

      <div className={styles.footerWrapper}>
        <Footer />
      </div>
    </div>
  );
}