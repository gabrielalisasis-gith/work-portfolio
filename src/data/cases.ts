export interface Case {
  slug: string; client: string; sector: string; url: string; featured?: boolean; wide?: boolean;
  tags: string; img: string; w: number; h: number;
  headline: string; summary: string; intro: string; quote: string; alt: string;
  details: [string, string][]; metrics: [string, string][]; stack: string[];
  ongoing?: { summary: string; items: string[] };
}

export const cases: Case[] = [
  {
    slug: 'cordelia-arc',
    ongoing: {"summary": "The platform keeps growing with the agency. I continue to ship new features and refinements across the public site, the compliance portal and the admin back office.", "items": ["New features across the admin back office", "Workflow and form improvements for staff", "UI and usability refinements platform-wide", "Fixes, hardening and ongoing maintenance"]},
    intro: "A California supportive-living agency serving adults with intellectual disabilities across Alameda and Contra Costa counties. What began as a marketing site became the software the agency runs on – referrals, hiring, compliance, and billing.",
    quote: "The same referral and intake operations I usually automate inside a CRM – this time built as an actual application.",
    details: [["Sector", "Healthcare · HIPAA-regulated"], ["Stack", "React · TypeScript · Supabase"], ["Scale", "91 migrations · ~50 edge functions"], ["Surface", "40+ routed pages"]],
    alt: "Cordelia ARC homepage showing the headline Compassionate Care for Brighter Futures over a photo of a caregiver with a client", client: 'Cordelia ARC', sector: 'Healthcare · HIPAA-regulated', url: 'cordeliaarc.com', featured: true,
    tags: 'apps', img: 'cordelia-arc-home', w: 1200, h: 750,
    headline: 'Replaced four disconnected systems with one platform the agency runs on',
    summary: 'A California supportive-living agency ran on a brochure site, paper onboarding packets and hand-tracked referrals. I built one React + Supabase platform for referrals, hiring, compliance and billing — onboarding is now a link, not a packet.',
    metrics: [['4 → 1', 'systems unified'], ['40+', 'routed pages'], ['~50', 'edge functions'], ['91', 'database migrations']],
    stack: ['React', 'TypeScript', 'Supabase', 'E-signature'],
  },
  {
    slug: 'kemp-beauty',
    ongoing: {"summary": "The deliverability fix was the start. I've stayed on for Kemp Beauty's storefront and marketing work, shipping improvements on a continuing basis.", "items": ["UI/UX improvements across the storefront", "New landing pages, including a team affiliate page", "Product and content page refinements", "Fixes and continuous iteration on the live theme"]},
    intro: "A DTC lash brand with eight live Klaviyo flows and a storefront that needed real product-page work. The flows all showed green in the dashboard. Almost none of the email was reaching anyone.",
    quote: "All eight flows showed live. None of them were being delivered.",
    details: [["Sector", "DTC beauty · Shopify"], ["Scope", "Deliverability · theme dev"], ["Fixed", "26 messages across 8 flows"], ["Root cause", "DMARC p=reject, unsigned domain"]],
    alt: "Kemp Beauty homepage hero reading Imagine waking up with perfect lashes over a close-up beauty photograph", client: 'Kemp Beauty', sector: 'DTC beauty · Shopify', url: 'kempbeauty.com',
    tags: 'email shopify', img: 'kemp-beauty-home', w: 1200, h: 750,
    headline: 'Found why 8 “live” email flows were reaching almost no one — and fixed it',
    summary: 'Every Klaviyo flow showed green while a DMARC reject policy bounced the mail. I moved 26 messages to an authenticated sender and verified delivery on a live signup.',
    metrics: [['8', 'flows recovered'], ['26', 'emails re-authenticated'], ['0', 'bounces on live test']],
    stack: ['Klaviyo', 'DNS · DMARC', 'Shopify Liquid'],
  },
  {
    slug: 'sell-ready-ai',
    ongoing: {"summary": "I continue to maintain and extend the site as the business grows, with every change tracked in Git against the live theme.", "items": ["Mobile UX improvements, including mobile filtering", "New sections and page updates", "Ongoing fixes and polish across templates"]},
    intro: "An AI-systems consultancy whose Shopify theme had to behave like a full marketing site: two dozen service and resource pages, a searchable podcast archive, and a video-led homepage – all in Liquid.",
    quote: "Shopify gives you a storefront. Everything that makes this feel like a content platform had to be built.",
    details: [["Sector", "B2B consultancy"], ["Stack", "Shopify Liquid · JS · CSS"], ["Scale", "87 sections · 23 templates"], ["Built", "Podcast archive, search, tags"]],
    alt: "Sell Ready AI homepage with the headline Scale Beyond Bottlenecks and a website-input call to action over a blue gradient", client: 'Sell Ready AI', sector: 'B2B consultancy', url: 'sellready.ai',
    tags: 'shopify', img: 'sell-ready-ai-home', w: 1200, h: 750,
    headline: 'Turned a Shopify theme into a full marketing site and podcast platform',
    summary: 'Twenty-three bespoke landing pages and a searchable podcast archive, composed from a library of Liquid sections — every change tracked in Git against the live theme.',
    metrics: [['23', 'landing pages'], ['87', 'Liquid sections'], ['1', 'searchable podcast archive']],
    stack: ['Shopify Liquid', 'JavaScript', 'Git'],
  },
  {
    slug: 'orange-ashes', wide: true,
    intro: "A digital product shop serving Pampered Chef consultants, built and maintained end to end in GoHighLevel – store, checkout, fulfilment, branded email, and a hand-coded front-end layer on top.",
    quote: "GoHighLevel wasn't designed to be a storefront. Making it behave like one meant overriding it where it pushed back.",
    details: [["Sector", "Digital products · e-commerce"], ["Stack", "GoHighLevel · HTML/CSS/JS"], ["Catalogue", "9 collections · 24 products"], ["Email", "Mailgun-authenticated domain"]],
    alt: "Orange Ashes storefront homepage, a digital product shop styled in clay orange, amber and cream", client: 'Orange Ashes', sector: 'Digital products · e-commerce', url: 'shop.orangeashes.com',
    tags: 'ghl', img: 'orange-ashes-home', w: 1200, h: 649,
    headline: 'Built a digital-product store inside GoHighLevel that delivers every order instantly',
    summary: 'Store, checkout, fulfilment and branded email, all inside the client’s CRM — with hand-coded front-end overrides where GoHighLevel’s store fell short.',
    metrics: [['24', 'products live'], ['9', 'collections'], ['0', 'manual fulfilment steps']],
    stack: ['GoHighLevel', 'Mailgun', 'HTML · CSS · JS'],
  },
];

