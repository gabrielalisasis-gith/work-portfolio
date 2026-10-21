// mini Gab, the roaming site guide: sprite anchors, the hiding spots on each page,
// everything he says, and the help card's quick answers. Read by src/scripts/mascot.js.

const OL = '#2A1710', SKIN = '#F2C097', SKIN_SH = '#DE9F78';
// a chibi hand gripping an edge (also used by the hero bust in Mascot.astro)
export const HAND_SVG = `
    <path d="M6 14 C6 6 12 2 20 2 C28 2 34 6 34 14 C34 21 28 25 20 25 C12 25 6 21 6 14 Z" fill="${SKIN}" stroke="${OL}" stroke-width="3" stroke-linejoin="round" />
    <path d="M13 16 v6 M20 16.5 v7 M27 16 v6" stroke="${SKIN_SH}" stroke-width="2.2" stroke-linecap="round" />
    <ellipse cx="15" cy="8" rx="4" ry="2.2" fill="#fff" opacity=".5" />`;

// public/images/mascot/gab-body.webp: a 3×3 atlas of full-body poses in 316×344 cells.
// Anchors are cell pixels: feet = bottom centre, seat = where he sits on an edge,
// cut = the straight edge he peeks out from behind, grip = where his fists hold a ledge.
export const BODY = {
  cell: [316, 344],
  poses: {
    stand: { i: 0, feet: [158, 338], head: [158, 9] },
    wave: { i: 1, feet: [158, 338], head: [160, 10] },
    point: { i: 2, feet: [158, 338], head: [150, 6] },
    charge: { i: 3, feet: [164, 338], head: [112, 37] },
    launch: { i: 4, feet: [158, 338], head: [170, 24] },
    land: { i: 5, feet: [145, 338], head: [170, 18] },
    sit: { i: 6, seat: [157, 254], head: [158, 17] },
    peek: { i: 7, cut: 197, feet: [120, 338], head: [104, 6] },
    hang: { i: 8, grip: [150, 18], head: [150, 30] },
  },
} as const;

// the face atlas (gab-faces.webp, 3×3 of 360px): idle, blink, wink / laugh, surprised, stars / bashful, sleepy, dizzy
export const FACES = { idle: 0, blink: 1, wink: 2, laugh: 3, surprised: 4, stars: 5, bashful: 6, sleepy: 7, dizzy: 8 } as const;

type Mode = 'hero' | 'word' | 'peek-top' | 'sit' | 'peek-side' | 'hang';
export type Spot = {
  id: string;
  sel: string;
  mode: Mode;
  fx?: number; // where along the element's width (0–1)
  fy?: number; // peek-side: where along the height his head sits (0–1)
  side?: 'l' | 'r'; // peek-side: which edge he hides behind
  word?: string; // word mode: a word on the heading's first line, which he hides behind
  phone?: Partial<Spot>; // overrides at ≤760px, where there are no side gutters
  key?: string; // whose lines he says (defaults to page.id)
};

// the contact form is tall: he sits on its top edge, then hangs from its bottom once you scroll on
const contact: Spot = { id: 'contact', sel: '#contact .contact-form', mode: 'sit', fx: 0.86, phone: { fx: 0.8 } };
const contactLow: Spot = { id: 'contact-low', key: 'contact', sel: '#contact .contact-form', mode: 'hang', fx: 0.9 };

