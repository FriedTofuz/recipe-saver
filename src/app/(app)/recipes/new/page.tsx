import { ImportTabs } from '@/components/import/ImportTabs'
import { WavyRule } from '@/components/paper'

export default function NewRecipePage() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <header style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          New recipe
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 48,
            lineHeight: 1,
            margin: '6px 0 0',
            color: 'var(--ink)',
          }}
        >
          What are we <em style={{ fontStyle: 'italic' }}>saving?</em>
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            color: 'var(--ink-soft)',
            maxWidth: 540,
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          Three ways in. Paste a link from a blog, paste raw text from a screenshot, or write it on a fresh page.
        </p>
      </header>

      <WavyRule style={{ margin: '18px 0 22px' }} />

      <ImportTabs />
    </div>
  )
}
