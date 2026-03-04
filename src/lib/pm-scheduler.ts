/**
 * Preventive Maintenance (PM) Scheduler
 * 
 * Generates preventive maintenance work orders based on:
 * - Time-based schedules (daily, weekly, monthly, etc.)
 * - Meter-based triggers (hours, cycles, distance)
 * - Condition-based triggers (manual inspection findings)
 */

import { v4 as uuidv4 } from 'uuid'
import { 
  WorkOrder, 
  MaintenanceFrequency, 
  RecurrenceRule, 
  Asset,
  SOP,
  MeterReading
} from './types'

export interface PMSchedule {
  schedule_id: string
  schedule_name: string
  description: string
  asset_id: string | null
  asset_ids: string[]
  sop_id: string | null
  trigger_type: 'time_based' | 'meter_based' | 'condition_based'
  recurrence_rule: RecurrenceRule
  meter_trigger?: MeterTrigger | null
  is_active: boolean
  last_generated_at: string | null
  next_generation_date: string | null
  auto_generate: boolean
  work_order_template: Partial<WorkOrder>
  created_by: string
  created_at: string
  updated_at: string
}

export interface MeterTrigger {
  meter_type: 'hours' | 'cycles' | 'distance' | 'production_units' | 'other'
  trigger_value: number
  trigger_unit: string
  last_reading_value: number
  tolerance_percent: number
}

export interface PMGenerationResult {
  success: boolean
  generated_work_orders: WorkOrder[]
  skipped_schedules: Array<{
    schedule_id: string
    reason: string
  }>
  errors: Array<{
    schedule_id: string
    error: string
  }>
}

/**
 * PM Scheduler Class
 */
