// Klaviyo flows behind /work/email-marketing. Everything here is read from the live
// accounts: subjects, preview text, waits and offers are as set in Klaviyo. Previews were
// rendered with a placeholder first name ("Alex") and every discount code masked.
// Steps with an `img` have a preview; the rest only appear on the flow timeline.

export interface FlowEmail {
  subject: string;
  preview?: string;         // Klaviyo preview text, or the email's opening line when it has none
  wait: string;             // delay before this step: '5m' | '3h' | '1d' …, '0' = instantly
  offer?: number;           // discount %, when the email carries one
  job?: string;             // what this email is there to do
  img?: string;             // /images/email/<brand>/<img>-{d,m}.webp
  d?: [number, number];     // desktop render (600px @1.5x)
  m?: [number, number];     // phone render (390px @2x)
}

export interface Flow {
  slug: string; name: string; icon: 'welcome' | 'browse' | 'site' | 'cart' | 'bag' | 'heart';
  trigger: string; goal: string; startLabel: string;
  emails: FlowEmail[];
}

export interface Brand {
  slug: string; name: string; initials: string; tint: string;
  sender: string; sectorLine: string; scope: string;
  flows: Flow[];
}

const hh: Brand = {
  slug: 'hh', name: 'The Healthy Hand', initials: 'HH', tint: '#8DC63F',
  sender: 'THE HEALTHY HAND', sectorLine: 'Wellness products · Shopify',
  scope: 'Best of each flow',
  flows: [
    {
      slug: 'welcome', name: 'Welcome series', icon: 'welcome', startLabel: 'Signs up',
      trigger: 'Joins the email list', goal: 'Turn a new subscriber into a first order inside 48 hours.',
      emails: [
        { subject: 'RE: Discount code unlocked! 💌', preview: 'Welcome To The Family', wait: '0', offer: 10,
          job: 'Welcome and a 10% first-order code', img: 'welcome-1', d: [900, 2505], m: [780, 2742] },
        { subject: 'We invite you to join our community! 😉', preview: "Let's Stay Connected", wait: '1d', offer: 10,
          job: 'Community: follow, share a photo, win a gift', img: 'welcome-2', d: [900, 2553], m: [780, 2822] },
        { subject: 'RE: 10% OFF will expire in just 24 hours! 📬', preview: 'OPEN Now & SAVE BIG', wait: '1d', offer: 10,
          job: 'Last call, with a live countdown timer', img: 'welcome-3', d: [900, 2280], m: [780, 2488] },
      ],
    },
    {
      slug: 'browse', name: 'Browse abandonment', icon: 'browse', startLabel: 'Views a product',
      trigger: 'Viewed a product, no checkout', goal: 'Bring browsers back to what they were looking at.',
      emails: [
        { subject: 'Did you see something you liked?', preview: 'We notice you’ve been looking at some of our The Healthy Hand items recently, And we don’t want you to miss out.', wait: '30m', offer: 10,
          job: 'Soft nudge 30 minutes later, 10% off', img: 'browse-1', d: [900, 2358], m: [780, 2698] },
        { subject: 'Don’t leave a good thing behind', wait: '6h', offer: 10 },
        { subject: 'You Have Great Taste', wait: '1d', offer: 10 },
        { subject: 'Come back before they sell out!', preview: 'We noticed you liked some of our items. Why not treat yourself to something new? You deserve it.', wait: '2d', offer: 15,
          job: 'The offer steps up to 15%', img: 'browse-4', d: [900, 2300], m: [780, 2648] },
        { subject: 'Don’t Miss Out, coupon inside', wait: '1d', offer: 15 },
        { subject: 'Last reminder on the items you left behind', wait: '1d', offer: 15 },
        { subject: 'Having trouble choosing?', wait: '3d', offer: 20 },
        { subject: 'You’ve got great taste', wait: '8d', offer: 20 },
        { subject: 'Are you still thinking about…', preview: 'We noticed that you were browsing around our store, but didn’t order 😔.', wait: '3d', offer: 20,
          job: 'Final touch: offers help, plus 20% off', img: 'browse-9', d: [900, 2519], m: [780, 2886] },
      ],
    },
    {
      slug: 'site', name: 'Site abandonment', icon: 'site', startLabel: 'Visits the site',
      trigger: 'Active on site, then leaves', goal: 'Catch visitors who left before picking anything.',
      emails: [
        { subject: '🔔 Can’t decide?', preview: 'We can help you! Take 15% off using the code below at checkout and enjoy a 15% discount on your next order.', wait: '0', offer: 15,
          job: 'One email, one reason to come back: 15% off', img: 'site-1', d: [900, 2199], m: [780, 2494] },
      ],
    },
    {
      slug: 'checkout', name: 'Abandoned checkout', icon: 'cart', startLabel: 'Starts checkout',
      trigger: 'Started checkout, didn’t order', goal: 'Recover the order that was one click away.',
      emails: [
        { subject: 'RE: Your Order uA716PWR 🛒', preview: 'You didn’t forget about us, did you? We saved all of the great items you’ve added to your cart so when you’re ready to buy, simply complete your purchase.', wait: '5m', offer: 10,
          job: 'Cart reminder 5 minutes after drop-off', img: 'checkout-1', d: [900, 2330], m: [780, 2658] },
        { subject: 'It looks like you left something behind…', wait: '3h', offer: 10 },
        { subject: 'Get your cart for less, Alex', wait: '19h', offer: 15 },
        { subject: 'Don’t miss out on 15% off your cart!', preview: 'Thousands of new customers are ordering The Healthy Hand products. Every day - so many, that we can’t keep your items in stock.', wait: '1d', offer: 15,
          job: 'Social proof and scarcity, offer up to 15%', img: 'checkout-4', d: [900, 2573], m: [780, 2848] },
        { subject: '[Action Required]: Missing Shipping Information', wait: '3d', offer: 20 },
        { subject: 'How about 20% off your bag?', wait: '1d', offer: 20 },
        { subject: 'Was there a problem checking out?', wait: '2d', offer: 20 },
        { subject: 'Still thinking it over, Alex?', preview: 'The founder of the The Healthy Hand here ❤️, I noticed you did not finish checkout nor use the special 20% discount code that we gave you…', wait: '8d', offer: 20,
          job: 'Founder’s note reactivating the cart at 20%', img: 'checkout-8', d: [900, 2465], m: [780, 2886] },
        { subject: 'Need help with completing your purchase?', wait: '3d', offer: 20 },
      ],
    },
    {
      slug: 'post', name: 'Post-purchase', icon: 'bag', startLabel: 'Places an order',
      trigger: 'Placed an order', goal: 'Turn a first order into a second one.',
      emails: [
        { subject: '👋 Welcome to the The Healthy Hand Family!', preview: 'Thank you for your purchase from us yesterday. We appreciate your business, and are excited to have you join our community!', wait: '1d', offer: 10,
          job: 'Thank-you, with 10% off the next order', img: 'post-1', d: [900, 2358], m: [780, 2728] },
        { subject: '🙌 Alex, A token of our appreciation', preview: 'The 10% off coupon code expires today! For the next 24 hours only, use the code below…', wait: '1d', offer: 10,
          job: '24-hour expiry on the thank-you code', img: 'post-2', d: [900, 2306], m: [780, 2588] },
        { subject: 'LAST CHANCE! Only few hours left!', wait: '1d' },
        { subject: 'Once is never twice is always', preview: 'We have a very low stock, and our best sellers won’t be around forever. make an order before they’re gone!', wait: '3d', offer: 15,
          job: 'Low-stock urgency, 15% off the next order', img: 'post-4', d: [900, 2373], m: [780, 2588] },
        { subject: 'Just for you 15% off your next order', wait: '1d', offer: 15 },
        { subject: 'LAST CHANCE! Only 12 hours left! 🚨', wait: '1d' },
        { subject: 'Gift from us to you, Expires in 3 Days', wait: '3d' },
        { subject: '20% coupon code expires at midnight', wait: '2d', offer: 20 },
        { subject: 'Coupon code reactivated for the next 24h 🔔', wait: '8d' },
      ],
    },
    {
      slug: 'winback', name: 'Win-back', icon: 'heart', startLabel: 'Last order',
      trigger: '30 days after the last order', goal: 'Re-activate customers who have gone quiet.',
      emails: [
        { subject: '10% off. Because we miss you ❤️', preview: 'It’s been a while since you’ve shopped, And a lot has changed since then.', wait: '30d', offer: 10,
          job: '“We missed you”, with 10% to come back', img: 'winback-1', d: [900, 2364], m: [780, 2680] },
        { subject: '⏳LAST DAY: Get 10% off everything…', preview: 'The 10% off coupon code expires today! For the next 24 hours only, use the code below…', wait: '1d', offer: 10,
          job: 'Last-day reminder on the comeback code', img: 'winback-2', d: [900, 2306], m: [780, 2588] },
        { subject: 'Only few hours left to save 10%🚨', wait: '1d', offer: 10 },
        { subject: 'You’ll hate to miss this one', wait: '3d' },
        { subject: '⏳LAST DAY: Get 15% off everything…', wait: '1d', offer: 15 },
        { subject: 'Only few hours left to save 15%🚨', wait: '1d', offer: 15 },
        { subject: 'A good deal is always good news', wait: '3d' },
        { subject: 'RE: 20% OFF will expire in just 24 hours! 📬', wait: '2d', offer: 20 },
        { subject: 'Code reactivated for the next 24h 🔔', preview: 'The founder of the The Healthy Hand here ❤️. I noticed you did not use your special 20% off coupon code below till it expires, But I have good news for you.', wait: '8d', offer: 20,
          job: 'Founder’s note reactivating 20% for 24 hours', img: 'winback-9', d: [900, 2363], m: [780, 2728] },
      ],
    },
  ],
};

