'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UrlImportForm } from './UrlImportForm'
import { TextPasteForm } from './TextPasteForm'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { ImportPreview } from './ImportPreview'
import type { ParsedRecipe } from '@/types'

type ImportStep = 'input' | 'preview'

export function ImportTabs() {
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null)
  const [sourceType, setSourceType] = useState<'url' | 'paste' | 'manual'>('url')
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [step, setStep] = useState<ImportStep>('input')

  function handleParsed(data: ParsedRecipe, type: 'url' | 'paste', url?: string) {
    setParsed(data)
    setSourceType(type)
    if (url) setSourceUrl(url)
    setStep('preview')
  }

  if (step === 'preview' && parsed) {
    return (
      <ImportPreview
        parsed={parsed}
        sourceType={sourceType as 'url' | 'paste'}
        sourceUrl={sourceUrl}
        onBack={() => { setStep('input'); setParsed(null) }}
      />
    )
  }

  return (
    <Tabs
      defaultValue="url"
      className="space-y-6"
      onValueChange={(v) => setSourceType(v as 'url' | 'paste' | 'manual')}
    >
      <TabsList>
        <TabsTrigger value="url">Import from URL</TabsTrigger>
        <TabsTrigger value="paste">Paste Text</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>

      <TabsContent value="url">
        <UrlImportForm onParsed={(data, url) => handleParsed(data, 'url', url)} />
      </TabsContent>

      <TabsContent value="paste">
        <TextPasteForm onParsed={(data) => handleParsed(data, 'paste')} />
      </TabsContent>

      <TabsContent value="manual">
        <RecipeForm sourceType="manual" />
      </TabsContent>
    </Tabs>
  )
}
