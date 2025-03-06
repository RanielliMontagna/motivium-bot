import dayjs, { Dayjs } from 'dayjs'
import Parser from 'rss-parser'

export interface NewsArticle {
  title: string
  summary: string
  contentSnippet: string
  content: string
  url: string
  publishedAt: Dayjs
  source: { name: string }
}

interface RSSFeed {
  url: string
  name: string
}

const parser = new Parser()

const theVergeURLBase = 'https://www.theverge.com/rss'

const rssFeeds: RSSFeed[] = [
  { url: `${theVergeURLBase}/tech/index.xml`, name: 'The Verge - Tech' },
  { url: `${theVergeURLBase}/ai-artificial-intelligence/index.xml`, name: 'The Verge - AI' },
]

async function getRSSNews(): Promise<NewsArticle[]> {
  try {
    const articles: NewsArticle[] = []

    for (const feed of rssFeeds) {
      const feedContent = await parser.parseURL(feed.url)

      for (const item of feedContent.items) {
        articles.push({
          title: item.title || '',
          contentSnippet: item.contentSnippet || '',
          content: item.content || '',
          summary: item.summary || '',
          url: item.link || '',
          publishedAt: item.pubDate ? dayjs(item.pubDate) : dayjs(),
          source: { name: feed.name },
        })
      }
    }

    return articles.sort((a, b) => b.publishedAt.diff(a.publishedAt))
  } catch (error) {
    console.error('Error fetching RSS news:', error)
    return []
  }
}

export { getRSSNews }