export const brands: Brand[] = [hh];

/** Hours a wait string adds: '30m' → 0.5, '3h' → 3, '2d' → 48, '0' → 0. */
export const waitHours = (w: string) => {
  const n = parseFloat(w) || 0;
  return w.endsWith('m') ? n / 60 : w.endsWith('h') ? n : w.endsWith('d') ? n * 24 : 0;
};

/** Hours from the trigger to each email in a flow. */
export const timeline = (f: Flow) => {
  let t = 0;
  return f.emails.map((e) => (t += waitHours(e.wait)));
};

/** Short label for time since the trigger: 'Instantly', '5 min', '3 h', 'Day 2'. */
export const atLabel = (h: number) =>
  h === 0 ? 'Instantly' : h < 1 ? `${Math.round(h * 60)} min` : h < 24 ? `${Math.round(h)} h` : `Day ${Math.round(h / 24)}`;

/** Readable wait for the reading pane: '5 minutes after', '1 day after'. */
export const waitLabel = (w: string) => {
  if (w === '0') return 'Sent instantly';
  const n = parseFloat(w), u = w.slice(-1);
  const word = u === 'm' ? 'minute' : u === 'h' ? 'hour' : 'day';
  return `${n} ${word}${n === 1 ? '' : 's'} later`;
};
