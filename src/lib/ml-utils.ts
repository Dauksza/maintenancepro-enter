import type { WorkOrder, Employee, PartInventoryItem, PartTransaction } from './types'

export interface MaintenancePattern {
  equipment_area: string
  average_frequency_days: number
  common_priority: string
  common_type: string
  average_downtime: number
  failure_rate: number
  predicted_next_maintenance: string
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface FailurePrediction {
  equipment_area: string
  probability: number
  predicted_failure_date: string
  confidence: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  recommended_action: string
  factors: string[]
}

export interface MaintenanceForecast {
  date: string
  predicted_work_orders: number
  predicted_downtime_hours: number
  predicted_labor_hours: number
  confidence: number
  equipment_areas: string[]
}

export interface PartUsagePattern {
  part_id: string
  part_name: string
  average_usage_per_month: number
  predicted_depletion_date: string | null
  reorder_recommendation: boolean
  confidence: number
  seasonality_factor: number
}

export interface MLMetrics {
  total_work_orders: number
  training_data_days: number
  prediction_accuracy: number
  model_confidence: number
  last_trained: string
}

export function analyzeMaintenancePatterns(workOrders: WorkOrder[]): MaintenancePattern[] {
  if (workOrders.length === 0) return []

  const equipmentGroups = new Map<string, WorkOrder[]>()
  
  workOrders.forEach(wo => {
    const area = wo.equipment_area || 'Unknown'
    if (!equipmentGroups.has(area)) {
      equipmentGroups.set(area, [])
    }
    equipmentGroups.get(area)!.push(wo)
  })

  const patterns: MaintenancePattern[] = []

  equipmentGroups.forEach((orders, equipment) => {
    if (orders.length < 2) return

    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    )

    const intervals: number[] = []
    for (let i = 1; i < sortedOrders.length; i++) {
      const diff = new Date(sortedOrders[i].scheduled_date).getTime() - 
                   new Date(sortedOrders[i - 1].scheduled_date).getTime()
      intervals.push(diff / (1000 * 60 * 60 * 24))
    }

    const avgFrequency = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 30

    const priorityCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    let totalDowntime = 0
    let downtimeCount = 0

    orders.forEach(wo => {
      priorityCounts.set(wo.priority_level, (priorityCounts.get(wo.priority_level) || 0) + 1)
      typeCounts.set(wo.type, (typeCounts.get(wo.type) || 0) + 1)
      if (wo.estimated_downtime_hours) {
        totalDowntime += wo.estimated_downtime_hours
        downtimeCount++
      }
    })

    const mostCommonPriority = Array.from(priorityCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
    
    const mostCommonType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0]

    const avgDowntime = downtimeCount > 0 ? totalDowntime / downtimeCount : 0

    const completedCount = orders.filter(wo => wo.status === 'Completed').length
    const failureRate = orders.length > 0 ? (orders.length - completedCount) / orders.length : 0

    const lastOrder = sortedOrders[sortedOrders.length - 1]
    const predictedNext = new Date(new Date(lastOrder.scheduled_date).getTime() + avgFrequency * 24 * 60 * 60 * 1000)

    const variance = intervals.length > 1
      ? Math.sqrt(intervals.reduce((sum, val) => sum + Math.pow(val - avgFrequency, 2), 0) / intervals.length)
      : 0
    const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / avgFrequency)))

    const recentOrders = sortedOrders.slice(-5)
    const recentAvgFreq = recentOrders.length > 1
      ? recentOrders.slice(1).reduce((sum, wo, i) => {
          const diff = new Date(wo.scheduled_date).getTime() - new Date(recentOrders[i].scheduled_date).getTime()
          return sum + diff / (1000 * 60 * 60 * 24)
        }, 0) / (recentOrders.length - 1)
      : avgFrequency

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (recentAvgFreq < avgFrequency * 0.8) trend = 'increasing'
    else if (recentAvgFreq > avgFrequency * 1.2) trend = 'decreasing'

    patterns.push({
      equipment_area: equipment,
      average_frequency_days: Math.round(avgFrequency * 10) / 10,
      common_priority: mostCommonPriority,
      common_type: mostCommonType,
      average_downtime: Math.round(avgDowntime * 10) / 10,
      failure_rate: Math.round(failureRate * 100) / 100,
      predicted_next_maintenance: predictedNext.toISOString(),
      confidence: Math.round(confidence * 100) / 100,
      trend
    })
  })

  return patterns.sort((a, b) => b.failure_rate - a.failure_rate)
}

