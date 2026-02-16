import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import {
  Wrench,
  Brain,
  ChartBar,
  Users,
  Calendar,
  Sparkle,
  CheckCircle,
  ArrowRight,
  Rocket
} from '@phosphor-icons/react'

interface WelcomeDialogProps {
  onComplete: () => void
}

const features = [
  {
    icon: Wrench,
    title: 'Smart Work Orders',
    description: 'Create, assign, and track maintenance tasks with intelligent automation',
    color: 'text-blue-500'
  },
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    description: 'Predictive maintenance using machine learning to prevent failures before they happen',
    color: 'text-purple-500'
  },
  {
    icon: ChartBar,
    title: 'Real-Time Analytics',
    description: 'Comprehensive dashboards with actionable insights and performance metrics',
    color: 'text-green-500'
  },
  {
    icon: Users,
    title: 'Workforce Management',
    description: 'Manage skills, certifications, schedules, and optimize resource allocation',
    color: 'text-orange-500'
  },
  {
    icon: Calendar,
    title: 'Advanced Scheduling',
    description: 'Drag-and-drop calendar, capacity planning, and auto-scheduler with conflict detection',
    color: 'text-pink-500'
  },
  {
    icon: Sparkle,
    title: 'Mobile-First PWA',
    description: 'Install as an app, work offline, and sync seamlessly across all your devices',
    color: 'text-cyan-500'
  }
]

export function WelcomeDialog({ onComplete }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen welcome screen
    const hasSeenWelcome = localStorage.getItem('maintenancepro-welcome-seen')
    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('maintenancepro-welcome-seen', 'true')
    setOpen(false)
    onComplete()
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {currentStep === 0 && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70">
                  <Rocket className="h-8 w-8 text-white" weight="duotone" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold">
                    Welcome to MaintenancePro
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    Your transformative CMMS platform
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground">
                MaintenancePro represents a leap forward in maintenance management—combining 
                <strong className="text-foreground"> AI-powered predictive analytics</strong>, 
                <strong className="text-foreground"> intelligent scheduling</strong>, and 
                <strong className="text-foreground"> real-time collaboration</strong> in a sleek, 
                intuitive interface designed for both production and sales environments.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <Card key={index} className="p-4 border-2 hover:border-primary/50 transition-colors">
                  <div className="flex gap-3">
                    <div className={`${feature.color} mt-1`}>
                      <feature.icon className="h-6 w-6" weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext} className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl">Quick Start Guide</DialogTitle>
              <DialogDescription>
                Get up and running in minutes with these simple steps
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="p-4 border-l-4 border-l-primary">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Load Sample Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Click "Load Sample Data" in the header to populate the system with example 
                      work orders, employees, assets, and procedures.
                    </p>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkle className="h-3 w-3" weight="fill" />
                      Recommended for first-time users
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-l-blue-500">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Explore the Dashboard</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Navigate through tabs to explore Work Orders, Analytics, Calendar views, 
                      Employee Management, and Predictive Maintenance.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">Work Orders</Badge>
                      <Badge variant="outline">Analytics</Badge>
                      <Badge variant="outline">Calendar</Badge>
                      <Badge variant="outline">Resources</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-l-green-500">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Create Your First Work Order</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Click the "New Work Order" button to create a maintenance task. The 
                      auto-scheduler will help assign it to the best technician.
                    </p>
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" weight="fill" />
                      Takes less than 1 minute
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Power user tips to navigate faster
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Global Search</span>
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">Ctrl+K</kbd>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Work Order</span>
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">Ctrl+N</kbd>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quick Actions</span>
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">Ctrl+/</kbd>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dashboard</span>
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">Ctrl+H</kbd>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkle className="h-6 w-6 text-primary" weight="duotone" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Pro Tip: Install as App</h4>
                  <p className="text-sm text-muted-foreground">
                    MaintenancePro works offline as a Progressive Web App. Install it for faster 
                    access and push notifications.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={handleComplete} className="gap-2">
                  <CheckCircle className="h-4 w-4" weight="bold" />
                  Start Using MaintenancePro
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 pt-2">
          {[0, 1, 2].map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-2 rounded-full transition-all ${
                step === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
