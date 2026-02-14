import type { WorkOrder } from './types'

export interface RootCausePattern {
  pattern_id: string
  pattern_name: string
  description: string
  equipment_areas: string[]
  common_task_keywords: string[]
  failure_frequency: number
  average_downtime: number
  typical_priority: string
  occurrence_count: number
  affected_work_orders: string[]
  confidence_score: number
  trend: 'increasing' | 'decreasing' | 'stable'
  contributing_factors: string[]
  recommended_prevention: string[]
}

export interface FailureCluster {
  cluster_id: string
  cluster_name: string
  equipment_areas: string[]
  common_symptoms: string[]
  work_order_count: number
  total_downtime_hours: number
  average_resolution_time_days: number
  recurring_interval_days: number | null
  root_cause_hypothesis: string
  prevention_strategies: string[]
}

export interface CausalRelationship {
  cause_equipment: string
  effect_equipment: string
  correlation_strength: number
  description: string
  examples: Array<{
    cause_work_order: string
    effect_work_order: string
    time_lag_days: number
  }>
}

export interface FailureTimeline {
  equipment_area: string
  failures: Array<{
    work_order_id: string
    date: string
    task: string
    downtime_hours: number
    priority: string
    time_since_last_failure_days: number
  }>
  failure_acceleration: boolean
  critical_period_identified: boolean
  critical_period?: {
    start_date: string
    end_date: string
    failure_count: number
  }
}

export interface TaskComplexityAnalysis {
  task_type: string
  complexity_score: number
  average_completion_time_days: number
  failure_rate: number
  requires_multiple_attempts: boolean
  common_complications: string[]
  recommended_improvements: string[]
}

function extractKeywords(text: string): string[] {
  const keywords = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
  
  const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'their', 'what', 'when', 'where', 'which', 'would', 'should', 'could'])
  return [...new Set(keywords.filter(word => !stopWords.has(word)))]
}

function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1)
  const set2 = new Set(keywords2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return union.size > 0 ? intersection.size / union.size : 0
}