export function predictFailures(
  workOrders: WorkOrder[],
  patterns: MaintenancePattern[]
): FailurePrediction[] {
  if (patterns.length === 0) return []

  const predictions: FailurePrediction[] = []
  const now = new Date()

  patterns.forEach(pattern => {
    const equipmentOrders = workOrders.filter(wo => wo.equipment_area === pattern.equipment_area)
    const lastMaintenance = equipmentOrders
      .filter(wo => wo.status === 'Completed')
      .sort((a, b) => new Date(b.completed_at || b.scheduled_date).getTime() - 
                      new Date(a.completed_at || a.scheduled_date).getTime())[0]

    if (!lastMaintenance) return

    const daysSinceLastMaintenance = (now.getTime() - new Date(lastMaintenance.completed_at || lastMaintenance.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
    const expectedDays = pattern.average_frequency_days
    const overdueRatio = daysSinceLastMaintenance / expectedDays

    let probability = 0
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let recommendedAction = 'Continue monitoring'
    const factors: string[] = []

    if (overdueRatio < 0.7) {
      probability = 0.1 + (pattern.failure_rate * 0.2)
      riskLevel = 'low'
      recommendedAction = 'Continue monitoring - maintenance not due yet'
    } else if (overdueRatio < 1.0) {
      probability = 0.3 + (pattern.failure_rate * 0.3)
      riskLevel = 'medium'
      recommendedAction = 'Schedule preventive maintenance soon'
      factors.push('Approaching maintenance interval')
    } else if (overdueRatio < 1.3) {
      probability = 0.6 + (pattern.failure_rate * 0.25)
      riskLevel = 'high'
      recommendedAction = 'Schedule maintenance immediately'
      factors.push('Overdue for maintenance')
      factors.push(`${Math.round(daysSinceLastMaintenance - expectedDays)} days past due`)
    } else {
      probability = 0.8 + (pattern.failure_rate * 0.15)
      riskLevel = 'critical'
      recommendedAction = 'Urgent: Schedule emergency maintenance'
      factors.push('Significantly overdue')
      factors.push(`${Math.round(daysSinceLastMaintenance - expectedDays)} days past due`)
    }

    if (pattern.trend === 'increasing') {
      probability = Math.min(0.99, probability + 0.1)
      factors.push('Increasing maintenance frequency trend')
    }

    if (pattern.failure_rate > 0.3) {
      factors.push(`High historical failure rate (${Math.round(pattern.failure_rate * 100)}%)`)
    }

    if (pattern.common_priority === 'Critical' || pattern.common_priority === 'High') {
      factors.push('Equipment classified as high priority')
    }

    const predictedFailureDate = new Date(
      new Date(lastMaintenance.completed_at || lastMaintenance.scheduled_date).getTime() + 
      expectedDays * 24 * 60 * 60 * 1000
    )

    const confidence = pattern.confidence * (equipmentOrders.length > 10 ? 0.95 : 0.7)

    predictions.push({
      equipment_area: pattern.equipment_area,
      probability: Math.min(0.99, Math.max(0.01, probability)),
      predicted_failure_date: predictedFailureDate.toISOString(),
      confidence: Math.round(confidence * 100) / 100,
      risk_level: riskLevel,
      recommended_action: recommendedAction,
      factors
    })
  })

  return predictions.sort((a, b) => b.probability - a.probability)
}

export function forecastMaintenanceLoad(
  workOrders: WorkOrder[],
  patterns: MaintenancePattern[],
  daysAhead: number = 90
): MaintenanceForecast[] {
  if (patterns.length === 0) return []

  const forecasts: MaintenanceForecast[] = []
  const startDate = new Date()

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = targetDate.toISOString().split('T')[0]

    let predictedWorkOrders = 0
    let predictedDowntime = 0
    let predictedLabor = 0
    const equipmentAreas: string[] = []
    let totalConfidence = 0

    patterns.forEach(pattern => {
      const lastOrder = workOrders
        .filter(wo => wo.equipment_area === pattern.equipment_area)
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())[0]

      if (!lastOrder) return

      const daysSinceLastOrder = (targetDate.getTime() - new Date(lastOrder.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
      const cyclePosition = (daysSinceLastOrder % pattern.average_frequency_days) / pattern.average_frequency_days

      if (cyclePosition > 0.8 && cyclePosition < 1.2) {
        const probability = pattern.confidence * (1 - Math.abs(cyclePosition - 1))
        predictedWorkOrders += probability
        predictedDowntime += pattern.average_downtime * probability
        predictedLabor += (pattern.average_downtime * 1.5) * probability
        equipmentAreas.push(pattern.equipment_area)
        totalConfidence += pattern.confidence
      }
    })

    if (predictedWorkOrders > 0.1) {
      forecasts.push({
        date: dateStr,
        predicted_work_orders: Math.round(predictedWorkOrders * 10) / 10,
        predicted_downtime_hours: Math.round(predictedDowntime * 10) / 10,
        predicted_labor_hours: Math.round(predictedLabor * 10) / 10,
        confidence: Math.round((totalConfidence / patterns.length) * 100) / 100,
        equipment_areas: equipmentAreas
      })
    }
  }

  return forecasts
}

export function analyzePartUsagePatterns(
  parts: PartInventoryItem[],
  transactions: PartTransaction[]
): PartUsagePattern[] {
  if (parts.length === 0 || transactions.length === 0) return []

  const patterns: PartUsagePattern[] = []

  parts.forEach(part => {
    const partTransactions = transactions
      .filter(t => t.part_id === part.part_id && t.transaction_type === 'Use')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    if (partTransactions.length < 2) return

    const firstDate = new Date(partTransactions[0].created_at)
    const lastDate = new Date(partTransactions[partTransactions.length - 1].created_at)
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    const monthsDiff = Math.max(1, daysDiff / 30)

    const totalUsage = partTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const avgUsagePerMonth = totalUsage / monthsDiff

    const monthlyUsage = new Map<string, number>()
    partTransactions.forEach(t => {
      const month = new Date(t.created_at).toISOString().slice(0, 7)
      monthlyUsage.set(month, (monthlyUsage.get(month) || 0) + t.quantity)
    })

    const usageValues = Array.from(monthlyUsage.values())
    const avgMonthly = usageValues.reduce((a, b) => a + b, 0) / usageValues.length
    const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - avgMonthly, 2), 0) / usageValues.length
    const seasonalityFactor = Math.min(2, Math.max(0.5, variance / (avgMonthly + 1)))

    const predictedDepletionDate = avgUsagePerMonth > 0
      ? new Date(Date.now() + (part.quantity_on_hand / avgUsagePerMonth) * 30 * 24 * 60 * 60 * 1000)
      : null

    const reorderRecommendation = part.quantity_on_hand <= part.minimum_stock_level || 
                                  (predictedDepletionDate !== null && 
                                   (predictedDepletionDate.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000)

    const confidence = Math.min(0.9, 0.5 + (partTransactions.length / 20))

    patterns.push({
      part_id: part.part_id,
      part_name: part.part_name,
      average_usage_per_month: Math.round(avgUsagePerMonth * 100) / 100,
      predicted_depletion_date: predictedDepletionDate?.toISOString() || null,
      reorder_recommendation: reorderRecommendation,
      confidence: Math.round(confidence * 100) / 100,
      seasonality_factor: Math.round(seasonalityFactor * 100) / 100
    })
  })

  return patterns.sort((a, b) => {
    if (a.reorder_recommendation !== b.reorder_recommendation) {
      return a.reorder_recommendation ? -1 : 1
    }
    return b.average_usage_per_month - a.average_usage_per_month
  })
}

export function calculateMLMetrics(
  workOrders: WorkOrder[],
  patterns: MaintenancePattern[]
): MLMetrics {
  if (workOrders.length === 0) {
    return {
      total_work_orders: 0,
      training_data_days: 0,
      prediction_accuracy: 0,
      model_confidence: 0,
      last_trained: new Date().toISOString()
    }
  }

  const sortedOrders = [...workOrders].sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  )

  const firstDate = new Date(sortedOrders[0].scheduled_date)
  const lastDate = new Date(sortedOrders[sortedOrders.length - 1].scheduled_date)
  const trainingDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))

  let accuracySum = 0
  let accuracyCount = 0

  patterns.forEach(pattern => {
    const equipmentOrders = workOrders
      .filter(wo => wo.equipment_area === pattern.equipment_area)
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

    if (equipmentOrders.length > 2) {
      const testOrder = equipmentOrders[equipmentOrders.length - 1]
      const prevOrder = equipmentOrders[equipmentOrders.length - 2]
      
      const actualInterval = (new Date(testOrder.scheduled_date).getTime() - 
                              new Date(prevOrder.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
      
      const predictedInterval = pattern.average_frequency_days
      const error = Math.abs(actualInterval - predictedInterval) / actualInterval
      const accuracy = Math.max(0, 1 - error)
      
      accuracySum += accuracy
      accuracyCount++
    }
  })

  const predictionAccuracy = accuracyCount > 0 ? accuracySum / accuracyCount : 0.5

  const avgConfidence = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    : 0.5

  return {
    total_work_orders: workOrders.length,
    training_data_days: trainingDays,
    prediction_accuracy: Math.round(predictionAccuracy * 100) / 100,
    model_confidence: Math.round(avgConfidence * 100) / 100,
    last_trained: new Date().toISOString()
  }
}

export function generateMaintenanceRecommendations(
  predictions: FailurePrediction[],
  workOrders: WorkOrder[],
  employees: Employee[]
): Array<{
  equipment_area: string
  recommendation: string
  priority: string
  estimated_date: string
  suggested_technician?: string
}> {
  const recommendations: Array<{
    equipment_area: string
    recommendation: string
    priority: string
    estimated_date: string
    suggested_technician?: string
  }> = []

  predictions.forEach(prediction => {
    if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {
      const existingOrder = workOrders.find(wo => 
        wo.equipment_area === prediction.equipment_area &&
        wo.status !== 'Completed' &&
        wo.status !== 'Cancelled'
      )

      if (!existingOrder) {
        const priority = prediction.risk_level === 'critical' ? 'Critical' : 'High'
        
        recommendations.push({
          equipment_area: prediction.equipment_area,
          recommendation: prediction.recommended_action,
          priority,
          estimated_date: prediction.predicted_failure_date,
          suggested_technician: employees.length > 0 ? `${employees[0].first_name} ${employees[0].last_name}` : undefined
        })
      }
    }
  })

  return recommendations
}
