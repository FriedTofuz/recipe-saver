import { parse } from 'node-html-parser'

const BLOCKED_HOSTS = ['instagram.com', 'www.instagram.com']
const MAX_TEXT_LENGTH = 12000

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

export interface FetchResult {
  text: string
  ogImage: string | null
  title: string
}

export class InstagramBlockedError extends Error {
  constructor() {
    super('Instagram links cannot be imported. Please copy and paste the recipe caption text instead.')
  }
}

export class FetchFailedError extends Error {}

export async function fetchUrlContent(url: string): Promise<FetchResult> {
  const { hostname } = new URL(url)
  if (BLOCKED_HOSTS.includes(hostname)) {
    throw new InstagramBlockedError()
  }

  let html: string
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, redirect: 'follow' })
    if (!res.ok) throw new FetchFailedError(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    if (err instanceof InstagramBlockedError) throw err

    // Optionally fall back to Firecrawl
    if (process.env.FIRECRAWL_API_KEY) {
      return fetchViaFirecrawl(url)
    }
    throw new FetchFailedError(
      'Could not fetch this page. Try pasting the recipe text directly.'
    )
  }

  const root = parse(html)

  const ogImage =
    root.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null

  const titleTag = root.querySelector('title')?.text ?? ''

  const contentEl =
    root.querySelector('main') ??
    root.querySelector('article') ??
    root.querySelector('[class*="recipe"]') ??
    root.querySelector('body')

  const rawText = contentEl?.text ?? html
  const cleaned = rawText.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH)

  if (cleaned.length < 200) {
    if (process.env.FIRECRAWL_API_KEY) {
      return fetchViaFirecrawl(url)
    }
    throw new FetchFailedError(
      'This page appears to be behind a login wall. Try pasting the recipe text directly.'
    )
  }

  return { text: cleaned, ogImage, title: titleTag }
}

async function fetchViaFirecrawl(url: string): Promise<FetchResult> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  })
  if (!res.ok) {
    throw new FetchFailedError('Could not fetch this page. Try pasting the recipe text directly.')
  }
  const data = await res.json()
  return {
    text: (data.data?.markdown ?? '').slice(0, MAX_TEXT_LENGTH),
    ogImage: data.data?.metadata?.ogImage ?? null,
    title: data.data?.metadata?.title ?? '',
  }
}
