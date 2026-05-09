'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          '--normal-bg': '#fbf6e9',
          '--normal-text': '#231d18',
          '--normal-border': '#d9cdb6',
          '--success-bg': '#f3eed9',
          '--success-text': '#231d18',
          '--success-border': '#b6562a',
          '--error-bg': '#f3e3d6',
          '--error-text': '#231d18',
          '--error-border': '#7d3f2f',
          '--warning-bg': '#f6efd2',
          '--warning-text': '#231d18',
          '--warning-border': '#9a7a2a',
          fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          borderRadius: 8,
          boxShadow: 'var(--shadow-card)',
          fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
        },
        classNames: {
          title: 'font-medium',
          description: 'opacity-80',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
