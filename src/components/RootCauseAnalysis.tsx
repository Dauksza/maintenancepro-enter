import { useMemo, useState } from 'react'
import type { WorkOrder } from '@/lib/types'
import {
  analyzeRootCausePatterns,
  identifyFailureClusters,
  detectCausalRelationships,
  analyzeFailureTimelines,
  analyzeTaskComplexity,
  type RootCausePattern,
  type FailureCluster,
  type CausalRelationship,
  type FailureTimeline,
  type TaskComplexityAnalysis
} from '@/lib/root-cause-analysis'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Brain,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  ChartBar,
  Clock,
  CalendarBlank,
  Target,
  Wrench,
  ListChecks
} from '@phosphor-icons/react'

interface RootCauseAnalysisProps {
  workOrders: WorkOrder[]
  onSelectWorkOrder?: (workOrderId: string) => void
}

export function RootCauseAnalysis({ workOrders, onSelectWorkOrder }: RootCauseAnalysisProps) {
  const [selectedPattern, setSelectedPattern] = useState<RootCausePattern | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<FailureCluster | null>(null)

  const analysis = useMemo(() => {
    if (workOrders.length < 5) return null

    return {
      patterns: analyzeRootCausePatterns(workOrders),
      clusters: identifyFailureClusters(workOrders),
      relationships: detectCausalRelationships(workOrders),
      timelines: analyzeFailureTimelines(workOrders),
      taskComplexity: analyzeTaskComplexity(workOrders)
    }
  }, [workOrders])

  if (!analysis || workOrders.length < 5) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Insufficient Data</h3>
          <p className="text-muted-foreground">
            Root cause analysis requires at least 5 work orders to identify patterns.
            <br />
            Continue adding work orders to enable ML-powered insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Brain size={28} weight="fill" className="text-accent" />
            Root Cause Analysis
          </h2>
          <p className="text-muted-foreground mt-1">
            ML-powered pattern recognition and failure analysis across {workOrders.length} work orders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patterns Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.patterns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Common failure patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failure Clusters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.clusters.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Equipment with recurring issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Causal Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.relationships.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Related equipment failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accelerating Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {analysis.timelines.filter(t => t.failure_acceleration).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Equipment requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="patterns" className="gap-2">
            <Target size={18} />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-2">
            <ChartBar size={18} />
            <span className="hidden sm:inline">Clusters</span>
          </TabsTrigger>
          <TabsTrigger value="relationships" className="gap-2">
            <ArrowRight size={18} />
            <span className="hidden sm:inline">Relationships</span>
          </TabsTrigger>
          <TabsTrigger value="timelines" className="gap-2">
            <CalendarBlank size={18} />
            <span className="hidden sm:inline">Timelines</span>
          </TabsTrigger>
          <TabsTrigger value="complexity" className="gap-2">
            <Wrench size={18} />
            <span className="hidden sm:inline">Complexity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {analysis.patterns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No significant patterns detected in the current dataset.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {analysis.patterns.map((pattern) => (
                <Card 
                  key={pattern.pattern_id}
                  className={`cursor-pointer transition-colors hover:bg-accent/5 ${
                    selectedPattern?.pattern_id === pattern.pattern_id ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {pattern.pattern_name}
                          {pattern.trend === 'increasing' && (
                            <Badge variant="destructive" className="gap-1">
                              <TrendUp size={14} />
                              Increasing
                            </Badge>
                          )}
                          {pattern.trend === 'decreasing' && (
                            <Badge variant="secondary" className="gap-1">
                              <TrendDown size={14} />
                              Decreasing
                            </Badge>
                          )}
                          {pattern.trend === 'stable' && (
                            <Badge variant="outline" className="gap-1">
                              <Minus size={14} />
                              Stable
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {pattern.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent">
                          {pattern.occurrence_count}
                        </div>
                        <div className="text-xs text-muted-foreground">occurrences</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Frequency</div>
                        <div className="font-semibold">
                          {pattern.failure_frequency.toFixed(1)} /month
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Avg Downtime</div>
                        <div className="font-semibold">
                          {pattern.average_downtime.toFixed(1)} hrs
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Priority</div>
                        <div className="font-semibold">{pattern.typical_priority}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Confidence</div>
                        <div className="flex items-center gap-2">
                          <Progress value={pattern.confidence_score * 100} className="flex-1" />
                          <span className="text-xs font-medium">
                            {Math.round(pattern.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Affected Equipment</div>
                      <div className="flex flex-wrap gap-2">
                        {pattern.equipment_areas.map((area, idx) => (
                          <Badge key={idx} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Common Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {pattern.common_task_keywords.slice(0, 8).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Warning size={18} className="text-accent" />
                        Contributing Factors
                      </div>
                      <ul className="space-y-1 text-sm">
                        {pattern.contributing_factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb size={18} className="text-accent" weight="fill" />
                        Recommended Prevention
                      </div>
                      <ul className="space-y-1 text-sm">
                        {pattern.recommended_prevention.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {pattern.affected_work_orders.length > 0 && (
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onSelectWorkOrder) {
                              onSelectWorkOrder(pattern.affected_work_orders[0])
                            }
                          }}
                        >
                          View Related Work Orders ({pattern.affected_work_orders.length})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          {analysis.clusters.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ChartBar size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No significant failure clusters detected.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {analysis.clusters.map((cluster) => (
                <Card 
                  key={cluster.cluster_id}
                  className={`cursor-pointer transition-colors hover:bg-accent/5 ${
                    selectedCluster?.cluster_id === cluster.cluster_id ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => setSelectedCluster(cluster)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cluster.cluster_name}</span>
                      <Badge variant="destructive">{cluster.work_order_count} failures</Badge>
                    </CardTitle>
                    <CardDescription>
                      {cluster.equipment_areas.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Total Downtime</div>
                        <div className="font-semibold text-lg">
                          {cluster.total_downtime_hours.toFixed(1)} hrs
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Avg Resolution</div>
                        <div className="font-semibold text-lg">
                          {cluster.average_resolution_time_days.toFixed(1)} days
                        </div>
                      </div>
                      {cluster.recurring_interval_days && (
                        <div>
                          <div className="text-muted-foreground mb-1">Recurs Every</div>
                          <div className="font-semibold text-lg text-destructive">
                            {cluster.recurring_interval_days.toFixed(0)} days
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Common Symptoms</div>
                      <div className="flex flex-wrap gap-2">
                        {cluster.common_symptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="outline">{symptom}</Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Brain size={18} className="text-accent" weight="fill" />
                        Root Cause Hypothesis
                      </div>
                      <p className="text-sm bg-accent/10 p-3 rounded-lg">
                        {cluster.root_cause_hypothesis}
                      </p>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb size={18} className="text-accent" weight="fill" />
                        Prevention Strategies
                      </div>
                      <ul className="space-y-1 text-sm">
                        {cluster.prevention_strategies.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {analysis.relationships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ArrowRight size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No causal relationships detected between equipment failures.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {analysis.relationships.map((rel, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        {rel.cause_equipment}
                      </Badge>
                      <ArrowRight size={24} weight="bold" className="text-accent" />
                      <Badge variant="secondary" className="font-mono">
                        {rel.effect_equipment}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Correlation Strength: {Math.round(rel.correlation_strength * 100)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Progress value={rel.correlation_strength * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(rel.correlation_strength * 100)}%
                      </span>
                    </div>

                    <p className="text-sm">{rel.description}</p>

                    {rel.examples.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Example Occurrences</div>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {rel.examples.map((example, exIdx) => (
                              <div key={exIdx} className="text-xs bg-muted p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <code className="text-xs">{example.cause_work_order}</code>
                                  <ArrowRight size={14} />
                                  <code className="text-xs">{example.effect_work_order}</code>
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  Time lag: {example.time_lag_days.toFixed(1)} days
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timelines" className="space-y-4">
          {analysis.timelines.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CalendarBlank size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Insufficient data to analyze failure timelines.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {analysis.timelines.map((timeline, idx) => (
                <Card 
                  key={idx}
                  className={timeline.failure_acceleration ? 'border-destructive' : ''}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{timeline.equipment_area}</span>
                      <div className="flex gap-2">
                        {timeline.failure_acceleration && (
                          <Badge variant="destructive" className="gap-1">
                            <TrendUp size={14} />
                            Accelerating
                          </Badge>
                        )}
                        {timeline.critical_period_identified && (
                          <Badge variant="outline" className="gap-1">
                            <Warning size={14} />
                            Critical Period
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {timeline.failures.length} failures tracked
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timeline.failure_acceleration && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                          <Warning size={18} weight="fill" />
                          Failure Acceleration Detected
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Time between failures is decreasing. Immediate action recommended.
                        </p>
                      </div>
                    )}

                    {timeline.critical_period_identified && timeline.critical_period && (
                      <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-accent font-medium mb-1">
                          <CalendarBlank size={18} weight="fill" />
                          Critical Period Identified
                        </div>
                        <p className="text-sm">
                          {timeline.critical_period.failure_count} failures occurred between{' '}
                          {new Date(timeline.critical_period.start_date).toLocaleDateString()} and{' '}
                          {new Date(timeline.critical_period.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-medium mb-3">Failure Timeline</div>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {timeline.failures.map((failure, fIdx) => (
                            <div key={fIdx} className="relative pl-4 border-l-2 border-muted pb-3">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent border-2 border-background" />
                              <div className="text-xs text-muted-foreground mb-1">
                                {new Date(failure.date).toLocaleDateString()}
                                {failure.time_since_last_failure_days > 0 && (
                                  <span className="ml-2">
                                    (+{failure.time_since_last_failure_days} days)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium mb-1">{failure.task}</div>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {failure.priority}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {failure.downtime_hours}hrs downtime
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => onSelectWorkOrder?.(failure.work_order_id)}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="complexity" className="space-y-4">
          {analysis.taskComplexity.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Insufficient data to analyze task complexity.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {analysis.taskComplexity.map((task, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{task.task_type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Complexity:</span>
                        <Badge 
                          variant={
                            task.complexity_score > 0.7 ? 'destructive' : 
                            task.complexity_score > 0.4 ? 'default' : 
                            'secondary'
                          }
                        >
                          {Math.round(task.complexity_score * 100)}%
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock size={14} />
                          Completion Time
                        </div>
                        <div className="font-semibold text-lg">
                          {task.average_completion_time_days.toFixed(1)} days
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Failure Rate</div>
                        <div className="font-semibold text-lg">
                          {Math.round(task.failure_rate * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Multiple Attempts</div>
                        <div className="font-semibold text-lg">
                          {task.requires_multiple_attempts ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Complexity Score:</span>
                      <Progress value={task.complexity_score * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(task.complexity_score * 100)}%
                      </span>
                    </div>

                    {task.common_complications.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Common Complications</div>
                        <div className="flex flex-wrap gap-2">
                          {task.common_complications.map((comp, compIdx) => (
                            <Badge key={compIdx} variant="outline">{comp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.recommended_improvements.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ListChecks size={18} className="text-accent" />
                          Recommended Improvements
                        </div>
                        <ul className="space-y-1 text-sm">
                          {task.recommended_improvements.map((improvement, impIdx) => (
                            <li key={impIdx} className="flex items-start gap-2">
                              <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