// spots in page order; the first one is where he starts
export const PAGES: { key: string; match: RegExp; spots: Spot[] }[] = [
  {
    key: 'home', match: /^\/$/, spots: [
      { id: 'hero', sel: '.h1-wrap', mode: 'hero' },
      { id: 'workflow', sel: '.hero .demo-window', mode: 'peek-side', side: 'l', fy: 0.34, phone: { mode: 'sit', fx: 0.62 } },
      { id: 'results', sel: '.proof .proof-stats', mode: 'peek-top', fx: 0.74 },
      { id: 'services', sel: '#dashboard .bento-card:nth-child(3)', mode: 'peek-side', side: 'r', fy: 0.12, phone: { mode: 'peek-top', fx: 0.84 } },
      contact, contactLow,
    ],
  },
  {
    key: 'work', match: /^\/work$/, spots: [
      { id: 'title', sel: '.work-hero h1', mode: 'word', word: 'live,', phone: { word: 'are' } },
      { id: 'cases', sel: '#caseGrid .case-card.is-featured .browser', mode: 'sit', fx: 0.86 },
      { id: 'kemp', sel: '#caseGrid .case-card:nth-child(2)', mode: 'peek-side', side: 'l', fy: 0.12, phone: { mode: 'peek-top', fx: 0.84 } },
      { id: 'orange', sel: '#caseGrid .case-card:nth-child(4)', mode: 'peek-side', side: 'r', fy: 0.1, phone: { mode: 'peek-top', fx: 0.84 } },
      { id: 'roles', sel: '#caseGrid .case-card:nth-child(6)', mode: 'sit', fx: 0.86 },
      { id: 'emailband', sel: '.mx-band', mode: 'sit', fx: 0.8 },
      { id: 'automations', sel: '#workflows .wf-grid', mode: 'peek-side', side: 'r', fy: 0.06, phone: { mode: 'peek-top', fx: 0.84 } },
      { id: 'flows2', sel: '#workflows .wf-tile:nth-child(3)', mode: 'peek-side', side: 'l', fy: 0.1, phone: { mode: 'peek-top', fx: 0.84 } },
      { id: 'built', sel: '#projects .sec-head h2', mode: 'word', word: 'built' },
      { id: 'projects', sel: '#projectsGrid', mode: 'hang', fx: 0.9 },
      contact, contactLow,
    ],
  },
  {
    key: 'emails', match: /^\/work\/email-marketing$/, spots: [
      { id: 'hero', sel: '.mx-hero h1', mode: 'word', word: 'follow' },
      { id: 'inbox', sel: '#mxApp', mode: 'sit', fx: 0.6 },
      { id: 'inboxlow', sel: '#mxApp', mode: 'hang', fx: 0.06 },
      { id: 'ladder', sel: '.mx-ladders', mode: 'hang', fx: 0.94 },
      { id: 'deliver', sel: '.mx-lanes', mode: 'peek-side', side: 'l', fy: 0.08, phone: { mode: 'peek-top', fx: 0.84 } },
      { id: 'build', sel: '.mx-steps', mode: 'sit', fx: 0.93 },
      contact, contactLow,
    ],
  },
  {
    key: 'case', match: /^\/work\/[a-z-]+$/, spots: [
      { id: 'hero', sel: '.cs-hero .browser', mode: 'sit', fx: 0.88 },
      { id: 'quote', sel: '.cs-quote', mode: 'peek-side', side: 'l', fy: 0, phone: { mode: 'peek-top', fx: 0.9 } },
      { id: 'pao', sel: '.pao', mode: 'peek-top', fx: 0.9 },
      { id: 'diagram', sel: '.diagram-wrap', mode: 'hang', fx: 0.9 },
      { id: 'stack', sel: '.stack-row', mode: 'peek-top', fx: 0.94 },
      { id: 'gallery', sel: '.case-gallery', mode: 'sit', fx: 0.9 },
      { id: 'ongoing', sel: '.cs-ongoing', mode: 'sit', fx: 0.9 },
      { id: 'next', sel: '.cs-next-card', mode: 'peek-side', side: 'r', fy: 0.1, phone: { mode: 'peek-top', fx: 0.86 } },
      contact, contactLow,
    ],
  },
  {
    key: 'about', match: /^\/about$/, spots: [
      { id: 'hero', sel: '.about-title', mode: 'word', word: 'the' },
      { id: 'facts', sel: '.about-facts', mode: 'peek-top', fx: 0.95 },
      { id: 'mess', sel: '.mess-cards', mode: 'sit', fx: 0.88 },
      { id: 'month', sel: '.month-steps', mode: 'peek-top', fx: 0.95 },
      { id: 'rules', sel: '.rule-grid', mode: 'sit', fx: 0.96 },
      { id: 'path', sel: '.path-list', mode: 'peek-side', side: 'r', fy: 0.05, phone: { mode: 'peek-top', fx: 0.9 } },
      { id: 'tools', sel: '.toolkit .tool-group:last-child', mode: 'hang', fx: 0.95 },
      { id: 'faq', sel: '.faq-list', mode: 'peek-side', side: 'l', fy: 0.08, phone: { mode: 'peek-top', fx: 0.88 } },
      contact, contactLow,
    ],
  },
];

