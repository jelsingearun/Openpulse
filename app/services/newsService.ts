import axios from 'axios';
import Parser from 'rss-parser';

export interface NewsStory {
  id: string;
  title: string;
  author: string;
  snippet: string;
  url: string;
  publishDate: string;
  topic: string;
  score: number;
}

const parser = new Parser();

export class NewsService {
  async fetchHackerNews(): Promise<NewsStory[]> {
    try {
      const { data: topStoryIds } = await axios.get(`https://hacker-news.firebaseio.com/v0/topstories.json?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const stories = await Promise.all(
        topStoryIds.slice(0, 10).map(async (id: number) => {
          const { data: story } = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json?t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          return {
            id: String(story.id),
            title: story.title,
            author: story.by,
            snippet: story.text || story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            publishDate: new Date(story.time * 1000).toISOString(),
            topic: 'Tech',
            score: story.score
          };
        })
      );
      return stories;
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  async fetchRSS(url: string): Promise<NewsStory[]> {
    try {
      // Use axois to fetch RSS with cache busting then parse
      const { data: feedContent } = await axios.get(`${url}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const feed = await parser.parseString(feedContent);
      return feed.items.slice(0, 10).map((item) => ({
        id: item.guid || item.link || String(Math.random()),
        title: item.title || 'Untitled',
        author: (item as any).creator || (item as any).author || 'Unknown',
        snippet: item.contentSnippet || item.content || item.title || '',
        url: item.link || '',
        publishDate: item.isoDate || new Date().toISOString(),
        topic: feed.title || 'RSS',
        score: 50 // Base score for RSS items
      }));
    } catch (error) {
      console.error(`Error fetching RSS from ${url}:`, error);
      return [];
    }
  }

  async fetchAll(): Promise<NewsStory[]> {
    const [hnStories, rssStories] = await Promise.all([
      this.fetchHackerNews(),
      this.fetchRSS('https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml')
    ]);

    const allStories = [...hnStories, ...rssStories];
    
    // Shuffle the array to provide variety when the user requests multiple videos
    // while still keeping highly scored items near the front for the pool
    const shuffled = allStories
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Take top 20
      .sort(() => Math.random() - 0.5); // Shuffle them

    return shuffled;
  }
}

export const newsService = new NewsService();
