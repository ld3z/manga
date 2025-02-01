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
    url: "/citali.webp",
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
    source: "https://danbooru.donmai.us/posts/8743208",
    socials: [
      {
        name: "Twitter",
        link: "https://x.com/kamepan44231",
      },
    ],
  },
  {
    url: "/numi.webp",
    title: "Numi",
    artist: "TenIllustrator",
    source: "https://danbooru.donmai.us/posts/8074444",
    socials: [
      {
        name: "Twitter",
        link: "https://x.com/Ten_0123_/",
      },
    ],
  },
  {
    url: "/shylily.webp",
    title: "Shylily",
    artist: "greatodoggo",
    source: "https://www.pixiv.net/en/artworks/124222053",
    socials: [
      {
        name: "Twitter",
        link: "https://twitter.com/greatodoggo",
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
      url: "/citali.webp",
      title: "Citlali (Genshin Impact)",
      artist: "ryrmcher",
      source: "https://danbooru.donmai.us/posts/6148600",
      socials: [],
    };
  }
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

export function preloadBackgrounds() {
  backgrounds.forEach((bg) => {
    const img = new Image();
    img.src = bg.url;
  });
}