export function analyzeRootCausePatterns(workOrders: WorkOrder[]): RootCausePattern[] {
  if (workOrders.length < 5) return []

  const patterns: RootCausePattern[] = []
  const processedClusters = new Set<string>()

  const failureOrders = workOrders.filter(wo => 
    wo.status === 'Completed' || 
    wo.is_overdue || 
    wo.priority_level === 'Critical' || 
    wo.priority_level === 'High'
  )

  failureOrders.forEach((order, index) => {
    if (processedClusters.has(order.work_order_id)) return

    const orderKeywords = extractKeywords(`${order.task} ${order.comments_description}`)
    const relatedOrders: WorkOrder[] = [order]
    const relatedIds = new Set([order.work_order_id])

    failureOrders.forEach((otherOrder, otherIndex) => {
      if (index === otherIndex || relatedIds.has(otherOrder.work_order_id)) return

      const otherKeywords = extractKeywords(`${otherOrder.task} ${otherOrder.comments_description}`)
      const similarity = calculateSimilarity(orderKeywords, otherKeywords)

      const sameEquipment = order.equipment_area === otherOrder.equipment_area
      const samePriority = order.priority_level === otherOrder.priority_level
      const sameType = order.type === otherOrder.type

      const matchScore = similarity * 0.5 + 
                        (sameEquipment ? 0.3 : 0) + 
                        (samePriority ? 0.1 : 0) + 
                        (sameType ? 0.1 : 0)

      if (matchScore > 0.4) {
        relatedOrders.push(otherOrder)
        relatedIds.add(otherOrder.work_order_id)
      }
    })

    if (relatedOrders.length >= 3) {
      relatedOrders.forEach(ro => processedClusters.add(ro.work_order_id))

      const equipmentAreas = [...new Set(relatedOrders.map(ro => ro.equipment_area))]
      const allKeywords = relatedOrders.flatMap(ro => 
        extractKeywords(`${ro.task} ${ro.comments_description}`)
      )
      
      const keywordFrequency = new Map<string, number>()
      allKeywords.forEach(kw => {
        keywordFrequency.set(kw, (keywordFrequency.get(kw) || 0) + 1)
      })
      
      const commonKeywords = Array.from(keywordFrequency.entries())
        .filter(([_, count]) => count >= Math.ceil(relatedOrders.length * 0.3))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([kw]) => kw)

      const totalDowntime = relatedOrders.reduce((sum, ro) => 
        sum + (ro.estimated_downtime_hours || 0), 0
      )
      const avgDowntime = totalDowntime / relatedOrders.length

      const priorityCounts = new Map<string, number>()
      relatedOrders.forEach(ro => {
        priorityCounts.set(ro.priority_level, (priorityCounts.get(ro.priority_level) || 0) + 1)
      })
      const typicalPriority = Array.from(priorityCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0]

      const sortedOrders = [...relatedOrders].sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      )
      
      const firstDate = new Date(sortedOrders[0].scheduled_date)
      const lastDate = new Date(sortedOrders[sortedOrders.length - 1].scheduled_date)
      const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      const failureFrequency = daysDiff > 0 ? relatedOrders.length / (daysDiff / 30) : relatedOrders.length

      const recentCount = relatedOrders.filter(ro => {
        const daysAgo = (Date.now() - new Date(ro.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
        return daysAgo <= 90
      }).length
      
      const olderCount = relatedOrders.length - recentCount
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (recentCount > olderCount * 1.5) trend = 'increasing'
      else if (olderCount > recentCount * 1.5) trend = 'decreasing'

      const contributingFactors: string[] = []
      if (equipmentAreas.length === 1) {
        contributingFactors.push(`Isolated to ${equipmentAreas[0]}`)
      } else {
        contributingFactors.push(`Affects multiple areas: ${equipmentAreas.slice(0, 3).join(', ')}`)
      }

      if (avgDowntime > 4) {
        contributingFactors.push('High downtime impact')
      }

      if (typicalPriority === 'Critical' || typicalPriority === 'High') {
        contributingFactors.push('Classified as high priority')
      }

      if (trend === 'increasing') {
        contributingFactors.push('Increasing frequency over time')
      }

      const hasOverdue = relatedOrders.some(ro => ro.is_overdue)
      if (hasOverdue) {
        contributingFactors.push('Contains overdue maintenance')
      }

      const recommendedPrevention: string[] = []
      if (failureFrequency > 2) {
        recommendedPrevention.push('Implement more frequent preventive maintenance schedule')
      }
      
      if (commonKeywords.some(kw => ['leak', 'fluid', 'oil', 'hydraulic'].includes(kw))) {
        recommendedPrevention.push('Increase inspection frequency for fluid systems')
        recommendedPrevention.push('Check seals and connections regularly')
      }
      
      if (commonKeywords.some(kw => ['electrical', 'power', 'circuit', 'voltage'].includes(kw))) {
        recommendedPrevention.push('Schedule regular electrical system diagnostics')
        recommendedPrevention.push('Verify proper grounding and connections')
      }
      
      if (commonKeywords.some(kw => ['wear', 'worn', 'replace', 'replacement'].includes(kw))) {
        recommendedPrevention.push('Reduce operating hours or load')
        recommendedPrevention.push('Use higher quality replacement parts')
      }

      if (equipmentAreas.length > 1) {
        recommendedPrevention.push('Investigate common operational factors across affected equipment')
      }

      if (avgDowntime > 3) {
        recommendedPrevention.push('Pre-stage spare parts and tools to reduce downtime')
      }

      const confidence = Math.min(0.95, 0.4 + (relatedOrders.length / 20) + (commonKeywords.length / 50))

      const patternName = commonKeywords.slice(0, 3).join(' ') || 
                         `${equipmentAreas[0]} recurring issue`

      patterns.push({
        pattern_id: `RCP-${Date.now()}-${index}`,
        pattern_name: patternName.charAt(0).toUpperCase() + patternName.slice(1),
        description: `Pattern identified across ${relatedOrders.length} work orders with ${Math.round(failureFrequency * 10) / 10} failures per month`,
        equipment_areas: equipmentAreas,
        common_task_keywords: commonKeywords,
        failure_frequency: Math.round(failureFrequency * 100) / 100,
        average_downtime: Math.round(avgDowntime * 100) / 100,
        typical_priority: typicalPriority,
        occurrence_count: relatedOrders.length,
        affected_work_orders: relatedOrders.map(ro => ro.work_order_id),
        confidence_score: Math.round(confidence * 100) / 100,
        trend,
        contributing_factors: contributingFactors,
        recommended_prevention: recommendedPrevention
      })
    }
  })

  return patterns.sort((a, b) => {
    if (a.trend === 'increasing' && b.trend !== 'increasing') return -1
    if (b.trend === 'increasing' && a.trend !== 'increasing') return 1
    return b.failure_frequency - a.failure_frequency
  })
}

