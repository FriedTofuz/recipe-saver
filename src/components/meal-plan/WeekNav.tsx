'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekNavProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function WeekNav({ weekStart, onPrev, onNext }: WeekNavProps) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const fmt = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-sm min-w-40 text-center">
        {fmt(weekStart)} – {fmt(weekEnd)}, {weekEnd.getFullYear()}
      </span>
      <Button variant="outline" size="icon" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
