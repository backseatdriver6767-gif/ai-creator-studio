/**
 * ─────────────────────────────────────────────────────────────
 *  By Emma Catherine — site content
 * ─────────────────────────────────────────────────────────────
 *  This is the ONE file you edit to make the site yours.
 *  No design or code knowledge needed — just change the text,
 *  swap the image paths, and add/remove pieces from `works`.
 *
 *  To add a real artwork:
 *    1. Drop the image file into  /public/art/  (jpg, png, or webp)
 *    2. Point `image` at it, e.g.  image: "/art/still-morning.jpg"
 *    3. Fill in title / year / medium / size.
 *  The placeholder .svg files can be deleted once real art is in.
 * ─────────────────────────────────────────────────────────────
 */

export const artist = {
  /** Shown as the wordmark in the header and hero. */
  name: "Emma Catherine",
  wordmark: "By Emma Catherine",
  /** One quiet line under the name in the hero. */
  tagline: "Paintings, drawings, and quiet things made by hand.",
  /** The short artist statement in the About section. Speak plainly. */
  statement: [
    "I make work about the ordinary hours — light on a wall, the shape of a morning, the small stillness before a day begins.",
    "This is where I keep it, and where I let it go. Most pieces here are one of one. If something stays with you, it can come home with you — but mostly I just want you to look.",
  ],
  /** Optional: where you're based. Leave "" to hide. */
  location: "",
  /** The email inquiries and collection requests are sent to. */
  email: "backseatdriver6767@gmail.com",
};

/**
 * Social links — the whole point is exposure, so these live
 * front and center. Delete any you don't use; add your own.
 * `handle` is what's shown; `url` is where it goes.
 */
export const socials: { label: string; handle: string; url: string }[] = [
  { label: "Instagram", handle: "@emmacatherine", url: "https://instagram.com/" },
  { label: "TikTok", handle: "@emmacatherine", url: "https://tiktok.com/" },
  { label: "Pinterest", handle: "Emma Catherine", url: "https://pinterest.com/" },
];

/**
 * How you'd like collecting to feel. This copy sits in the
 * "Collect" section — understated on purpose.
 */
export const collecting = {
  heading: "Taking a piece home",
  body:
    "Originals are one of one. Prints of select works are made to order on archival paper. There's no cart and no rush — send a note about the piece you love and I'll tell you what's available, price, and how it travels to you.",
  /** Set to false to hide prices everywhere and keep it inquiry-only. */
  showPrices: true,
  /** The label on the quiet buttons. */
  inquireLabel: "Ask about this piece",
};

export type Work = {
  id: string;
  title: string;
  year: string;
  medium: string;
  size: string;
  /** "" while a piece is placeholder; a price like "$450" once set. */
  price?: string;
  /** true = original still available; false = sold / not for sale. */
  available: boolean;
  /** Path under /public. Swap the placeholder for your real image. */
  image: string;
  /** Optional one-line note shown in the detail view. */
  note?: string;
};

/**
 * Your gallery. Order here = order on the page.
 * These six are placeholders so you can see the layout —
 * replace them with your work one at a time.
 */
export const works: Work[] = [
  {
    id: "first-light",
    title: "First Light",
    year: "2025",
    medium: "Oil on linen",
    size: '24 × 30 in',
    price: "$680",
    available: true,
    image: "/art/placeholder-1.svg",
    note: "Placeholder — replace with your painting.",
  },
  {
    id: "held",
    title: "Held",
    year: "2025",
    medium: "Graphite & wash on paper",
    size: '18 × 24 in',
    price: "$320",
    available: true,
    image: "/art/placeholder-2.svg",
    note: "Placeholder — replace with your drawing.",
  },
  {
    id: "the-long-afternoon",
    title: "The Long Afternoon",
    year: "2024",
    medium: "Acrylic on panel",
    size: '36 × 36 in',
    price: "$1,200",
    available: false,
    image: "/art/placeholder-3.svg",
    note: "Placeholder — this one is marked sold, as an example.",
  },
  {
    id: "quiet-study",
    title: "Quiet Study",
    year: "2025",
    medium: "Watercolor",
    size: '11 × 14 in',
    price: "$180",
    available: true,
    image: "/art/placeholder-4.svg",
    note: "Placeholder — replace with your work.",
  },
  {
    id: "everything-that-stays",
    title: "Everything That Stays",
    year: "2024",
    medium: "Mixed media on canvas",
    size: '30 × 40 in',
    price: "$940",
    available: true,
    image: "/art/placeholder-5.svg",
    note: "Placeholder — replace with your work.",
  },
  {
    id: "before-the-day",
    title: "Before the Day",
    year: "2025",
    medium: "Oil on paper",
    size: '16 × 20 in',
    price: "$420",
    available: true,
    image: "/art/placeholder-6.svg",
    note: "Placeholder — replace with your work.",
  },
];