export function identifyFailureClusters(workOrders: WorkOrder[]): FailureCluster[] {
  if (workOrders.length < 5) return []

  const equipmentGroups = new Map<string, WorkOrder[]>()
  
  workOrders.forEach(wo => {
    const area = wo.equipment_area || 'Unknown'
    if (!equipmentGroups.has(area)) {
      equipmentGroups.set(area, [])
    }
    equipmentGroups.get(area)!.push(wo)
  })

  const clusters: FailureCluster[] = []

  equipmentGroups.forEach((orders, equipment) => {
    const problemOrders = orders.filter(wo => 
      wo.type === 'Repair' || 
      wo.priority_level === 'Critical' || 
      wo.priority_level === 'High' ||
      wo.is_overdue
    )

    if (problemOrders.length < 3) return

    const symptoms = new Set<string>()
    problemOrders.forEach(wo => {
      const keywords = extractKeywords(`${wo.task} ${wo.comments_description}`)
      keywords.forEach(kw => symptoms.add(kw))
    })

    const commonSymptoms = Array.from(symptoms).slice(0, 8)

    const totalDowntime = problemOrders.reduce((sum, wo) => 
      sum + (wo.estimated_downtime_hours || 0), 0
    )

    const completedOrders = problemOrders.filter(wo => wo.completed_at)
    const avgResolutionTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, wo) => {
          const scheduled = new Date(wo.scheduled_date).getTime()
          const completed = new Date(wo.completed_at!).getTime()
          return sum + (completed - scheduled) / (1000 * 60 * 60 * 24)
        }, 0) / completedOrders.length
      : 0

    const sortedOrders = [...problemOrders].sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    )

    const intervals: number[] = []
    for (let i = 1; i < sortedOrders.length; i++) {
      const diff = (new Date(sortedOrders[i].scheduled_date).getTime() - 
                   new Date(sortedOrders[i - 1].scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
      intervals.push(diff)
    }

    const recurringInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : null

    const rootCauseHypothesis = generateRootCauseHypothesis(problemOrders, commonSymptoms, recurringInterval)
    const preventionStrategies = generatePreventionStrategies(problemOrders, commonSymptoms, recurringInterval)

    clusters.push({
      cluster_id: `FC-${Date.now()}-${equipment}`,
      cluster_name: `${equipment} Failure Cluster`,
      equipment_areas: [equipment],
      common_symptoms: commonSymptoms,
      work_order_count: problemOrders.length,
      total_downtime_hours: Math.round(totalDowntime * 10) / 10,
      average_resolution_time_days: Math.round(avgResolutionTime * 10) / 10,
      recurring_interval_days: recurringInterval !== null ? Math.round(recurringInterval * 10) / 10 : null,
      root_cause_hypothesis: rootCauseHypothesis,
      prevention_strategies: preventionStrategies
    })
  })

  return clusters.sort((a, b) => b.work_order_count - a.work_order_count)
}