export class PMScheduler {
  /**
   * Generate work orders for all active PM schedules
   */
  static generatePMWorkOrders(
    schedules: PMSchedule[],
    assets: Asset[],
    sops: SOP[],
    currentDate: Date = new Date()
  ): PMGenerationResult {
    const result: PMGenerationResult = {
      success: true,
      generated_work_orders: [],
      skipped_schedules: [],
      errors: [],
    }

    const activeSchedules = schedules.filter(s => s.is_active && s.auto_generate)

    for (const schedule of activeSchedules) {
      try {
        const shouldGenerate = this.shouldGenerateWorkOrder(schedule, currentDate)

        if (!shouldGenerate.generate) {
          result.skipped_schedules.push({
            schedule_id: schedule.schedule_id,
            reason: shouldGenerate.reason,
          })
          continue
        }

        const workOrders = this.createWorkOrdersFromSchedule(
          schedule,
          assets,
          sops,
          currentDate
        )

        result.generated_work_orders.push(...workOrders)
      } catch (error) {
        result.errors.push({
          schedule_id: schedule.schedule_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        result.success = false
      }
    }

    return result
  }

  /**
   * Check if a work order should be generated for a schedule
   */
  private static shouldGenerateWorkOrder(
    schedule: PMSchedule,
    currentDate: Date
  ): { generate: boolean; reason: string } {
    // Check if schedule is active
    if (!schedule.is_active || !schedule.auto_generate) {
      return { generate: false, reason: 'Schedule is inactive or auto-generate is disabled' }
    }

    // Check time-based trigger
    if (schedule.trigger_type === 'time_based') {
      if (!schedule.next_generation_date) {
        return { generate: true, reason: 'First time generation' }
      }

      const nextDate = new Date(schedule.next_generation_date)
      if (currentDate >= nextDate) {
        return { generate: true, reason: 'Scheduled date reached' }
      }

      return { generate: false, reason: 'Not yet due' }
    }

    // Check meter-based trigger
    if (schedule.trigger_type === 'meter_based' && schedule.meter_trigger) {
      return this.checkMeterTrigger(schedule.meter_trigger)
    }

    // Condition-based is manual, so skip
    if (schedule.trigger_type === 'condition_based') {
      return { generate: false, reason: 'Condition-based requires manual trigger' }
    }

    return { generate: false, reason: 'Unknown trigger type' }
  }

  /**
   * Check if meter trigger condition is met
   */
  private static checkMeterTrigger(
    trigger: MeterTrigger
  ): { generate: boolean; reason: string } {
    const tolerance = trigger.trigger_value * (trigger.tolerance_percent / 100)
    const thresholdValue = trigger.trigger_value - tolerance

    if (trigger.last_reading_value >= thresholdValue) {
      return {
        generate: true,
        reason: `Meter reading ${trigger.last_reading_value} ${trigger.trigger_unit} reached threshold ${thresholdValue}`,
      }
    }

    return {
      generate: false,
      reason: `Meter reading ${trigger.last_reading_value} below threshold ${thresholdValue}`,
    }
  }

  /**
   * Create work orders from a PM schedule
   */
  private static createWorkOrdersFromSchedule(
    schedule: PMSchedule,
    assets: Asset[],
    sops: SOP[],
    currentDate: Date
  ): WorkOrder[] {
    const workOrders: WorkOrder[] = []

    // Get target assets
    const targetAssets = schedule.asset_ids.length > 0
      ? assets.filter(a => schedule.asset_ids.includes(a.asset_id))
      : schedule.asset_id
      ? assets.filter(a => a.asset_id === schedule.asset_id)
      : []

    if (targetAssets.length === 0) {
      throw new Error('No valid assets found for schedule')
    }

    // Get linked SOP if any
    const linkedSOP = schedule.sop_id ? sops.find(s => s.sop_id === schedule.sop_id) : null

    // Create a work order for each asset
    for (const asset of targetAssets) {
      const scheduledDate = this.calculateNextScheduledDate(
        schedule.recurrence_rule,
        currentDate
      )

      const workOrder: WorkOrder = {
        work_order_id: uuidv4(),
        equipment_area: asset.asset_name,
        priority_level: schedule.work_order_template.priority_level || 'Medium',
        status: 'Scheduled (Not Started)',
        type: schedule.work_order_template.type || 'Maintenance',
        task: schedule.work_order_template.task || `PM: ${schedule.schedule_name}`,
        comments_description: schedule.work_order_template.comments_description || schedule.description,
        scheduled_date: scheduledDate.toISOString(),
        estimated_downtime_hours: schedule.work_order_template.estimated_downtime_hours || 0,
        assigned_technician: schedule.work_order_template.assigned_technician || null,
        entered_by: 'PM_SCHEDULER',
        terminal: schedule.work_order_template.terminal || 'AUTO',
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString(),
        completed_at: null,
        is_overdue: false,
        auto_generated: true,
        linked_sop_ids: linkedSOP ? [linkedSOP.sop_id] : [],
        area_id: asset.area_id,
        required_skill_ids: asset.required_skill_ids || [],
        required_asset_ids: [asset.asset_id],
        recurrence_rule: schedule.recurrence_rule,
      }

      workOrders.push(workOrder)
    }

    return workOrders
  }

  /**
   * Calculate the next scheduled date based on recurrence rule
   */
  private static calculateNextScheduledDate(
    rule: RecurrenceRule,
    fromDate: Date
  ): Date {
    const nextDate = new Date(fromDate)

    switch (rule.frequency) {
      case 'Daily':
        nextDate.setDate(nextDate.getDate() + (rule.interval || 1))
        break
      case 'Weekly':
        nextDate.setDate(nextDate.getDate() + (rule.interval || 1) * 7)
        break
      case 'Monthly':
        nextDate.setMonth(nextDate.getMonth() + (rule.interval || 1))
        break
      case 'Quarterly':
        nextDate.setMonth(nextDate.getMonth() + (rule.interval || 1) * 3)
        break
      case 'Bi-Yearly':
        nextDate.setMonth(nextDate.getMonth() + (rule.interval || 1) * 6)
        break
      case 'Yearly':
        nextDate.setFullYear(nextDate.getFullYear() + (rule.interval || 1))
        break
    }

    return nextDate
  }

  /**
   * Update meter reading and check if PM should be triggered
   */
  static updateMeterReading(
    schedule: PMSchedule,
    newReading: MeterReading
  ): { shouldGenerate: boolean; reason: string } {
    if (schedule.trigger_type !== 'meter_based' || !schedule.meter_trigger) {
      return { shouldGenerate: false, reason: 'Not a meter-based schedule' }
    }

    // Update last reading value
    schedule.meter_trigger.last_reading_value = newReading.reading_value

    // Check if trigger condition is met
    const result = this.checkMeterTrigger(schedule.meter_trigger)
    return { shouldGenerate: result.generate, reason: result.reason }
  }

  /**
   * Calculate PM compliance percentage
   */
  static calculatePMCompliance(
    schedules: PMSchedule[],
    workOrders: WorkOrder[],
    startDate: Date,
    endDate: Date
  ): {
    total_scheduled: number
    completed: number
    pending: number
    overdue: number
    compliance_percent: number
    by_schedule: Array<{
      schedule_id: string
      schedule_name: string
      scheduled: number
      completed: number
      compliance_percent: number
    }>
  } {
    const pmWorkOrders = workOrders.filter(
      wo =>
        wo.auto_generated &&
        new Date(wo.scheduled_date) >= startDate &&
        new Date(wo.scheduled_date) <= endDate
    )

    const total_scheduled = pmWorkOrders.length
    const completed = pmWorkOrders.filter(wo => wo.status === 'Completed').length
    const pending = pmWorkOrders.filter(wo => wo.status !== 'Completed' && !wo.is_overdue).length
    const overdue = pmWorkOrders.filter(wo => wo.is_overdue).length

    const compliance_percent = total_scheduled > 0 ? (completed / total_scheduled) * 100 : 0

    // Calculate compliance by schedule
    const by_schedule = schedules.map(schedule => {
      const scheduleWOs = pmWorkOrders.filter(wo => 
        wo.comments_description?.includes(schedule.schedule_name)
      )
      const scheduleCompleted = scheduleWOs.filter(wo => wo.status === 'Completed').length
      const scheduleTotal = scheduleWOs.length

      return {
        schedule_id: schedule.schedule_id,
        schedule_name: schedule.schedule_name,
        scheduled: scheduleTotal,
        completed: scheduleCompleted,
        compliance_percent: scheduleTotal > 0 ? (scheduleCompleted / scheduleTotal) * 100 : 0,
      }
    })

    return {
      total_scheduled,
      completed,
      pending,
      overdue,
      compliance_percent,
      by_schedule,
    }
  }

  /**
   * Generate PM forecast for upcoming period
   */
  static generatePMForecast(
    schedules: PMSchedule[],
    startDate: Date,
    endDate: Date
  ): Array<{
    date: string
    schedule_id: string
    schedule_name: string
    asset_count: number
    estimated_hours: number
  }> {
    const forecast: Array<{
      date: string
      schedule_id: string
      schedule_name: string
      asset_count: number
      estimated_hours: number
    }> = []

    for (const schedule of schedules.filter(s => s.is_active && s.trigger_type === 'time_based')) {
      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const nextDate = this.calculateNextScheduledDate(schedule.recurrence_rule, currentDate)

        if (nextDate >= startDate && nextDate <= endDate) {
          forecast.push({
            date: nextDate.toISOString().split('T')[0],
            schedule_id: schedule.schedule_id,
            schedule_name: schedule.schedule_name,
            asset_count: schedule.asset_ids.length || 1,
            estimated_hours: (schedule.work_order_template.estimated_downtime_hours || 0) * 
              (schedule.asset_ids.length || 1),
          })
        }

        currentDate = nextDate
      }
    }

    return forecast.sort((a, b) => a.date.localeCompare(b.date))
  }
}
