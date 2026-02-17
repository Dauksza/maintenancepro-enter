import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, X } from '@phosphor-icons/react'

export interface TourStep {
  id: string
  selector: string
  title: string
  description: string
}

interface InteractiveTourProps {
  open: boolean
  steps: TourStep[]
  onClose: () => void
  onComplete: () => void
}

interface ElementRect {
  top: number
  left: number
  width: number
  height: number
}

function getElementRect(selector: string): ElementRect | null {
  const element = document.querySelector(selector)
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()
  const padding = 8

  return {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export function InteractiveTour({ open, steps, onClose, onComplete }: InteractiveTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [highlightRect, setHighlightRect] = useState<ElementRect | null>(null)

  const stepCount = steps.length
  const currentStep = steps[currentStepIndex]

  useEffect(() => {
    if (!open) {
      return
    }
    setCurrentStepIndex(0)
  }, [open])

  useEffect(() => {
    if (!open || !currentStep) {
      return
    }

    const updateRect = () => {
      const rect = getElementRect(currentStep.selector)
      setHighlightRect(rect)
      if (rect) {
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - 140), behavior: 'smooth' })
      }
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [open, currentStep])

  const tooltipStyle = useMemo(() => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    const defaultTop = highlightRect.top + highlightRect.height + 12
    const centeredLeft = highlightRect.left + highlightRect.width / 2
    const fitsBelow = defaultTop + 220 < window.innerHeight
    const top = fitsBelow ? defaultTop : Math.max(16, highlightRect.top - 220)

    return {
      top,
      left: Math.min(window.innerWidth - 24, Math.max(24, centeredLeft)),
      transform: 'translateX(-50%)',
    }
  }, [highlightRect])

  if (!open || !currentStep) {
    return null
  }

  const handleNext = () => {
    if (currentStepIndex >= stepCount - 1) {
      onComplete()
      return
    }

    setCurrentStepIndex((current) => current + 1)
  }

  const spotlight = highlightRect
    ? {
        clipPath: `polygon(0% 0%, 0% 100%, ${highlightRect.left}px 100%, ${highlightRect.left}px ${highlightRect.top}px, ${highlightRect.left + highlightRect.width}px ${highlightRect.top}px, ${highlightRect.left + highlightRect.width}px ${highlightRect.top + highlightRect.height}px, ${highlightRect.left}px ${highlightRect.top + highlightRect.height}px, ${highlightRect.left}px 100%, 100% 100%, 100% 0%)`,
      }
    : undefined

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60" style={spotlight} />

      {highlightRect && (
        <div
          className="fixed z-[91] rounded-lg border-2 border-primary shadow-[0_0_0_4px_hsl(var(--background))]"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      <Card
        className="fixed z-[92] w-[min(420px,calc(100vw-32px))] p-5 shadow-xl"
        style={tooltipStyle as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <Badge variant="secondary">Step {currentStepIndex + 1} of {stepCount}</Badge>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tour">
            <X size={16} />
          </Button>
        </div>

        <h3 className="text-base font-semibold mb-2">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{currentStep.description}</p>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>Skip Tour</Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStepIndex >= stepCount - 1 ? (
              <>
                <CheckCircle size={16} weight="fill" />
                Finish
              </>
            ) : (
              <>
                Next
                <ArrowRight size={16} weight="bold" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </>
  )
}