function generateRootCauseHypothesis(
  orders: WorkOrder[], 
  symptoms: string[], 
  recurringInterval: number | null
): string {
  const hypotheses: string[] = []

  if (recurringInterval !== null && recurringInterval < 30) {
    hypotheses.push(`Recurring issue every ${Math.round(recurringInterval)} days suggests inadequate repair or underlying system degradation`)
  }

  const hasLeakKeywords = symptoms.some(s => ['leak', 'fluid', 'oil', 'drip', 'seep'].includes(s))
  if (hasLeakKeywords) {
    hypotheses.push('Seal degradation or fitting looseness due to vibration or thermal cycling')
  }

  const hasElectricalKeywords = symptoms.some(s => ['electrical', 'power', 'circuit', 'short', 'voltage'].includes(s))
  if (hasElectricalKeywords) {
    hypotheses.push('Electrical connection issues, possibly due to corrosion or loose terminals')
  }

  const hasWearKeywords = symptoms.some(s => ['wear', 'worn', 'damage', 'broken', 'crack'].includes(s))
  if (hasWearKeywords) {
    hypotheses.push('Component wear exceeding design life, possibly due to excessive load or improper lubrication')
  }

  const hasCalibrateKeywords = symptoms.some(s => ['calibrate', 'adjust', 'alignment', 'drift'].includes(s))
  if (hasCalibrateKeywords) {
    hypotheses.push('Calibration drift suggesting environmental factors or component aging')
  }

  const avgDowntime = orders.reduce((sum, wo) => sum + (wo.estimated_downtime_hours || 0), 0) / orders.length
  if (avgDowntime > 4) {
    hypotheses.push('Extended downtime indicates complex repair or parts availability issues')
  }

  const highPriorityRatio = orders.filter(wo => wo.priority_level === 'Critical' || wo.priority_level === 'High').length / orders.length
  if (highPriorityRatio > 0.7) {
    hypotheses.push('High proportion of critical failures suggests system operating near or beyond capacity')
  }

  if (hypotheses.length === 0) {
    hypotheses.push('Multiple factors contributing to equipment reliability issues')
  }

  return hypotheses[0]
}

function generatePreventionStrategies(
  orders: WorkOrder[], 
  symptoms: string[], 
  recurringInterval: number | null
): string[] {
  const strategies: string[] = []

  if (recurringInterval !== null && recurringInterval < 60) {
    strategies.push('Implement predictive maintenance program with condition monitoring')
    strategies.push('Review and update maintenance procedures to address root cause')
  }

  const hasLeakKeywords = symptoms.some(s => ['leak', 'fluid', 'oil'].includes(s))
  if (hasLeakKeywords) {
    strategies.push('Upgrade to higher quality seals and gaskets')
    strategies.push('Implement weekly visual inspection program')
  }

  const hasElectricalKeywords = symptoms.some(s => ['electrical', 'power', 'circuit'].includes(s))
  if (hasElectricalKeywords) {
    strategies.push('Schedule quarterly thermographic inspections')
    strategies.push('Apply corrosion protection to all connections')
  }

  const hasWearKeywords = symptoms.some(s => ['wear', 'worn', 'damage'].includes(s))
  if (hasWearKeywords) {
    strategies.push('Reduce operating hours or cycles to extend component life')
    strategies.push('Source OEM or premium replacement parts')
  }

  strategies.push('Train technicians on proper diagnostic procedures')
  strategies.push('Maintain adequate spare parts inventory')

  return strategies.slice(0, 5)
}