export const caseIndex = (slug: string) => cases.findIndex((c) => c.slug === slug);

export interface Role {
  client: string; role: string; dates: string; sector: string; url: string; tags: string;
  img: string; w: number; h: number; alt: string;
  headline: string; summary: string; metrics: [string, string][]; stack: string[];
}

export const roles: Role[] = [
  {
    client: 'LiveHowYouWant', role: 'Operations Support Analyst', dates: 'Mar 2025 – Jun 2026', sector: 'Festivals & travel · USA',
    url: 'livehowyouwant.com', tags: 'ghl', img: 'xp-livehowyouwant', w: 1200, h: 760,
    alt: 'Live How You Want homepage – the CRM and community platform',
    headline: 'Scaled online communities from 900 to 36,000+ members in 8 months',
    summary: 'Ran the GoHighLevel CRM, workflows, forms and automations day to day, maintained Bubble backend workflows and customer data, and kept operations smooth as the community grew.',
    metrics: [['36,000+', 'community members'], ['8 mo', 'from 900 members']],
    stack: ['GoHighLevel', 'Bubble', 'Operations'],
  },
  {
    client: 'Supreme Club Tours', role: 'Marketing Automation Specialist', dates: 'Oct 2024 – Aug 2025', sector: 'Nightlife & events · Las Vegas',
    url: 'supremeclubtours.com', tags: 'ghl', img: 'xp-supreme-club-tours', w: 1200, h: 675,
    alt: 'Supreme Club Tours homepage – Las Vegas nightlife and events booking site',
    headline: 'Automated lead capture and nurturing through growth to 3,000+ customers',
    summary: 'Built GoHighLevel automations for lead capture, nurturing and customer communication, managed CRM operations, and supported partnerships with brands including Insomniac.',
    metrics: [['3,000+', 'customers'], ['5 mo', 'to get there']],
    stack: ['GoHighLevel', 'CRM ops', 'Campaign design'],
  },
  {
    client: 'BSU STEER HUB', role: 'Front-End Developer', dates: 'Apr 2023 – Sep 2023', sector: 'University web app · Philippines',
    url: 'steerhub.batstateu.edu.ph', tags: 'apps', img: 'xp-steer-hub', w: 1200, h: 676,
    alt: 'BSU STEER HUB homepage – the university web application I helped develop',
    headline: 'Built and tested real-time features for a university web application',
    summary: 'Developed and tested real-time features, improved UI functionality and usability, and kept responsive front-end components performing well.',
    metrics: [['Real-time', 'app features'], ['Responsive', 'UI components']],
    stack: ['JavaScript', 'Front-end', 'Analytics'],
  },
];