// What he says. Keys are `page.spot`, `slug.spot` on case pages, or a pool name.
// Every fact here comes from the site itself.
export const LINES: Record<string, string[]> = {
  // first appearance on each kind of page in a visit
  'greet.home': ['Hi! I’m mini Gab 👋 Scroll and I’ll show you around.', 'Hey there. I’m Gab’s sidekick. Click me if you need anything.', 'Welcome! I’m the tiny guy hiding in the corners.'],
  'greet.work': ['Work page! Four case studies, all live.', 'These are real systems, running right now.', 'I’ll sit next to the good bits. Follow me.'],
  'greet.case': ['Case study time. Grab a coffee ☕', 'This one has a good twist. Keep scrolling.', 'Problem, approach, outcome. I’ll point at the juicy part.'],
  'greet.emails': ['Every email here is the real thing, rendered from Klaviyo.', 'Welcome to the inbox. Codes are masked, sorry 😄', 'Open any flow below. I’ll wait right here.'],
  'greet.about': ['This is Gab. Well, the big version of me.', 'About page! The ID card even shows if he’s online.', 'Want to know how Gab works? Right place.'],
  welcomeBack: ['You’re back! I saved your seat.', 'Welcome back 👋 Same Gab, same Grinches.', 'Oh hey, again! Missed you.'],
  idle: [
    'Psst. Click me if you have a question.',
    'I’m just hiding here. Act natural.',
    'Still reading? Take your time.',
    'I can teleport, by the way. Scroll and see.',
    'These are Kobe 6 Grinches, by the way.',
    'Gab built this whole site. I just live in it.',
    'If anything here looks familiar, Gab can build it for you.',
    'Need a hand? I’ve got two. Click me.',
    'I’ll be quiet now. Mostly.',
    'Hiding is my cardio.',
  ],
  back: ['Going back up? Good call.', 'Missed something? Happens to me too.', 'Rewind! ⏪', 'Back to the classics.', 'Teleporting back, hold on.'],
  fast: ['Whoa, slow down! I can barely keep up ⚡', 'Speed-reading? Respect.', 'Zoom! Wait for me!', 'That was fast. Even for a superhero.', 'Flying past a lot of good stuff there 😄'],
  dock: ['I’ll wait over here.', 'Peeking from the side. Click if you need me.', 'Just hanging off your screen, no big deal.', 'Long section! I’ll be right here.', 'Still with you.', 'Edge of the screen. Best seat in the house.'],
  typing: ['I’ll be quiet while you type 🤐', 'Go on, Gab reads every one of these.', 'Typing… I’m not looking. Promise.'],
  poke: ['Hey! That tickles.', 'Boop! What’s up?', 'You rang?'],
  dizzy: ['Whoa… okay, okay, I’m dizzy 😵‍💫', 'Too many clicks. The room is spinning.', 'I need a minute. Or three.'],
  bye: ['Okay, heading home. Click the little button if you miss me 👋', 'Bye for now! I’ll be in the corner if you need me.'],
  hello: ['I’m back! Did you miss me?', 'Reporting for duty 🫡'],

  // home
  'home.hero': ['Hi! I’m mini Gab 👋', 'Scroll down, I’ll show you around.', 'Click me if you have a question.', 'This headline? Gab means it.', 'Need a CRM untangled? That’s his thing.', 'Your workflows, minus the babysitting.'],
  'home.workflow': [
    'This is the speed-to-lead pattern Gab builds in GoHighLevel.',
    'New lead in, text out in seconds. Nobody babysits it.',
    'Simulated data, real wiring. Watch a lead get booked 👀',
    'No reply? It sends a booking link, then makes a call task.',
    'Replies get qualified by AI, then booked. Neat, right?',
  ],
  'home.results': ['36,000+ members, grown from 900. Not bad, huh?', '3,000+ customers, handled through the CRM.', 'Four client systems, live right now.', '3+ years of GoHighLevel. That’s a lot of workflows.', 'Those names below are real clients and roles.'],
  'home.services': ['Services! GoHighLevel is the main dish.', 'Email deliverability is on the menu too. Ask Kemp Beauty.', 'Storefronts, CRMs, integrations. Pick one, or all.', 'Psst, these cards are clickable.', 'Not sure what you need? Click me, I’ll help.'],

  // every page
  contact: [
    'Psst… this form goes straight to Gab.',
    'Tell him what’s slowing you down. He replies within 24 hours on weekdays.',
    'I’ll guard the form. Nobody touches it but you 🛡️',
    'Prefer WhatsApp? The link’s right there.',
    'No budget yet? Pick “Not sure yet”. Totally fine.',
    'This is my favourite part of the site.',
  ],

  // work
  'work.title': ['“Live” is the key word. Everything on this page runs.', 'Filter by GoHighLevel, Klaviyo, Shopify or custom apps.', 'Four case studies, then the automations. Scroll on.'],
  'work.cases': ['A whole care agency runs on Cordelia ARC.', 'Four systems turned into one platform. 4 → 1!', 'Click a card for the full story.', 'Every card here is a live client system.'],
  'work.kemp': ['Kemp Beauty had 11 flows and one sneaky DMARC bug.', 'Kemp’s emails were bouncing. Gab found out why.', 'Pretty storefront, right? Gab designs those pages too.', 'Next door, Sell Ready AI runs on 87 reusable sections.'],
  'work.orange': ['Orange Ashes runs a whole store inside GoHighLevel.', '24 products, and zero manual fulfilment steps.'],
  'work.roles': ['Gab worked inside these teams, day to day.', 'LiveHowYouWant grew from 900 to 36,000+ members in 8 months.', 'Supreme Club Tours grew to 3,000+ customers on the CRM.'],
  'work.emailband': ['Every flow email lives behind this card. Go on, open it.', '72 emails across two brands. I counted.', 'That’s the inbox explorer. My favourite toy.'],
  'work.automations': ['This is where the automations live. Click one to zoom.', 'Shuttle and hotel routing lands straight in Google Sheets.', 'One of these spots affiliates in the inbox with AI.', 'These are real GoHighLevel and Zapier builds.'],
  'work.flows2': ['WooCommerce orders turn into shuttle or hotel opportunities.', 'AI reads the inbox, spots affiliates, and the CRM updates itself.'],
  'work.built': ['Hiding behind “built”. Fitting, right?', 'These came before the client work.'],
  'work.projects': ['Side projects! Gab’s been building for a while.', 'A fraud detection capstone in Python. Nerdy, I love it.', 'Vision Drive is a transport system built with Firebase and charts.', 'Filter by full-stack, front-end or data.'],

  // case studies (shared, then per client)
  'case.hero': ['Click the screenshot to zoom in.', 'That’s the live site. It’s real, I checked.'],
  'case.pao': ['The problem is always the fun part.', 'In a hurry? Read the outcome column first.'],
  'case.quote': ['Gab’s own words. He means every one.', 'Sector, stack and scale are all on the right.'],
  'case.diagram': ['The whole story, in one picture.'],
  'case.stack': ['The tools behind this build, all in one row.'],
  'case.gallery': ['Tap the screenshot for a closer look.', 'Real screenshots from the live site.'],
  'case.ongoing': ['Still shipping for this one. The job didn’t end at launch.', 'Ongoing work means it keeps getting better.'],
  'case.next': ['The next case study is a good one too →', 'Keep going, there’s more.', 'One more? Go on.'],
  'cordelia-arc.hero': ['A care agency runs its referrals, hiring and billing on this.', 'React and Supabase under the hood.'],
  'cordelia-arc.pao': ['91 database migrations went into this one.', 'About 50 edge functions behind this one.', 'HIPAA-regulated, so everything is locked down tight.'],
  'cordelia-arc.ongoing': ['Four tools became one. The staff still get new features.'],
  'kemp-beauty.hero': ['This one has lashes, Klaviyo and a DMARC detective story.', 'Gab designs these storefront pages too.'],
  'kemp-beauty.pao': ['Klaviyo said “live”. Gmail said “550”. Gab believed Gmail.', 'The fix was tested with a real signup, straight into Gmail.'],
  'kemp-beauty.diagram': ['Before the fix: bounced. After: inbox.', 'You can’t authenticate a bare root domain. mail. to the rescue.'],
  'kemp-beauty.gallery': ['The rebuilt product page: descriptor first, then the swatches.'],
  'kemp-beauty.ongoing': ['Gab still ships storefront updates for Kemp.', 'Want all 32 emails? The button’s just above.'],
  'sell-ready-ai.hero': ['Shopify, pretending to be a full marketing site. Successfully.', 'A searchable podcast archive, built entirely in Liquid.'],
  'sell-ready-ai.pao': ['87 reusable sections. Lego, but for landing pages.', '23 templates and counting.'],
  'sell-ready-ai.ongoing': ['Every change is tracked in Git against the live theme.'],
  'orange-ashes.hero': ['A digital store inside GoHighLevel. Yes, inside the CRM.', '24 products, 9 collections, one very happy client.'],
  'orange-ashes.pao': ['Zero manual fulfilment steps. Orders deliver themselves.', 'Branded emails go out through an authenticated Mailgun domain.'],

  // emails
  'emails.hero': ['I’m hiding behind “follow”. Very on brand.', '17 live flows, 72 emails. All real.', 'The first cart reminder goes out in 5 minutes.', 'Discount codes are masked. Nice try 😄'],
  'emails.inbox': ['Pick a flow on the left, open an email on the right.', 'Flip between desktop and phone views up there.', 'Switch brands with the pills: Kemp Beauty or The Healthy Hand.', 'Use the arrow keys to jump between emails.', 'The Halloween campaign’s in there too 🎃'],
  'emails.inboxlow': ['Rendered with a placeholder name and a sample cart.', 'Codes are masked. I tried to peek too.'],
  'emails.ladder': ['Discounts only climb for people who don’t buy.', 'Early buyers never see the bigger code.', 'Kemp Beauty holds its 10% back until day two.', 'The Healthy Hand steps from 10% to 20%.'],
  'emails.deliver': ['A “live” flow isn’t always a delivered email. Ask Kemp.', 'Unsigned root domain plus p=reject means bounced mail.', 'Fixed with an authenticated mail. subdomain.', 'The full detective story is in the Kemp case study.'],
  'emails.build': ['Five steps, from trigger to inbox.', 'Fast while intent is hot, then wider gaps.', 'One idea per email, sized for a thumb.', 'Step five proves the email actually lands.'],

  // about
  'about.hero': ['You run the business. Gab runs the systems. I run around.', 'Click the ID card. It flips!', 'The badge shows if Gab’s online right now.', 'Based in Batangas, working US hours.'],
  'about.facts': ['4 client systems, 36,000+ members and 3+ years of building.', 'A CS degree from Batangas State University, too.'],
  'about.mess': ['Tap a mess on the left. Gab has fixed every one.', 'Each answer on the right is a real client.', 'Leads going cold? That one’s a classic.', 'Copying orders by hand? Never again.'],
  'about.month': ['Day one is just a 15-minute call. Easy.', 'Week four: live and handed over.', 'Audit, build, test, launch. In that order.', 'Two weeks of building, then it’s yours.'],
  'about.rules': ['Rule one: tested end to end. Always.', 'Manual? Automated. He means it.', 'Trade-offs up front, no surprises later.', 'When the tools stop, Gab writes code.'],
  'about.path': ['2021: CS degree. 2025: 36,000+ members.', 'From front-end dev to client systems.', '900 to 36,000+ members in 8 months, at LiveHowYouWant.', 'Now: client systems, live.'],
  'about.tools': ['GoHighLevel, Klaviyo, Zapier… he speaks fluent CRM.', 'React and Supabase when a tool isn’t enough.', 'That’s a lot of logos. He uses all of them.', 'ClickUp, monday.com, Trello. He’ll fit your team’s setup.'],
  'about.faq': ['Questions! Click one to open it.', 'Short version: US hours, 24-hour replies.', 'Still curious? Click me, I know the answers too.'],
};