export function detectCausalRelationships(workOrders: WorkOrder[]): CausalRelationship[] {
  if (workOrders.length < 10) return []

  const relationships: CausalRelationship[] = []
  const equipmentAreas = [...new Set(workOrders.map(wo => wo.equipment_area))]

  equipmentAreas.forEach(causeArea => {
    equipmentAreas.forEach(effectArea => {
      if (causeArea === effectArea) return

      const causeOrders = workOrders
        .filter(wo => wo.equipment_area === causeArea)
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

      const effectOrders = workOrders
        .filter(wo => wo.equipment_area === effectArea)
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

      const correlations: Array<{
        cause_work_order: string
        effect_work_order: string
        time_lag_days: number
      }> = []

      causeOrders.forEach(causeWO => {
        const causeDate = new Date(causeWO.scheduled_date).getTime()

        effectOrders.forEach(effectWO => {
          const effectDate = new Date(effectWO.scheduled_date).getTime()
          const timeLagDays = (effectDate - causeDate) / (1000 * 60 * 60 * 24)

          if (timeLagDays > 0 && timeLagDays < 30) {
            correlations.push({
              cause_work_order: causeWO.work_order_id,
              effect_work_order: effectWO.work_order_id,
              time_lag_days: Math.round(timeLagDays * 10) / 10
            })
          }
        })
      })

      if (correlations.length >= 3) {
        const avgTimeLag = correlations.reduce((sum, c) => sum + c.time_lag_days, 0) / correlations.length
        const correlationStrength = Math.min(0.95, correlations.length / (causeOrders.length * 0.5))

        if (correlationStrength > 0.3) {
          let description = `Failures in ${causeArea} are followed by issues in ${effectArea} `
          description += `approximately ${Math.round(avgTimeLag)} days later. `
          description += `This pattern occurred ${correlations.length} times.`

          relationships.push({
            cause_equipment: causeArea,
            effect_equipment: effectArea,
            correlation_strength: Math.round(correlationStrength * 100) / 100,
            description,
            examples: correlations.slice(0, 5)
          })
        }
      }
    })
  })

  return relationships.sort((a, b) => b.correlation_strength - a.correlation_strength)
}

