import { useEffect, useState, useMemo } from 'react'
import type { WorkOrder, Employee, PartInventoryItem, PartTransaction } from '@/lib/types'
import type { 
  MaintenancePattern, 
  FailurePrediction, 
  MaintenanceForecast,
  PartUsagePattern,
  MLMetrics
} from '@/lib/ml-utils'
import {
  analyzeMaintenancePatterns,
  predictFailures,
  forecastMaintenanceLoad,
  analyzePartUsagePatterns,
  calculateMLMetrics,
  generateMaintenanceRecommendations
} from '@/lib/ml-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  TrendUp,
  TrendDown,
  Warning,
  CalendarCheck,
  ChartBar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Package,
  Sparkle,
  Lightning,
  Clock
} from '@phosphor-icons/react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface PredictiveMaintenanceDashboardProps {
  workOrders: WorkOrder[]
  employees: Employee[]
  parts: PartInventoryItem[]
  partTransactions: PartTransaction[]
  onCreateWorkOrder?: (equipment: string, date: string, priority: string) => void
}

export function PredictiveMaintenanceDashboard({
  workOrders,
  employees,
  parts,
  partTransactions,
  onCreateWorkOrder
}: PredictiveMaintenanceDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [patterns, setPatterns] = useState<MaintenancePattern[]>([])
  const [predictions, setPredictions] = useState<FailurePrediction[]>([])
  const [forecasts, setForecasts] = useState<MaintenanceForecast[]>([])
  const [partPatterns, setPartPatterns] = useState<PartUsagePattern[]>([])
  const [metrics, setMetrics] = useState<MLMetrics | null>(null)

  useEffect(() => {
    if (workOrders.length > 0) {
      runAnalysis()
    }
  }, [workOrders, parts, partTransactions])

  const runAnalysis = () => {
    setIsAnalyzing(true)
    
    setTimeout(() => {
      const analyzedPatterns = analyzeMaintenancePatterns(workOrders)
      const failurePredictions = predictFailures(workOrders, analyzedPatterns)
      const maintenanceForecasts = forecastMaintenanceLoad(workOrders, analyzedPatterns, 90)
      const usagePatterns = analyzePartUsagePatterns(parts, partTransactions)
      const mlMetrics = calculateMLMetrics(workOrders, analyzedPatterns)

      setPatterns(analyzedPatterns)
      setPredictions(failurePredictions)
      setForecasts(maintenanceForecasts)
      setPartPatterns(usagePatterns)
      setMetrics(mlMetrics)
      setIsAnalyzing(false)
    }, 500)
  }

  const recommendations = useMemo(() => 
    generateMaintenanceRecommendations(predictions, workOrders, employees),
    [predictions, workOrders, employees]
  )

  const criticalPredictions = predictions.filter(p => p.risk_level === 'critical' || p.risk_level === 'high')
  const partsNeedingReorder = partPatterns.filter(p => p.reorder_recommendation)

  const forecastChartData = forecasts.slice(0, 30).map(f => ({
    date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    workOrders: f.predicted_work_orders,
    downtime: f.predicted_downtime_hours,
    labor: f.predicted_labor_hours
  }))

  const patternChartData = patterns.slice(0, 10).map(p => ({
    equipment: p.equipment_area.length > 20 ? p.equipment_area.substring(0, 17) + '...' : p.equipment_area,
    frequency: p.average_frequency_days,
    downtime: p.average_downtime,
    failureRate: p.failure_rate * 100
  }))

  if (workOrders.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <Brain size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Training Data Available</h3>
        <p className="text-muted-foreground mb-6">
          Machine learning models require historical work order data to make predictions.
          Import or create work orders to enable predictive maintenance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Brain size={28} weight="fill" className="text-primary" />
            Predictive Maintenance
          </h2>
          <p className="text-muted-foreground">
            Machine learning insights from {workOrders.length} historical work orders
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing} className="gap-2">
          <Sparkle size={18} weight="fill" />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Training Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.training_data_days}</div>
              <p className="text-xs text-muted-foreground">days of history</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prediction Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.prediction_accuracy * 100)}%</div>
              <Progress value={metrics.prediction_accuracy * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.model_confidence * 100)}%</div>
              <Progress value={metrics.model_confidence * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equipment Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patterns.length}</div>
              <p className="text-xs text-muted-foreground">unique areas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {(criticalPredictions.length > 0 || partsNeedingReorder.length > 0 || recommendations.length > 0) && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Warning size={24} weight="fill" />
              Action Required
            </CardTitle>
            <CardDescription>
              Critical predictions and recommendations that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalPredictions.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Lightning size={16} weight="fill" />
                  High-Risk Equipment ({criticalPredictions.length})
                </h4>
                <div className="space-y-2">
                  {criticalPredictions.slice(0, 5).map((pred) => (
                    <div key={pred.equipment_area} className="flex items-center justify-between bg-card p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{pred.equipment_area}</div>
                        <div className="text-sm text-muted-foreground">{pred.recommended_action}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={pred.risk_level === 'critical' ? 'destructive' : 'default'}>
                            {Math.round(pred.probability * 100)}% failure risk
                          </Badge>
                          <Badge variant="outline">{pred.confidence * 100}% confidence</Badge>
                        </div>
                      </div>
                      {onCreateWorkOrder && (
                        <Button
                          size="sm"
                          onClick={() => onCreateWorkOrder(
                            pred.equipment_area,
                            new Date().toISOString(),
                            pred.risk_level === 'critical' ? 'Critical' : 'High'
                          )}
                          className="ml-4"
                        >
                          Create WO
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {partsNeedingReorder.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Package size={16} weight="fill" />
                  Parts Needing Reorder ({partsNeedingReorder.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {partsNeedingReorder.slice(0, 6).map((part) => (
                    <div key={part.part_id} className="bg-card p-2 rounded border text-sm">
                      <div className="font-medium">{part.part_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Usage: {part.average_usage_per_month.toFixed(1)}/month
                        {part.predicted_depletion_date && (
                          <> · Depletes: {new Date(part.predicted_depletion_date).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions" className="gap-2">
            <Warning size={16} />
            Failure Predictions
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <ChartBar size={16} />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <CalendarCheck size={16} />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="parts" className="gap-2">
            <Package size={16} />
            Parts Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Failure Risk Assessment</CardTitle>
              <CardDescription>
                Predictive analysis based on historical maintenance patterns and current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {predictions.map((prediction) => (
                    <Card key={prediction.equipment_area} className={
                      prediction.risk_level === 'critical' ? 'border-destructive' :
                      prediction.risk_level === 'high' ? 'border-accent' : ''
                    }>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{prediction.equipment_area}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Predicted failure: {new Date(prediction.predicted_failure_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            prediction.risk_level === 'critical' ? 'destructive' :
                            prediction.risk_level === 'high' ? 'default' :
                            'outline'
                          }>
                            {prediction.risk_level.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Failure Probability:</span>
                            <span className="font-semibold">{Math.round(prediction.probability * 100)}%</span>
                          </div>
                          <Progress value={prediction.probability * 100} className={
                            prediction.risk_level === 'critical' ? 'bg-destructive/20' : ''
                          } />

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prediction Confidence:</span>
                            <span className="font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                          </div>
                          <Progress value={prediction.confidence * 100} />
                        </div>

                        <Separator className="my-3" />

                        <div className="bg-muted/30 p-3 rounded-lg mb-3">
                          <div className="flex items-start gap-2">
                            <ArrowRight size={18} className="mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm mb-1">Recommended Action</div>
                              <div className="text-sm">{prediction.recommended_action}</div>
                            </div>
                          </div>
                        </div>

                        {prediction.factors.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Contributing Factors:</div>
                            <div className="space-y-1">
                              {prediction.factors.map((factor, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2" />
                                  {factor}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Frequency by Equipment</CardTitle>
                <CardDescription>Average days between maintenance events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={patternChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="hsl(var(--primary))" name="Days" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failure Rate Analysis</CardTitle>
                <CardDescription>Historical failure rates by equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={patternChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="failureRate" fill="hsl(var(--destructive))" name="Failure Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Maintenance Patterns</CardTitle>
              <CardDescription>
                Detailed analysis of historical maintenance patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {patterns.map((pattern) => (
                    <Card key={pattern.equipment_area}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{pattern.equipment_area}</h4>
                            <p className="text-sm text-muted-foreground">
                              Next maintenance predicted: {new Date(pattern.predicted_next_maintenance).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            pattern.trend === 'increasing' ? 'destructive' :
                            pattern.trend === 'decreasing' ? 'default' : 'outline'
                          } className="gap-1">
                            {pattern.trend === 'increasing' && <TrendUp size={14} />}
                            {pattern.trend === 'decreasing' && <TrendDown size={14} />}
                            {pattern.trend === 'stable' && <Clock size={14} />}
                            {pattern.trend}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Avg Frequency</div>
                            <div className="font-semibold">{pattern.average_frequency_days} days</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Avg Downtime</div>
                            <div className="font-semibold">{pattern.average_downtime} hrs</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Failure Rate</div>
                            <div className="font-semibold">{Math.round(pattern.failure_rate * 100)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Confidence</div>
                            <div className="font-semibold">{Math.round(pattern.confidence * 100)}%</div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Badge variant="outline">{pattern.common_type}</Badge>
                          <Badge variant="outline">{pattern.common_priority}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>90-Day Maintenance Forecast</CardTitle>
              <CardDescription>
                Predicted maintenance workload based on historical patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="workOrders" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Work Orders" />
                  <Area type="monotone" dataKey="downtime" stackId="2" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" name="Downtime (hrs)" />
                  <Area type="monotone" dataKey="labor" stackId="3" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" name="Labor (hrs)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Forecast Data</CardTitle>
              <CardDescription>Daily predictions with confidence levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {forecasts.filter(f => f.predicted_work_orders > 0.3).map((forecast) => (
                    <div key={forecast.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {new Date(forecast.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {forecast.equipment_areas.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {forecast.predicted_work_orders.toFixed(1)} WOs
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {forecast.predicted_downtime_hours.toFixed(1)}h downtime
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(forecast.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parts Usage Predictions</CardTitle>
              <CardDescription>
                Analyzing {partTransactions.length} transactions across {parts.length} parts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {partPatterns.map((pattern) => (
                    <Card key={pattern.part_id} className={
                      pattern.reorder_recommendation ? 'border-accent' : ''
                    }>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{pattern.part_name}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              Average usage: {pattern.average_usage_per_month.toFixed(2)} units/month
                            </div>
                          </div>
                          {pattern.reorder_recommendation && (
                            <Badge variant="default" className="gap-1">
                              <Warning size={14} weight="fill" />
                              Reorder Needed
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground mb-1">Seasonality Factor</div>
                            <div className="font-semibold">{pattern.seasonality_factor.toFixed(2)}x</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Prediction Confidence</div>
                            <div className="font-semibold">{Math.round(pattern.confidence * 100)}%</div>
                          </div>
                        </div>

                        {pattern.predicted_depletion_date && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarCheck size={16} />
                              <span className="text-muted-foreground">Predicted depletion:</span>
                              <span className="font-medium">
                                {new Date(pattern.predicted_depletion_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
