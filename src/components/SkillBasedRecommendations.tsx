import { useMemo, useState } from 'react'
import type { 
  WorkOrder, 
  Employee, 
  SkillMatrixEntry,
  CertificationReminder
} from '@/lib/types'
import type { EmployeeRecommendation } from '@/lib/skill-matcher'
import { generateRecommendations, analyzeWorkOrder } from '@/lib/skill-matcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  Warning, 
  XCircle, 
  User, 
  Clock,
  Certificate,
  Wrench,
  TrendUp,
  Star,
  Lightning
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SkillBasedRecommendationsProps {
  workOrder: WorkOrder
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  workOrders: WorkOrder[]
  reminders?: CertificationReminder[]
  onAssign: (employeeId: string, employeeName: string) => void
  currentlyAssigned?: string | null
}

export function SkillBasedRecommendations({
  workOrder,
  employees,
  skillMatrix,
  workOrders,
  reminders = [],
  onAssign,
  currentlyAssigned
}: SkillBasedRecommendationsProps) {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

  const recommendations = useMemo(() => {
    return generateRecommendations(workOrder, employees, skillMatrix, workOrders, reminders)
  }, [workOrder, employees, skillMatrix, workOrders, reminders])

  const analysis = useMemo(() => {
    return analyzeWorkOrder(workOrder)
  }, [workOrder])

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available': return 'text-green-600 bg-green-50'
      case 'Busy': return 'text-yellow-600 bg-yellow-50'
      case 'Overloaded': return 'text-orange-600 bg-orange-50'
      case 'Unavailable': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMatchQualityIcon = (quality: string) => {
    switch (quality) {
      case 'Perfect': return <CheckCircle size={16} weight="fill" className="text-green-600" />
      case 'Good': return <CheckCircle size={16} className="text-blue-600" />
      case 'Adequate': return <Warning size={16} className="text-yellow-600" />
      case 'Missing': return <XCircle size={16} className="text-red-600" />
      default: return null
    }
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning size={24} weight="fill" className="text-accent" />
            Skill-Based Recommendations
          </CardTitle>
          <CardDescription>No employees available for recommendations</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const topRecommendations = recommendations.slice(0, 5)
  const bestMatch = recommendations[0]

  return (
    <div className="space-y-4">
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning size={24} weight="fill" className="text-accent" />
            Skill-Based Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered employee matching based on skills, workload, and certifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Wrench size={16} />
              Work Order Analysis
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Required Skills:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.required_skills.length > 0 ? (
                    analysis.required_skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">None detected</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Optional Skills:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.optional_skills.length > 0 ? (
                    analysis.optional_skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">None detected</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Complexity:</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={analysis.complexity_score} className="h-2" />
                  <span className="text-xs font-medium">{Math.round(analysis.complexity_score)}%</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Priority:</p>
                <Badge 
                  variant={workOrder.priority_level === 'Critical' ? 'destructive' : 'default'}
                  className="mt-1"
                >
                  {workOrder.priority_level}
                </Badge>
              </div>
            </div>
          </div>

          {bestMatch.recommended && (
            <div className="bg-accent/10 border-2 border-accent rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} weight="fill" className="text-accent" />
                    <h4 className="font-semibold">Best Match</h4>
                  </div>
                  <p className="text-lg font-bold">
                    {bestMatch.employee.first_name} {bestMatch.employee.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{bestMatch.employee.position}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className={cn('text-2xl font-bold', getScoreColor(bestMatch.score))}>
                        {Math.round(bestMatch.score)}
                      </span>
                      <span className="text-xs text-muted-foreground">score</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round(bestMatch.match_percentage)}%
                      </span>
                      <span className="text-xs text-muted-foreground">match</span>
                    </div>
                    <Badge className={cn('text-xs', getAvailabilityColor(bestMatch.availability))}>
                      {bestMatch.availability}
                    </Badge>
                  </div>
                  {bestMatch.strengths.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {bestMatch.strengths.slice(0, 2).map((strength, idx) => (
                        <p key={idx} className="text-sm flex items-center gap-2 text-green-700">
                          <CheckCircle size={14} weight="fill" />
                          {strength}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => onAssign(
                    bestMatch.employee.employee_id, 
                    `${bestMatch.employee.first_name} ${bestMatch.employee.last_name}`
                  )}
                  className="gap-2"
                  disabled={currentlyAssigned === `${bestMatch.employee.first_name} ${bestMatch.employee.last_name}`}
                >
                  <User size={18} />
                  {currentlyAssigned === `${bestMatch.employee.first_name} ${bestMatch.employee.last_name}` 
                    ? 'Currently Assigned' 
                    : 'Assign'}
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendUp size={18} />
              All Recommendations
            </h4>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  const employeeName = `${rec.employee.first_name} ${rec.employee.last_name}`
                  const isExpanded = expandedEmployee === rec.employee.employee_id
                  const isCurrentlyAssigned = currentlyAssigned === employeeName

                  return (
                    <Card 
                      key={rec.employee.employee_id}
                      className={cn(
                        'transition-all',
                        isCurrentlyAssigned && 'border-primary',
                        rec.recommended && index === 0 && 'border-accent'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                              <h5 className="font-semibold truncate">{employeeName}</h5>
                              {isCurrentlyAssigned && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                              {rec.recommended && (
                                <Badge variant="default" className="text-xs bg-accent text-accent-foreground">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{rec.employee.position}</p>
                            
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <span className={cn('font-bold', getScoreColor(rec.score))}>
                                  {Math.round(rec.score)}
                                </span>
                                <span className="text-muted-foreground">score</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-blue-600">
                                  {Math.round(rec.match_percentage)}%
                                </span>
                                <span className="text-muted-foreground">match</span>
                              </div>
                              <Badge className={cn('text-xs', getAvailabilityColor(rec.availability))}>
                                <Clock size={12} className="mr-1" />
                                {rec.workload_hours}h
                              </Badge>
                              {rec.certifications_status !== 'All Valid' && (
                                <Badge variant="outline" className="text-xs">
                                  <Certificate size={12} className="mr-1" />
                                  {rec.certifications_status}
                                </Badge>
                              )}
                            </div>

                            {!isExpanded && rec.strengths.length > 0 && (
                              <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                                <CheckCircle size={12} weight="fill" />
                                {rec.strengths[0]}
                              </p>
                            )}

                            {!isExpanded && rec.concerns.length > 0 && (
                              <p className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                                <Warning size={12} weight="fill" />
                                {rec.concerns[0]}
                              </p>
                            )}

                            {isExpanded && (
                              <div className="mt-3 space-y-3">
                                {rec.strengths.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-700 mb-1">Strengths:</p>
                                    <ul className="space-y-1">
                                      {rec.strengths.map((strength, idx) => (
                                        <li key={idx} className="text-xs flex items-start gap-2">
                                          <CheckCircle size={12} weight="fill" className="text-green-600 mt-0.5 flex-shrink-0" />
                                          <span>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {rec.concerns.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-orange-700 mb-1">Concerns:</p>
                                    <ul className="space-y-1">
                                      {rec.concerns.map((concern, idx) => (
                                        <li key={idx} className="text-xs flex items-start gap-2">
                                          <Warning size={12} weight="fill" className="text-orange-600 mt-0.5 flex-shrink-0" />
                                          <span>{concern}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {rec.skill_matches.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold mb-1">Skill Matches:</p>
                                    <div className="space-y-1">
                                      {rec.skill_matches.map((match, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            {getMatchQualityIcon(match.match_quality)}
                                            <span className={cn(match.is_required && 'font-semibold')}>
                                              {match.skill_name}
                                            </span>
                                            {match.is_required && (
                                              <Badge variant="outline" className="text-[10px] h-4 px-1">Required</Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">{match.level}</span>
                                            {match.certified && (
                                              <Certificate size={12} className="text-blue-600" />
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => onAssign(rec.employee.employee_id, employeeName)}
                              disabled={isCurrentlyAssigned}
                              variant={rec.recommended ? 'default' : 'outline'}
                            >
                              {isCurrentlyAssigned ? 'Assigned' : 'Assign'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedEmployee(
                                isExpanded ? null : rec.employee.employee_id
                              )}
                            >
                              {isExpanded ? 'Less' : 'More'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
