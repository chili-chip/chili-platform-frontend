export interface HelpTopic {
  slug: string;
  title: string;
  summary: string;
}

export interface HelpArticle {
  slug: string;
  topic: string;
  title: string;
  /** One or two sentences, shown on the index and used by search. */
  summary: string;
  /** Markdown. Start internal links with `/` and they navigate inside the app. */
  body: string;
  /** Slugs of related articles. */
  related?: string[];
}

/** Platform user help, not the engineering docs: link out to chilichip.eu for hardware details. */
export const DOCS_URL = 'https://chilichip.eu';

export const HELP_TOPICS: readonly HelpTopic[] = [
  { slug: 'getting-started', title: 'Getting started', summary: 'Your account and settings.' },
  { slug: 'store', title: 'Store and checkout', summary: 'Buying vgc zero hardware.' },
  { slug: 'marketplace', title: 'Marketplace', summary: 'Buying, selling, and playing games.' },
  { slug: 'creator', title: 'Creator', summary: 'Making games in the browser.' },
  { slug: 'community', title: 'Community', summary: 'The forum.' },
  { slug: 'hardware', title: 'Hardware', summary: 'The vgc zero and where to learn more.' },
];

export const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    slug: 'create-an-account',
    topic: 'getting-started',
    title: 'Create an account and verify your email',
    summary: 'Sign up, confirm your email address, and see what you can do before and after.',
    body: `
## Sign up

1. Open [Join](/register) and choose a username, an email address, and a password.
2. Accept the terms of service and privacy policy. You need to do this to create an account.
3. Check your inbox for the verification link and open it.

The email address has to be one you can open, because that is where the verification link goes.

## What you can do before you verify

You can sign in and browse. Until your email address is verified you **cannot**:

- post on the forum,
- save or change a game in the creator,
- release or list a game, or
- check out.

While your account is unverified, a banner at the top of the site reminds you and links to a page where you can send yourself a new link.

## Didn't get the email?

See [Fix sign-in and verification problems](/help/sign-in-problems).
`,
    related: ['sign-in-problems', 'account-settings'],
  },
  {
    slug: 'sign-in-problems',
    topic: 'getting-started',
    title: 'Fix sign-in and verification problems',
    summary: 'Resend the verification email, reset a forgotten password, or sign in again.',
    body: `
## I didn't get the verification email

1. Check your spam folder.
2. Make sure you are signed in, then open [Verify email](/verify-email) and choose **Send a new link**. The banner at the top of the site links to the same page.
3. If the address is wrong, change it in [Settings](/settings), under **Account**.

A verification link can expire. If it says it is invalid or expired, send a new one.

## I forgot my password

Open [Forgot password](/forgot-password), enter your email address, and follow the link in the email. The link opens a page where you choose a new password.

## I can't sign in

Check that you typed your username and password correctly. If it still fails, reset your password as above.
`,
    related: ['create-an-account', 'account-settings'],
  },
  {
    slug: 'account-settings',
    topic: 'getting-started',
    title: 'Manage your profile and account settings',
    summary: 'Where to change your profile, avatar, email, password, preferences, and privacy.',
    body: `
Open [Settings](/settings) when you are signed in. It has four sections:

- **Profile**: your avatar, display name (up to 50 characters, shown instead of your username), and bio (up to 500 characters). Your username can't be changed here.
- **Account**: your email address and your password. Changing your email sends a confirmation link to the new address.
- **Preferences**: language (English or Polski), appearance (System, Light, or Dark), and whether you get the newsletter.
- **Privacy**: choose whether your public profile shows your bio, when you joined, and your released games. Your orders and your library are always private.

Each section saves on its own, and a message tells you whether the save worked.
`,
    related: ['create-an-account', 'sign-in-problems'],
  },
  {
    slug: 'buy-hardware',
    topic: 'store',
    title: 'Buy hardware from the store',
    summary: 'Add items to your cart, review the order, and pay with Stripe Checkout.',
    body: `
## Place an order

1. Open the [Store](/store) and add what you want to your cart.
2. Open your cart and choose **Review order**. Confirm the quantities here.
3. Sign in if you are asked to. You need a verified account to check out.
4. Pay on the next screen. **Stripe Checkout** collects your payment and your shipping details.
5. When the payment goes through, you land on your order page.

If you cancel at Stripe, the charge is not completed and your cart is still there.

## Test payments

While payments are in test mode, Stripe's test card number \`4242 4242 4242 4242\` works with any future expiry date and any three-digit security code. No real money moves in test mode. Once payments are live, use a real card.

## Something went wrong

If the payment does not complete, you can try again from your cart. If you think you were charged but see no order, check [your order status](/help/order-status) first. If it is still missing, ask in the [forum](/community).
`,
    related: ['order-status', 'create-an-account'],
  },
  {
    slug: 'order-status',
    topic: 'store',
    title: 'Track your hardware order',
    summary: 'What the payment and shipping statuses on your order page mean.',
    body: `
Each hardware order has an order page with two badges: a **payment status** and a **shipping status**.

## Payment status

- **Pending**: the payment is not confirmed yet. If you just paid, refresh the page in a moment.
- **Paid**: the payment went through and the order is waiting to ship.
- **Fulfilled**: the order has shipped.
- **Canceled** or **Failed**: the order was not completed.

## Shipping status

- **Awaiting payment**: nothing ships until payment is confirmed.
- **Preparing to ship**: the order is paid and is being packed.
- **Shipped**: the order is on its way.
- **Not shipping**: the order was canceled or failed, so nothing will be sent.

Your orders are also listed in the **Orders** tab of your profile, and only you can see them.
`,
    related: ['buy-hardware'],
  },
  {
    slug: 'buy-games',
    topic: 'marketplace',
    title: 'Browse, buy, and play games',
    summary: 'Find a game, get it, and find it again in your library.',
    body: `
## Find a game

Open the [Marketplace](/marketplace). You can search by game, tag, or creator, and narrow the list by category.

## Get a game

Open a game's page. Paid games show **Buy** and free games show **Get**. You need to be signed in with a verified account.

- For a paid game, you pay by card through Stripe Checkout. When the payment completes the game is added to your library straight away.
- A free game is added to your library right away.

## Play it

Games you own have a **Play** button, and you can also **Download .bitsy** to keep the file. Your games live in the **Library** tab of your profile, on the **Bought** shelf.

## Rate a game

Once a game is in your library you can rate it from one to five stars, with an optional comment. You can rate a game once.
`,
    related: ['sell-a-game', 'create-an-account'],
  },
  {
    slug: 'sell-a-game',
    topic: 'marketplace',
    title: 'List a game for sale',
    summary: 'Release a game, list it, and get paid.',
    body: `
Selling takes three steps: make the game, release it, and list it.

## 1. Make the game

Build it in the [Creator](/creator). See [Make a game with the Creator](/help/make-a-game).

## 2. Release it

A project cannot be sold. When a game is ready, open your profile, go to **Library**, then the **My games** shelf, and choose **Release** on the project. Releasing keeps the Bitsy file and keeps the game off the marketplace until you list it.

## 3. List it

Open your released game from your profile and choose **Listing**. Pick the game, set the price, and publish it.

- **Price**: free, or at least €1 in euros.
- **Seller terms**: you accept the [marketplace seller terms](/seller-terms) before your first listing.
- You can update or unlist a game later.

You need a verified email address to release or list a game.

## Getting paid

Your sales are on the [Sales](/marketplace/sales) page. The seller terms are the full rules. In short:

- Chili keeps 20% of the game price, plus an estimate of the card processing cost.
- Earnings are held for 7 days.
- After the hold, cleared earnings are transferred once they reach at least €20, and only after you finish payout setup with Stripe.
- Sales count before you set up payouts.
- Refunds and disputes are handled by Chili and can reduce your earnings. See the seller terms for details.
`,
    related: ['make-a-game', 'buy-games'],
  },
  {
    slug: 'make-a-game',
    topic: 'creator',
    title: 'Make a game with the Creator',
    summary: 'Build a game in the browser, how it saves, and what to do when it is ready.',
    body: `
The [Creator](/creator) is a Bitsy-based game editor that runs in your browser. You need to be signed in, and your email address needs to be verified to save a game.

## Saving

Changes save automatically. The editor shows whether it is saving, saved, or could not save. If a save fails, you see a message, and the editor tries again on your next edit.

Your games appear on your profile as projects.

## Remove a game

You can remove a game from your profile from the editor, or from your profile. You are asked to confirm first.

## When it is ready

To sell a game, release it and list it. See [List a game for sale](/help/sell-a-game).
`,
    related: ['sell-a-game'],
  },
  {
    slug: 'forum-basics',
    topic: 'community',
    title: 'Forum basics',
    summary: 'Read threads, start a thread, and reply.',
    body: `
The [Community](/community) page is the forum, for hardware threads, game-dev logs, and marketplace talk.

## Read

Anyone can read threads, signed in or not. Use the board buttons at the top to show one board at a time, or **All** to show everything. Open a thread to read the replies.

## Post and reply

Sign in, then choose **Create New Post**. Give it a title, pick a board, write your post, and publish. Open any thread to add a reply.

You need a verified email address to post or reply. See [Create an account and verify your email](/help/create-an-account).
`,
    related: ['create-an-account'],
  },
  {
    slug: 'about-the-hardware',
    topic: 'hardware',
    title: 'About the vgc zero hardware',
    summary: 'What the store sells and where the technical documentation lives.',
    body: `
The [Store](/store) sells kits, shells, and parts for the vgc zero.

This help center covers using the platform. For hardware specifications, assembly, and technical documentation, see the Chilichip site at [chilichip.eu](https://chilichip.eu). Those pages are the source of truth, so we do not repeat the specs here.

For ordering questions, see [Buy hardware from the store](/help/buy-hardware) and [Track your hardware order](/help/order-status).
`,
    related: ['buy-hardware', 'order-status'],
  },
];
