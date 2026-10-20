// Klaviyo flows behind /work/email-marketing. Everything here is read from the live
// accounts: subjects, preview text, waits and offers are as set in Klaviyo. Previews were
// rendered with a placeholder first name ("Alex") and every discount code masked; Kemp's
// cart emails show one real product as the sample cart.
// Steps with an `img` have a preview; the rest only appear on the flow timeline.

export interface FlowEmail {
  subject: string;
  preview?: string;         // Klaviyo preview text, or the email's opening line when it has none
  wait: string;             // delay before this step: '5m' | '3h' | '1d' …, '0' = instantly
  offer?: number;           // discount %, when the email carries one
  job?: string;             // what this email is there to do
  label?: string;           // campaigns: replaces the send-time chip ("Launch", "Last day")
  img?: string;             // /images/email/<brand>/<img>-{d,m}.webp
  d?: [number, number];     // desktop render (600px @1.5x)
  m?: [number, number];     // phone render (390px @2x)
}

export interface Flow {
  slug: string; name: string; icon: 'welcome' | 'browse' | 'site' | 'cart' | 'bag' | 'heart' | 'spark';
  kind?: 'campaign';        // a one-off campaign rather than an automated flow
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

const kemp: Brand = {
  slug: 'kemp', name: 'Kemp Beauty', initials: 'KB', tint: '#C696BA',
  sender: 'Kemp Beauty', sectorLine: 'Lashes & beauty · Shopify',
  scope: 'Every live flow',
  flows: [
    {
      slug: 'welcome', name: 'Welcome series', icon: 'welcome', startLabel: 'Signs up',
      trigger: 'Joins the email list', goal: 'Introduce the brand, teach the product and convert with a unique 10% code.',
      emails: [
        { subject: 'Welcome to Kemp Beauty - here\'s 10% off', preview: 'Performance lashes that stay on and 10% off is waiting', wait: '0', offer: 10, job: 'Welcome, with a unique 10% code', img: 'welcome-1', d: [900, 3416], m: [780, 3914] },
        { subject: 'Made for women in motion', preview: 'The story behind Kemp Beauty and founder Dana Kemp', wait: '1d', offer: 10, job: 'Brand story: who the lashes are for', img: 'welcome-2', d: [900, 2853], m: [780, 3610] },
        { subject: 'Perfect lashes in under 5 minutes', preview: 'No glue, no mess - see how easy Caris Clusters are', wait: '1d', offer: 10, job: 'How it works, in four photo steps', img: 'welcome-3', d: [900, 3494], m: [780, 5626] },
        { subject: 'Tried, tested, and trusted by our community', preview: 'Real reviews from the Kemp Beauty community', wait: '2d', offer: 10, job: 'Social proof: verified reviews', img: 'welcome-4', d: [900, 5096], m: [780, 6098] },
        { subject: 'Why you\'ll love your new lashes', preview: 'Lightweight, reusable, up to 24-hour hold', wait: '2d', job: 'Benefits, plus Dana’s favorites', img: 'welcome-5', d: [900, 3207], m: [780, 3830] },
        { subject: 'Last chance - your 10% off expires soon', preview: 'Your 10% off expires soon - don\'t miss it', wait: '2d', offer: 10, job: 'Last call on the welcome code', img: 'welcome-6', d: [900, 2937], m: [780, 3618] },
        { subject: 'A note from our founder, Dana', preview: 'Why Kemp Beauty exists - and a thank you', wait: '1d', job: 'A personal note from the founder', img: 'welcome-7', d: [900, 2286], m: [780, 4018] },
      ],
    },
    {
      slug: 'browse', name: 'Browse abandonment', icon: 'browse', startLabel: 'Views a product',
      trigger: 'Viewed a product, no checkout', goal: 'Bring browsers back with favorites and reviews before any discount.',
      emails: [
        { subject: 'Caught your eye?', preview: 'Community favorites worth a second look', wait: '4h', job: 'Community favorites worth a second look', img: 'browse-1', d: [900, 1818], m: [780, 2424] },
        { subject: 'Trusted by women in motion', preview: 'Real reviews and bestsellers inside', wait: '20h', job: 'Reviews and bestsellers', img: 'browse-2', d: [900, 2121], m: [780, 3048] },
        { subject: 'A little something for you: 10% off', preview: 'Take another look - 10% off inside', wait: '2d', offer: 10, job: 'The first offer, two days in', img: 'browse-3', d: [900, 1350], m: [780, 1800] },
      ],
    },
    {
      slug: 'cart', name: 'Abandoned cart', icon: 'cart', startLabel: 'Adds to cart',
      trigger: 'Added to cart, didn’t order', goal: 'Show the exact item left behind, and hold the discount until day two.',
      emails: [
        { subject: 'You left something beautiful behind', preview: 'Good news — your cart is saved. Your Kemp Beauty picks are lightweight, reusable, and ready when you are.', wait: '1h', job: 'Cart reminder an hour later, item shown', img: 'cart-1', d: [900, 2000], m: [780, 3912] },
        { subject: 'Your picks are waiting', preview: 'Beautiful choices! Here’s what our community says about their Kemp Beauty favorites:', wait: '11h', job: 'Reviews next to the cart item', img: 'cart-2', d: [900, 2027], m: [780, 2560] },
        { subject: 'Don\'t forget your cart', preview: 'A quick reminder of why you picked us: lightweight, reusable lashes with up to 24-hour hold — no glue, no mess, applied in under 5 minutes.', wait: '12h', job: 'Reasons to buy, then the cart', img: 'cart-3', d: [900, 2231], m: [780, 2666] },
        { subject: 'Here\'s 10% off to help you decide', preview: 'We saved your cart — and to make it easier, here’s 10% off your order.', wait: '1d', offer: 10, job: '10% off, only on day two', img: 'cart-4', d: [900, 2444], m: [780, 3320] },
        { subject: 'Last call for your cart', preview: 'Your cart — and your 10% off code — expire soon. This is our final reminder before we let your picks go.', wait: '1d', offer: 10, job: 'Final reminder before the cart expires', img: 'cart-5', d: [900, 2465], m: [780, 2820] },
      ],
    },
    {
      slug: 'checkout', name: 'Abandoned checkout', icon: 'cart', startLabel: 'Starts checkout',
      trigger: 'Started checkout, didn’t order', goal: 'Recover the order that was one step from done.',
      emails: [
        { subject: 'You\'re almost there', preview: 'Your order is saved - finish in seconds', wait: '1h', job: 'Checkout saved, finish in seconds', img: 'checkout-1', d: [900, 1847], m: [780, 2116] },
        { subject: 'Can we help with anything?', preview: 'Quick answers before you check out', wait: '23h', job: 'Answers the questions that stall a checkout', img: 'checkout-2', d: [900, 2099], m: [780, 2308] },
        { subject: '10% off - on us', preview: 'Finish your order with 10% off', wait: '1d', offer: 10, job: '10% off to finish the order', img: 'checkout-3', d: [900, 1613], m: [780, 1800] },
      ],
    },
    {
      slug: 'post', name: 'Post-purchase', icon: 'bag', startLabel: 'First order',
      trigger: 'Places a first order', goal: 'Set expectations and teach the product so the first wear goes well.',
      emails: [
        { subject: 'Thank You for Your Kemp Beauty Order', preview: 'Your shipping confirmation is next, then a few quick tips for your lashes.', wait: '0', job: 'Thank-you, and what happens next', img: 'post-1', d: [900, 5432], m: [780, 6116] },
        { subject: 'How to Apply Your Kemp Beauty Lashes', preview: 'Three moves, no glue, and they stay on for days.', wait: '2d', job: 'How to apply: curl, place, press', img: 'post-2', d: [900, 3932], m: [780, 4904] },
        { subject: 'Caring for Your Lashes + What to Expect', preview: 'Keep them dry, remove them gently, and know when to start fresh.', wait: '5d', job: 'Care guide: wear, remove, repeat', img: 'post-3', d: [900, 4889], m: [780, 6170] },
      ],
    },
    {
      slug: 'shipped', name: 'Order shipped', icon: 'bag', startLabel: 'Order ships',
      trigger: 'Order fulfilled', goal: 'Confirm the order is moving, with tracking.',
      emails: [
        { subject: 'On The Way', preview: 'Your order is on the way', wait: '0', job: 'Shipping confirmation with tracking', img: 'shipped-1', d: [900, 2303], m: [780, 3420] },
      ],
    },
    {
      slug: 'delivery', name: 'Out for delivery', icon: 'bag', startLabel: 'Out for delivery',
      trigger: 'Out for delivery', goal: 'Build excitement the day the order lands.',
      emails: [
        { subject: 'Clear a spot on the vanity', preview: 'Your Kemp Beauty order is out for delivery and should land today.', wait: '0', job: 'Arriving today, with what’s inside', img: 'delivery-1', d: [900, 1812], m: [780, 2152] },
      ],
    },
    {
      slug: 'review', name: 'Review request', icon: 'heart', startLabel: 'Delivered',
      trigger: 'Order delivered', goal: 'Ask for a review once they’ve had time to wear them.',
      emails: [
        { subject: 'How Are You Loving Your Lashes?', preview: 'It\'s been about two weeks since your Kemp Beauty order arrived, so you\'ve had time to really put your Kemp Beauty picks to the test.', wait: '14d', job: 'Review ask, two weeks after delivery', img: 'review-1', d: [900, 2267], m: [780, 2446] },
      ],
    },
    {
      slug: 'repeat', name: 'Repeat buyer', icon: 'heart', startLabel: 'Second order',
      trigger: 'Places a second order', goal: 'Thank returning customers and grow the basket.',
      emails: [
        { subject: 'Welcome back', preview: 'Thank you for the second order', wait: '2d', job: 'Thank-you for coming back', img: 'repeat-1', d: [900, 1350], m: [780, 1800] },
        { subject: 'Build your routine', preview: 'The tools that make it easier', wait: '7d', job: 'Cross-sell the tools that pair with lashes', img: 'repeat-2', d: [900, 1350], m: [780, 1800] },
      ],
    },
    {
      slug: 'reorder', name: 'Replenishment', icon: 'bag', startLabel: 'Last order',
      trigger: 'Order placed, no reorder yet', goal: 'Time the restock reminder to when a box runs out.',
      emails: [
        { subject: 'Running Low? Time to Restock', preview: 'It\'s been about a month since your last Kemp Beauty order - most of our customers are ready to restock right around now.', wait: '20d', job: 'Restock reminder with their last picks', img: 'reorder-1', d: [900, 2609], m: [780, 2846] },
        { subject: 'Don\'t Forget Your Kemp Beauty Refill', preview: 'Your go-to Caris Clusters are just a click away. Don\'t let a busy week turn into an empty lash case.', wait: '15d', job: 'Second restock nudge', img: 'reorder-2', d: [900, 1976], m: [780, 2834] },
        { subject: '10% Off Your Next Order', preview: 'Because you\'re part of the Kemp Beauty community, here\'s 10% off to make restocking even easier.', wait: '15d', offer: 10, job: '10% off the reorder', img: 'reorder-3', d: [900, 1814], m: [780, 2260] },
      ],
    },
    {
      slug: 'winback', name: 'Win-back', icon: 'heart', startLabel: 'Goes quiet',
      trigger: 'Enters the lapsed-customer segment', goal: 'Bring lapsed customers back, and ask why if they don’t.',
      emails: [
        { subject: 'We Miss You at Kemp Beauty', preview: 'It\'s been a while. Come see what\'s new at Kemp Beauty.', wait: '0', job: '“We miss you”, and what’s new', img: 'winback-1', d: [900, 3944], m: [780, 4424] },
        { subject: 'Here\'s 10% Off to Welcome You Back', preview: 'Here\'s 10% off your next order, on us.', wait: '2d', offer: 10, job: '10% off to come back', img: 'winback-2', d: [900, 2963], m: [780, 3330] },
        { subject: 'Last Chance: Your 10% Off Expires Soon', preview: 'Your 10% off is still waiting.', wait: '3d', offer: 10, job: 'Last chance, plus a request for feedback', img: 'winback-3', d: [900, 1938], m: [780, 2472] },
      ],
    },
    {
      slug: 'halloween', name: 'Halloween sale', icon: 'spark', kind: 'campaign', startLabel: 'Campaign',
      trigger: 'Campaign to the list', goal: 'A three-email Halloween sale: 20% off sitewide, closing at midnight.',
      emails: [
        { subject: 'All treats. 20% off.', preview: 'Your Halloween look deserves a little extra glam. Get 20% off everything you need to make it happen.', wait: '0', offer: 20, job: 'Launch: 20% off sitewide', label: 'Launch', img: 'halloween-1', d: [900, 2921], m: [780, 4616] },
        { subject: 'Scary good glam. 20% less.', preview: 'Go sweet, spooky or full drama. Pick your lashes, add your color and save 20% on every finishing touch.', wait: '0', offer: 20, job: 'Product picks, each marked 20% off', label: 'Mid-sale', img: 'halloween-2', d: [900, 3446], m: [780, 3852] },
        { subject: '20% off disappears at midnight', preview: 'One last treat before the sale vanishes. Get 20% off sitewide before midnight.', wait: '0', offer: 20, job: 'Final hours, before midnight', label: 'Last day', img: 'halloween-3', d: [900, 3398], m: [780, 3514] },
      ],
    },
  ],
};


export const brands: Brand[] = [kemp, hh];

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
