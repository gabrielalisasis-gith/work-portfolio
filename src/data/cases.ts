export interface Case {
  slug: string; client: string; sector: string; url: string; featured?: boolean; wide?: boolean;
  tags: string; img: string; w: number; h: number;
  headline: string; summary: string; intro: string; quote: string; alt: string;
  details: [string, string][]; metrics: [string, string][]; stack: string[];
}

export const cases: Case[] = [
  {
    slug: 'cordelia-arc',
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