export function analyzeFailureTimelines(workOrders: WorkOrder[]): FailureTimeline[] {
  if (workOrders.length < 5) return []

  const equipmentGroups = new Map<string, WorkOrder[]>()
  
  workOrders.forEach(wo => {
    const area = wo.equipment_area || 'Unknown'
    if (!equipmentGroups.has(area)) {
      equipmentGroups.set(area, [])
    }
    equipmentGroups.get(area)!.push(wo)
  })

  const timelines: FailureTimeline[] = []

  equipmentGroups.forEach((orders, equipment) => {
    if (orders.length < 3) return

    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    )

    const failures = sortedOrders.map((wo, index) => {
      const timeSinceLast = index > 0
        ? (new Date(wo.scheduled_date).getTime() - 
           new Date(sortedOrders[index - 1].scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
        : 0

      return {
        work_order_id: wo.work_order_id,
        date: wo.scheduled_date,
        task: wo.task,
        downtime_hours: wo.estimated_downtime_hours || 0,
        priority: wo.priority_level,
        time_since_last_failure_days: Math.round(timeSinceLast * 10) / 10
      }
    })

    const intervals = failures.slice(1).map(f => f.time_since_last_failure_days)
    const avgInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 0

    const recentIntervals = intervals.slice(-3)
    const recentAvg = recentIntervals.length > 0
      ? recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length
      : avgInterval

    const failureAcceleration = recentAvg < avgInterval * 0.7 && intervals.length >= 5

    let criticalPeriod: { start_date: string; end_date: string; failure_count: number } | undefined
    let maxFailureCount = 0
    const windowDays = 30

    for (let i = 0; i < sortedOrders.length; i++) {
      const windowStart = new Date(sortedOrders[i].scheduled_date)
      const windowEnd = new Date(windowStart.getTime() + windowDays * 24 * 60 * 60 * 1000)
      
      const failuresInWindow = sortedOrders.filter(wo => {
        const woDate = new Date(wo.scheduled_date)
        return woDate >= windowStart && woDate <= windowEnd
      })

      if (failuresInWindow.length > maxFailureCount) {
        maxFailureCount = failuresInWindow.length
        criticalPeriod = {
          start_date: windowStart.toISOString(),
          end_date: windowEnd.toISOString(),
          failure_count: failuresInWindow.length
        }
      }
    }

    const criticalPeriodIdentified = maxFailureCount >= 4

    timelines.push({
      equipment_area: equipment,
      failures,
      failure_acceleration: failureAcceleration,
      critical_period_identified: criticalPeriodIdentified,
      critical_period: criticalPeriodIdentified ? criticalPeriod : undefined
    })
  })

  return timelines.sort((a, b) => {
    if (a.failure_acceleration !== b.failure_acceleration) {
      return a.failure_acceleration ? -1 : 1
    }
    return b.failures.length - a.failures.length
  })
}

export function analyzeTaskComplexity(workOrders: WorkOrder[]): TaskComplexityAnalysis[] {
  if (workOrders.length < 5) return []

  const taskGroups = new Map<string, WorkOrder[]>()
  
  workOrders.forEach(wo => {
    const taskType = wo.type || 'Unknown'
    if (!taskGroups.has(taskType)) {
      taskGroups.set(taskType, [])
    }
    taskGroups.get(taskType)!.push(wo)
  })

  const analyses: TaskComplexityAnalysis[] = []

  taskGroups.forEach((orders, taskType) => {
    if (orders.length < 3) return

    const completedOrders = orders.filter(wo => wo.completed_at && wo.scheduled_date)
    
    const avgCompletionTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, wo) => {
          const scheduled = new Date(wo.scheduled_date).getTime()
          const completed = new Date(wo.completed_at!).getTime()
          return sum + (completed - scheduled) / (1000 * 60 * 60 * 24)
        }, 0) / completedOrders.length
      : 0

    const failedOrders = orders.filter(wo => wo.status === 'Cancelled' || wo.is_overdue)
    const failureRate = orders.length > 0 ? failedOrders.length / orders.length : 0

    const avgDowntime = orders.reduce((sum, wo) => sum + (wo.estimated_downtime_hours || 0), 0) / orders.length

    const complexityScore = (
      (avgCompletionTime / 7) * 0.3 +
      failureRate * 0.3 +
      (avgDowntime / 10) * 0.2 +
      (orders.filter(wo => wo.priority_level === 'Critical' || wo.priority_level === 'High').length / orders.length) * 0.2
    )

    const requiresMultipleAttempts = failureRate > 0.2 || avgCompletionTime > 7

    const complications = new Set<string>()
    orders.forEach(wo => {
      const keywords = extractKeywords(`${wo.task} ${wo.comments_description}`)
      keywords.forEach(kw => {
        if (['difficult', 'complex', 'issue', 'problem', 'delay', 'wait', 'order', 'part'].includes(kw)) {
          complications.add(kw)
        }
      })
    })

    const commonComplications = Array.from(complications).slice(0, 5)

    const improvements: string[] = []
    if (avgCompletionTime > 5) {
      improvements.push('Develop detailed step-by-step procedures')
      improvements.push('Pre-stage tools and materials before work begins')
    }
    if (failureRate > 0.15) {
      improvements.push('Provide additional technician training')
      improvements.push('Implement peer review before closing work orders')
    }
    if (avgDowntime > 4) {
      improvements.push('Maintain dedicated spare parts inventory')
      improvements.push('Consider scheduling during low-demand periods')
    }

    analyses.push({
      task_type: taskType,
      complexity_score: Math.min(1, Math.max(0, Math.round(complexityScore * 100) / 100)),
      average_completion_time_days: Math.round(avgCompletionTime * 10) / 10,
      failure_rate: Math.round(failureRate * 100) / 100,
      requires_multiple_attempts: requiresMultipleAttempts,
      common_complications: commonComplications,
      recommended_improvements: improvements
    })
  })

  return analyses.sort((a, b) => b.complexity_score - a.complexity_score)
}
