import { QaDashboard } from './qa-dashboard';
import { NavSpy } from './nav-spy';
import { Clients } from './clients';

const cvHref = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/Jose-David-Barrera-CV.pdf`;

const roles = [
  {
    initials: 'B',
    date: 'May 2025 — Present',
    company: 'Blizzard Entertainment · Microsoft Gaming',
    title: 'Quality Automation Engineer · Contractor',
    description:
      'SR Automation engineering for accounts team at Blizzard Entertainment, including privacy and data workflows across regions. Design functional, integration, regression, API, and RPC testing; investigate defects and incidents; and partner with engineering and product teams to improve release reliability.',
  },
  {
    initials: 'H',
    date: 'Feb 2019 — May 2025',
    company: 'Huge.Inc',
    title: 'QA Analyst → Senior Software Quality Assurance Analyst',
    description:
      'Deliver functional, acceptance, visual, accessibility, performance, security, and AI/LLM testing. Build backend and frontend automation, contribute to code reviews and mentoring, and support FinTech work including Tyba.',
    tools:
      'WCAG 2.1 · Section 508 · k6 · JMeter · OWASP · GitHub Actions · LLM evaluation',
  },
  {
    initials: 'U',
    date: 'Nov 2022 — Nov 2024 · Freelance',
    company: 'Ultra.io',
    title: 'Senior Quality Engineer',
    description:
      'Worked across Web3 and blockchain products, automating UI and API coverage for web, dApp, and Electron desktop applications. Helped create and optimize test frameworks, integrate checks into CI/CD, and define quality throughout the SDLC.',
    tools:
      'Playwright · Puppeteer · Postman · Newman · Web3 · GraphQL · MongoDB · Kafka',
  },
  {
    initials: 'A',
    date: 'Feb 2017 — Jan 2019',
    company: 'Amadeus IT Group',
    title: 'Software QA Analyst',
    description:
      'Designed requirement-based test cases, handled incidents and data quality processes, and carried out software testing and automation. Also contributed to performance testing, basic web vulnerability checks, PCI compliance, and Scrum delivery.',
    tools:
      'Java · Selenium · Maven · JUnit · Katalon · SOAP UI · JMeter · Jira · ALM',
  },
  {
    initials: 'A',
    date: 'May 2016 — Feb 2017',
    company: 'Amadeus IT Group · Accenture / Experis / Manpower',
    title: 'IT Support Engineer',
    description:
      'Supported end users with hardware and software incidents, device installations and changes, directory administration, mobile applications, and workplace technology.',
    tools:
      'Windows · macOS · Active Directory · Cisco · Avaya · Service support',
  },
  {
    initials: 'U',
    date: 'Jul 2014 — Aug 2015',
    company: 'Unisys · Susts Colombia',
    title: 'Bilingual Help Desk Agent',
    description:
      'Provided on-site and remote computer support, operating-system installation and maintenance, network and printer configuration, and service coordination.',
    tools: 'Linux · Windows · macOS · Networking · Backlog and KPI reporting',
  },
  {
    initials: 'S',
    date: 'May 2013 — Apr 2014',
    company: 'Sutherland Global',
    title: 'Sales and Support Representative',
    description:
      'Provided technical support, service, billing assistance, and sales for AT&T residential products and services, with KPI reporting.',
    tools: 'Customer service · Technical support · Billing · KPI reporting',
  },
];

const projects = [
  {
    name: 'PersonalWebsite',
    category: 'Test automation & CI',
    language: 'TypeScript',
    description:
      'This portfolio. Next.js, tested by Playwright in Chromium and WebKit on every push, with an Allure report published to GitHub Pages.',
    href: 'https://github.com/XFaramirX/PersonalWebsite',
    tags: ['Next.js', 'Playwright', 'GitHub Actions', 'Allure'],
  },
  {
    name: 'playwright-e2e-skills',
    category: 'E2E automation',
    language: 'Playwright',
    description:
      'Reusable Playwright skills for page-object workflows, exploratory testing, and accessibility reviews, with agent behavior that can be evaluated and improved.',
    href: 'https://github.com/XFaramirX/playwright-e2e-skills',
    tags: ['Page objects', 'Exploratory testing', 'Accessibility'],
  },
  {
    name: 'QAgent',
    category: 'QA orchestration',
    language: 'HTML',
    description:
      'Analyzes requirements, follows a QA flow, generates test scenarios, and drafts Playwright tests for manual QA review.',
    href: 'https://github.com/XFaramirX/QAgent',
    tags: ['Playwright', 'Test design', 'AI-assisted'],
  },
  {
    name: 'playwrightAPIPractice',
    category: 'API testing',
    language: 'TypeScript',
    description: 'API testing with Playwright and TypeScript.',
    href: 'https://github.com/XFaramirX/playwrightAPIPractice',
    tags: ['Playwright', 'API testing'],
  },
  {
    name: 'agentOrquestration',
    category: 'Agent orchestration',
    language: 'TypeScript',
    description: 'Agent orchestration experiments in TypeScript.',
    href: 'https://github.com/XFaramirX/agentOrquestration',
    tags: ['Agents', 'Orchestration'],
  },
  {
    name: 'playwright-quick',
    category: 'Test automation',
    language: 'TypeScript',
    description: 'Focused Playwright and TypeScript practice.',
    href: 'https://github.com/XFaramirX/playwright-quick',
    tags: ['Playwright', 'E2E'],
  },
];

const skillGroups = [
  {
    number: '01',
    name: 'Automation',
    skills:
      'Playwright, Cypress, Puppeteer, Selenium, Katalon, Protractor, JUnit, TestNG',
  },
  {
    number: '02',
    name: 'APIs & distributed systems',
    skills: 'Postman, Newman, GraphQL, SOAP UI, Kafka, Protocol Buffers',
  },
  {
    number: '03',
    name: 'Quality & risk',
    skills:
      'Accessibility (WCAG / ADA 508), visual testing, k6, JMeter, Gatling, OWASP',
  },
  {
    number: '04',
    name: 'Languages & delivery',
    skills:
      'JavaScript, TypeScript, Java, Bash, Node.js, C#, Git, Jenkins, GitHub Actions, Docker',
  },
  {
    number: '05',
    name: 'AI & agentic testing',
    skills: 'LLM evaluation, Qwen, llama.cpp, Pi Agent, DeepEval, agent skills',
  },
];

const certifications = [
  'ISTQB Certified Tester Foundation Level',
  'Cypress and Playwright 101 · LambdaTest',
  'Mobile Accessibility · Deque Systems',
  'Full Stack Development · MinTIC / Fedesarrollo',
  'English · B2',
  'Testathon winner · Facebook Insights',
  'HackerRank Orchestrate · September 2026 · Participant',
];

const activityNotes = [
  {
    number: '01',
    title: 'Keep a human in the QA loop',
    text: 'AI can analyze requirements and draft scenarios or Playwright tests. A QA engineer still needs to challenge assumptions, validate behavior, and decide what belongs in the suite.',
    tags: 'QA ORCHESTRATION · REVIEW · PLAYWRIGHT',
  },
  {
    number: '02',
    title: 'Build a workflow you control',
    text: 'Recent experiments move more AI work to local models with Qwen 3.6 MTP and llama.cpp, using Pi Agent to switch workflows. Next up: AirLLM, fine-tuning, DeepEval, and agents contributing through GitHub Actions.',
    tags: 'LOCAL MODELS · QWEN 3.6 MTP · LLAMA.CPP · PI AGENT',
  },
  {
    number: '03',
    title: 'Use agents where judgment helps',
    text: 'Agent-assisted exploration can surface accessibility, DOM, and responsive-layout issues. Keep core flows and exact negative cases deterministic; evaluate agent skills and review their results.',
    tags: 'EXPLORATORY QA · ACCESSIBILITY · EVALUATION',
  },
];

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-label">
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

export default function Home() {
  return (
    <main id="home" className="portfolio-shell">
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <NavSpy />
      <aside className="identity-rail">
        <a
          className="wordmark"
          href="#home"
          aria-label="JD. José David Barrera Bernal, home"
        >
          JD<span>.</span>
        </a>
        <nav className="rail-nav" aria-label="Portfolio sections">
          <a href="#home" aria-current="true">
            <span>01</span> Home
          </a>
          <a href="#about">
            <span>02</span> Me
          </a>
          <a href="#qa">
            <span>03</span> CI results
          </a>
          <a href="#work">
            <span>04</span> Projects
          </a>
          <a href="#skills">
            <span>05</span> Skills
          </a>
          <a href="#journey">
            <span>06</span> Journey
          </a>
          <a href="#insights">
            <span>07</span> Insights
          </a>
          <a href="#notes">
            <span>08</span> Credentials
          </a>
          <a href="#contact">
            <span>09</span> Contact
          </a>
        </nav>
        <div className="rail-bottom">
          <a
            href="https://www.linkedin.com/in/josedavidbarrerabernal/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn ↗
          </a>
          <a
            href="https://github.com/XFaramirX"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
        <a className="header-cv" href={cvHref} download>
          ↓ <span>CV</span>
        </a>
      </aside>

      <div className="main-column">
        <header className="topline">
          <span>QUALITY ENGINEERING · AUTOMATION · API · ACCESSIBILITY</span>
          <a href="mailto:xfaramir@gmail.com">
            LET&apos;S TALK <span>↗</span>
          </a>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-kicker">
            <span className="status-dot" /> SENIOR QA ENGINEER · API ·
            AUTOMATION
          </div>
          <div className="avatar-scene">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-dot orbit-dot-one" />
            <span className="orbit-dot orbit-dot-two" />
            <div className="hero-avatar">
              {/* Static export serves this file as-is, so next/image adds nothing. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/profile.jpg`}
                alt="Portrait of José David Barrera Bernal"
                width={800}
                height={800}
                fetchPriority="high"
              />
            </div>
          </div>
          <h1 id="hero-title">
            José David Ismael
            <br />
            <em data-text="Barrera Bernal">Barrera Bernal</em>
          </h1>
          <p className="hero-role">
            Quality Automation Engineer · Blizzard Entertainment (Microsoft)
          </p>
          <p className="hero-summary">
            Over 7 years helping teams ship reliable software across gaming,
            FinTech, Web3, and large-scale platforms.
          </p>
          <div className="hero-actions">
            <a
              href="https://www.linkedin.com/in/josedavidbarrerabernal/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              href="https://github.com/XFaramirX"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
            <a href="mailto:xfaramir@gmail.com">Email ↗</a>
            <a href={cvHref} download>
              CV ↓
            </a>
            <a href="#work">Projects ↗</a>
          </div>
          <a href="#about" className="text-link">
            More about me <span>↓</span>
          </a>
        </section>

        <section className="about-section section-block" id="about">
          <SectionLabel number="01">A LITTLE ABOUT ME</SectionLabel>
          <div className="about-copy">
            <h2>
              7+ years in
              <br />
              <em>quality engineering.</em>
            </h2>
            <div className="about-body">
              <p>
                I&apos;m a Senior QA Engineer with over seven years in
                functional testing, test automation, and performance. Through
                Predikative, I support Blizzard Entertainment (Microsoft Gaming)
                on account services, APIs, RPCs, and distributed data flows.
              </p>
              <p>
                My work spans gaming, FinTech, and Web3: automation frameworks,
                accessibility (WCAG, ADA Section 508), API and visual testing,
                and dependable release pipelines. I also test AI chatbots,
                evaluate LLMs, and communicate quality risks clearly to
                engineering teams and stakeholders.
              </p>
            </div>
          </div>
          <div className="about-note">
            <span>DOMAINS</span>
            <strong>Gaming · FinTech · Web3</strong>
            <span>FOCUS · QUALITY ENGINEERING</span>
          </div>
        </section>

        <Clients />

        <QaDashboard />

        <section className="project-section section-block" id="work">
          <SectionLabel number="03">WHAT I&apos;VE BUILT</SectionLabel>
          <div className="project-heading">
            <h2>
              Projects in
              <br />
              <em>the open.</em>
            </h2>
            <p>
              Selected work, experiments, and practice repositories from my
              GitHub.
            </p>
          </div>
          <article className="project-feature">
            <div className="project-feature-copy">
              <div className="project-meta">
                <span>FEATURED PROJECT</span>
                <span>PUBLIC · FORKED FROM ELLA79</span>
              </div>
              <div className="project-title-row">
                <h3>
                  Agentic Playwright
                  <br />
                  Suite
                </h3>
                <span className="project-glyph" aria-hidden="true">
                  ↗
                </span>
              </div>
              <p className="project-description">
                End-to-end and visual regression suite for Automation Exercise.
                Claude Code agents author and heal tests over Playwright MCP,
                with a containerized CI pipeline.
              </p>
              <div className="project-tags">
                <span>PLAYWRIGHT</span>
                <span>TYPESCRIPT</span>
                <span>CLAUDE CODE</span>
                <span>PLAYWRIGHT MCP</span>
              </div>
              <div className="project-links">
                <a
                  href="https://github.com/XFaramirX/agentic-playwright-suite"
                  target="_blank"
                  rel="noreferrer"
                >
                  View repository ↗
                </a>
              </div>
            </div>
            <aside
              className="pipeline-panel"
              aria-label="This site's QA pipeline"
            >
              <div className="pipeline-header">
                <span className="pipeline-status-dot" />
                <span>GITHUB ACTIONS</span>
                <span className="pipeline-branch">main</span>
              </div>
              <div className="pipeline-empty">
                <span className="pipeline-empty-icon">↑</span>
                <strong>This site tests itself</strong>
                <p>
                  Every push to main runs a Playwright suite against this
                  portfolio and publishes the results.
                </p>
              </div>
              <div className="pipeline-jobs">
                <span>PIPELINE</span>
                <div>
                  <i /> Playwright · Chromium + WebKit
                </div>
                <div>
                  <i /> Allure and trace reports
                </div>
                <div>
                  <i /> Deploy to GitHub Pages
                </div>
                <div>
                  <i /> CI gate
                </div>
              </div>
              <a className="pipeline-run-button" href="#qa">
                See the live CI results <span>↑</span>
              </a>
            </aside>
            <div className="project-footer">
              <span>
                The pipeline above belongs to this portfolio. The featured suite
                has its own pipeline in its repository.
              </span>
            </div>
          </article>
          <div className="repo-grid">
            {projects.map((project) => (
              <a
                className="repo-card"
                href={project.href}
                key={project.name}
                target="_blank"
                rel="noreferrer"
              >
                <span className="repo-category">{project.category}</span>
                <strong>{project.name}</strong>
                <span className="repo-description">{project.description}</span>
                <span className="repo-meta">
                  {[project.language, ...project.tags].join(' · ')}
                </span>
                <span className="repo-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>
          <a
            className="all-repositories"
            href="https://github.com/XFaramirX?tab=repositories"
            target="_blank"
            rel="noreferrer"
          >
            Browse all public repositories <span>↗</span>
          </a>
        </section>

        <section className="skills-section section-block" id="skills">
          <SectionLabel number="04">WHAT I WORK WITH</SectionLabel>
          <div className="skills-heading">
            <h2>
              Skills and
              <br />
              <em>expertise.</em>
            </h2>
            <p>
              A practical toolkit spanning API and RPC testing, automation,
              accessibility, performance, security, and AI evaluation.
            </p>
          </div>
          <div className="skill-list">
            {skillGroups.map((group) => (
              <div className="skill-row" key={group.number}>
                <span className="skill-number">{group.number}</span>
                <h3>{group.name}</h3>
                <p>{group.skills}</p>
                <span className="skill-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="journey-section section-block" id="journey">
          <SectionLabel number="05">WHERE I&apos;VE BEEN</SectionLabel>
          <div className="journey-heading">
            <h2>
              A career in
              <br />
              <em>quality engineering.</em>
            </h2>
            <p>
              Open a role for its responsibilities and stack. Listed newest to
              earliest.
            </p>
          </div>
          <div className="timeline-context">
            <span>CAREER TIMELINE</span>
            <strong>
              2013 <i /> PRESENT
            </strong>
            <p>
              Huge and Ultra overlapped: Ultra was freelance work alongside my
              role at Huge.
            </p>
          </div>
          <div className="timeline">
            {roles.map((role, index) => (
              <details
                className={`timeline-item${index === 0 ? ' current-role' : ''}`}
                key={role.company}
                open={index < 3}
              >
                <summary className="timeline-card">
                  <span className="company-mark">{role.initials}</span>
                  <span className="timeline-card-copy">
                    <strong>{role.company}</strong>
                    <span>{role.title}</span>
                    <time>{role.date}</time>
                  </span>
                  <span className="timeline-chevron" aria-hidden="true">
                    ⌄
                  </span>
                </summary>
                <div className="timeline-detail">
                  <p>{role.description}</p>
                  {role.tools && (
                    <ul>
                      {role.tools.split(' · ').map((tool) => (
                        <li key={tool}>{tool}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
          <p className="career-cv-note">
            Career history summarized from my CV.
          </p>
        </section>

        <section className="insights-section section-block" id="insights">
          <SectionLabel number="06">IDEAS IN PRACTICE</SectionLabel>
          <div className="notes-heading">
            <h2>
              Quality work
              <br />
              <em>keeps evolving.</em>
            </h2>
            <a
              href="https://www.linkedin.com/in/josedavidbarrerabernal/"
              target="_blank"
              rel="noreferrer"
            >
              FOLLOW ON LINKEDIN ↗
            </a>
          </div>
          <div className="insight-list">
            {activityNotes.map((note) => (
              <article className="insight-row" key={note.number}>
                <span className="insight-number">{note.number}</span>
                <div className="insight-copy">
                  <h3>{note.title}</h3>
                  <p>{note.text}</p>
                  <span>{note.tags}</span>
                </div>
                <span className="insight-arrow" aria-hidden="true">
                  ↗
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="notes-section section-block" id="notes">
          <SectionLabel number="07">EDUCATION &amp; CREDENTIALS</SectionLabel>
          <div className="notes-heading">
            <h2>
              Learning and
              <br />
              <em>certification.</em>
            </h2>
            <span className="education-period">
              SYSTEMS ENGINEERING · 2011–2018
            </span>
          </div>
          <div className="education-card">
            <span>UNIVERSIDAD INCCA DE COLOMBIA</span>
            <strong>Computer Science · Systems Engineer</strong>
            <span>2011 — 2018</span>
          </div>
          <ul className="credential-list">
            {certifications.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </section>

        <section className="contact-section" id="contact">
          <SectionLabel number="08">CONTACT</SectionLabel>
          <div className="contact-main">
            <h2>
              Let&apos;s
              <br />
              <em>connect.</em>
            </h2>
            <a className="contact-button" href="mailto:xfaramir@gmail.com">
              EMAIL ME <span>↗</span>
            </a>
          </div>
          <div className="contact-bottom">
            <p>
              Available to discuss quality engineering, test automation,
              accessibility, gaming, and FinTech.
            </p>
            <a href="mailto:xfaramir@gmail.com">xfaramir@gmail.com</a>
          </div>
          <div className="contact-links">
            <a
              href="https://www.linkedin.com/in/josedavidbarrerabernal/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              href="https://github.com/XFaramirX"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </section>

        <footer className="site-footer">
          <span>© 2026 JOSÉ DAVID BARRERA BERNAL</span>
          <span>SPANISH · ENGLISH</span>
          <a href="#home">BACK TO TOP ↑</a>
        </footer>
      </div>
    </main>
  );
}
