export interface Comic {
  id: string;
  chap: string;
  updated_at: string;
  md_comics: {
    title: string;
    slug: string;
    genres: number[];
    md_covers: {
      b2key: string;
    }[];
  };
}

export interface Genre {
  id: number;
  name: string;
}