// greeting at the top of the help card, by page
export const HELP_HI: Record<string, string> = {
  home: 'Hey! I’m mini Gab, Gab’s sidekick. Want the short version of what he does?',
  work: 'Hey! I’m mini Gab. Looking for something like your project?',
  case: 'Hey! I’m mini Gab. Want more on this one, or something like it for you?',
  emails: 'Hey! I’m mini Gab. Thinking about your own email flows?',
  about: 'Hey! I’m mini Gab. Got a question about working with Gab?',
};

type Action = { t: string; href?: string; go?: 'contact'; ext?: boolean };
const msg: Action = { t: 'Message Gab', go: 'contact' };
const wa: Action = { t: 'WhatsApp', href: 'https://wa.me/639661989672', ext: true };
const mail: Action = { t: 'Email', href: 'mailto:gabb.alisasis@gmail.com' };

export const QA: { id: string; q: string; a: string; act?: Action[] }[] = [
  { id: 'what', q: 'What does Gab do?', a: 'He builds the systems behind a business: CRMs, automations, email flows and web builds, then keeps them running.', act: [{ t: 'See the work', href: '/work' }, msg] },
  { id: 'ghl', q: 'Can he build my GoHighLevel setup?', a: 'That’s his home turf: 3+ years of GoHighLevel. Lead capture, nurturing, pipelines, even a whole store inside the CRM for Orange Ashes.', act: [{ t: 'Orange Ashes case', href: '/work/orange-ashes' }, msg] },
  { id: 'klaviyo', q: 'Can he fix my Klaviyo emails?', a: 'Yes. He built Kemp Beauty’s 11 flows and fixed the DMARC setup that was bouncing them. Every email is on the email page.', act: [{ t: 'See the emails', href: '/work/email-marketing' }, { t: 'Kemp Beauty case', href: '/work/kemp-beauty' }] },
  { id: 'shopify', q: 'Does he do Shopify?', a: 'Yes. 23+ landing pages and 87 reusable sections for Sell Ready AI, plus storefront pages for Kemp Beauty.', act: [{ t: 'Sell Ready AI case', href: '/work/sell-ready-ai' }, msg] },
  { id: 'app', q: 'Can he build a custom app?', a: 'Yes. Cordelia ARC runs on a React + Supabase platform he designed and built: public site, staff portal and admin back office.', act: [{ t: 'Cordelia ARC case', href: '/work/cordelia-arc' }, msg] },
  { id: 'price', q: 'What does it cost?', a: 'It depends on the build. Tell Gab what you need and he’ll reply with a quote. The form has budget ranges, from under $500 up.', act: [msg] },
  { id: 'reply', q: 'How fast does he reply?', a: 'Within 24 hours on weekdays.', act: [msg, wa] },
  { id: 'hours', q: 'What hours does he work?', a: 'US business hours: 9 AM–6 PM Eastern, Monday to Friday. He’s based in Batangas, Philippines.', act: [{ t: 'About Gab', href: '/about' }] },
  { id: 'start', q: 'How does a project start?', a: 'With a free 15-minute call. After that he just needs access to the tools involved.', act: [{ t: 'Book a call', go: 'contact' }] },
  { id: 'month', q: 'What’s the first month like?', a: 'Day 1: a 15-minute call. Week 1: audit and plan. Weeks 2–3: build and test. Week 4: live and handed over.', act: [{ t: 'How he works', href: '/about' }] },
  { id: 'clients', q: 'Who has he worked with?', a: 'Cordelia ARC, Kemp Beauty, Sell Ready AI and Orange Ashes as clients, plus roles at LiveHowYouWant and Supreme Club Tours.', act: [{ t: 'See the work', href: '/work' }] },
  { id: 'after', q: 'Does he stick around after launch?', a: 'Usually, yes. He’s still shipping for Cordelia ARC, Kemp Beauty and Sell Ready AI.', act: [{ t: 'See the work', href: '/work' }] },
  { id: 'tools', q: 'What tools does he use?', a: 'GoHighLevel, Klaviyo, Zapier and Shopify on the business side; React, TypeScript, Supabase and Python when it needs code.', act: [{ t: 'Full toolkit', href: '/about#skills' }] },
  { id: 'talk', q: 'How do we communicate?', a: 'Email, video calls, and your team’s workspace (Slack, ClickUp, Monday).', act: [msg] },
  { id: 'examples', q: 'Can I see real examples?', a: 'The work page has four case studies and the automation library. The email page shows every flow email he built.', act: [{ t: 'Work', href: '/work' }, { t: 'Emails', href: '/work/email-marketing' }] },
  { id: 'direct', q: 'Can I email him directly?', a: 'Sure: gabb.alisasis@gmail.com, or WhatsApp +63 966 198 9672.', act: [mail, wa] },
  { id: 'who', q: 'Who are you?', a: 'I’m mini Gab, Gab’s sidekick. I hang around the site, read along with you and point at the good stuff.' },
  { id: 'shoes', q: 'Nice shoes 👀', a: 'Kobe 6 Protro Grinch. Gab picked them. I just wear them well.' },
];

// the first chips on the help card, by page, case slug or spot
export const CHIPS: Record<string, string[]> = {
  home: ['what', 'ghl', 'price', 'start'],
  work: ['examples', 'clients', 'after', 'price'],
  case: ['after', 'price', 'start', 'examples'],
  'cordelia-arc': ['app', 'after', 'price', 'start'],
  'kemp-beauty': ['klaviyo', 'shopify', 'price', 'start'],
  'sell-ready-ai': ['shopify', 'after', 'price', 'start'],
  'orange-ashes': ['ghl', 'after', 'price', 'start'],
  emails: ['klaviyo', 'price', 'start', 'reply'],
  about: ['month', 'hours', 'reply', 'talk'],
  contact: ['price', 'reply', 'direct', 'start'],
};
