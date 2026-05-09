'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, X, List } from 'lucide-react'
import { useWakeLock } from '@/hooks/useWakeLock'
import type { Step, Ingredient } from '@/types'

interface CookingModeProps {
  steps: Step[]
  ingredients: Ingredient[]
  title: string
  onClose: () => void
}

export function CookingMode({ steps, ingredients, title, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  useWakeLock(true)

  const progress = ((currentStep + 1) / steps.length) * 100

  function prev() {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function next() {
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIngredients(!showIngredients)}
        >
          <List className="h-4 w-4 mr-1" />
          Ingredients
        </Button>
      </div>

      <Progress value={progress} className="h-1 rounded-none" />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
          <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-center leading-relaxed max-w-2xl">
            {step.instruction}
          </p>
        </div>

        {showIngredients && (
          <div className="md:w-72 border-l overflow-y-auto p-4">
            <p className="text-sm font-semibold mb-3">Ingredients</p>
            <ul className="space-y-2">
              {ingredients.map((ing) => (
                <li key={ing.id} className="text-sm flex gap-2">
                  <span className="font-medium shrink-0">
                    {ing.quantity} {ing.unit}
                  </span>
                  <span className="text-muted-foreground">{ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button onClick={onClose} className="gap-2">
            Done cooking!
          </Button>
        ) : (
          <Button onClick={next} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
