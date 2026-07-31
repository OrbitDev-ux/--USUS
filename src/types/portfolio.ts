export interface PortfolioEntry {
  id: number;
  guildId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  link: string | null;
  authorId: string;
  createdAt: string;
}

export interface PortfolioData {
  counter: number;
  entries: PortfolioEntry[];
}
