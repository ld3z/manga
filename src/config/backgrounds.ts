interface BackgroundImage {
  url: string;
  title: string;
  artist: string;
  source: string;
  socials?: {
    name: string;
    link: string;
  }[];
}

export const backgrounds: BackgroundImage[] = [
  {
    url: '/citali.webp',
    title: "Citlali (Genshin Impact)",
    artist: "ryrmcher",
    source: "https://danbooru.donmai.us/posts/6148600",
    socials: [
      {
        name: "Twitter Post",
        link: "https://x.com/ryrmcher/status/1878812100866560258",
      },
      {
        name: "Artist's Twitter",
        link: "https://x.com/ryrmcher",
      },
    ],
  },
  {
    url: "/patchouli.webp",
    title: "ひとりぼっちのあさ",
    artist: "ayanagi0319",
    source: "https://danbooru.donmai.us/posts/6900673",
    socials: [
      {
        name: "Twitter",
        link: "https://twitter.com/ayanagi0319",
      },
    ],
  },
  {
    url: "/original.webp",
    title: "読書",
    artist: "kamepan44231 - かめぱすた",
    source: "https://danbooru.donmai.us/posts/8743208?",
    socials: [
      {
        name: "Twitter",
        link: "https://x.com/kamepan44231",
      },
    ],
  },
  // Add more backgrounds here!
  // {
  //   url: 'your-image-url',
  //   title: 'Image Title',
  //   artist: 'Artist Name',
  //   source: 'source-url',
  //   socials: [
  //     { name: 'Twitter', link: 'twitter-url' }
  //   ]
  // }
];

export function getRandomBackground(): BackgroundImage {
  if (backgrounds.length === 0) {
    // Fallback background if array is empty
    return {
      url: "https://cdn.donmai.us/original/97/c8/__citlali_genshin_impact_drawn_by_ryrmcher__97c810ff6e992f1789f93e2edbb683a3.jpg",
      title: "Citlali (Genshin Impact)",
      artist: "ryrmcher",
      source: "https://danbooru.donmai.us/posts/6148600",
      socials: [],
    };
  }
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}
