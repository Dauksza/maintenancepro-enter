import type {
  WorkOrder,
  SOP,
  SparesLabor,
  ExcelImportData,
  ImportValidationError,
  PriorityLevel,
  WorkOrderStatus,
  WorkOrderType,
  MaintenanceFrequency
} from './types'
import { parseLaborTypical, extractFrequencyFromTask, isOverdue } from './maintenance-utils'

export async function parseExcelFile(file: File): Promise<{
  data: ExcelImportData | null
  errors: ImportValidationError[]
}> {
  const errors: ImportValidationError[] = []

  try {
    const text = await file.text()
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    
    const workOrders: WorkOrder[] = []
    const sops: SOP[] = []
    const sparesLabor: SparesLabor[] = []

    let currentSheet = ''
    let headers: string[] = []
    let dataStarted = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.toLowerCase().includes('maintenance tracking')) {
        currentSheet = 'Maintenance Tracking'
        dataStarted = false
        continue
      } else if (line.toLowerCase().includes('sop library')) {
        currentSheet = 'SOP Library'
        dataStarted = false
        continue
      } else if (line.toLowerCase().includes('spares') && line.toLowerCase().includes('labor')) {
        currentSheet = 'Spares & Labor'
        dataStarted = false
        continue
      }

      if (!currentSheet) continue

      const values = parseCSVLine(line)
      
      if (!dataStarted && values.length > 0) {
        headers = values.map(h => h.trim())
        dataStarted = true
        continue
      }

      if (values.length === 0) continue

      try {
        if (currentSheet === 'Maintenance Tracking') {
          const wo = parseWorkOrderRow(headers, values, i + 1)
          if (wo) workOrders.push(wo)
        } else if (currentSheet === 'SOP Library') {
          const sop = parseSOPRow(headers, values, i + 1)
          if (sop) sops.push(sop)
        } else if (currentSheet === 'Spares & Labor') {
          const sl = parseSparesLaborRow(headers, values, i + 1)
          if (sl) sparesLabor.push(sl)
        }
      } catch (error) {
        errors.push({
          sheet: currentSheet,
          row: i + 1,
          column: 'Multiple',
          error: error instanceof Error ? error.message : 'Parse error'
        })
      }
    }

    if (workOrders.length === 0) {
      errors.push({
        sheet: 'Maintenance Tracking',
        row: 0,
        column: 'All',
        error: 'No work orders found'
      })
    }

    return {
      data: {
        workOrders,
        sops,
        sparesLabor
      },
      errors
    }
  } catch (error) {
    return {
      data: null,
      errors: [{
        sheet: 'File',
        row: 0,
        column: 'All',
        error: error instanceof Error ? error.message : 'Failed to parse file'
      }]
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function parseWorkOrderRow(
  headers: string[],
  values: string[],
  rowNum: number
): WorkOrder | null {
  const getVal = (key: string) => {
    const idx = headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
    return idx >= 0 ? values[idx] : ''
  }

  const workOrderId = getVal('workorderid') || getVal('id')
  if (!workOrderId) return null

  const scheduledDate = getVal('scheduleddate') || getVal('date')
  const task = getVal('task') || getVal('description')
  
  const now = new Date().toISOString()
  
  const workOrder: WorkOrder = {
    work_order_id: workOrderId,
    equipment_area: getVal('equipmentarea') || getVal('equipment') || 'Unknown',
    priority_level: (getVal('prioritylevel') || getVal('priority') || 'Medium') as PriorityLevel,
    status: (getVal('status') || 'Scheduled (Not Started)') as WorkOrderStatus,
    type: (getVal('type') || 'Maintenance') as WorkOrderType,
    task: task,
    comments_description: getVal('commentsdescription') || getVal('comments') || '',
    scheduled_date: scheduledDate || now.split('T')[0],
    estimated_downtime_hours: parseFloat(getVal('estimateddowntimehours') || getVal('downtime') || '0'),
    assigned_technician: getVal('assignedtechnician') || null,
    entered_by: getVal('enteredby') || null,
    terminal: getVal('terminal') || 'Hanceville Terminal',
    created_at: now,
    updated_at: now,
    completed_at: null,
    is_overdue: false,
    auto_generated: false
  }

  workOrder.is_overdue = isOverdue(workOrder)

  return workOrder
}

function parseSOPRow(
  headers: string[],
  values: string[],
  rowNum: number
): SOP | null {
  const getVal = (key: string) => {
    const idx = headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
    return idx >= 0 ? values[idx] : ''
  }

  const sopId = getVal('sopid') || getVal('id')
  if (!sopId) return null

  const now = new Date().toISOString()
  
  const pmFreqText = getVal('pmfrequenciesincluded') || getVal('frequencies') || ''
  const frequencies: MaintenanceFrequency[] = []
  if (pmFreqText.toLowerCase().includes('daily')) frequencies.push('Daily')
  if (pmFreqText.toLowerCase().includes('weekly')) frequencies.push('Weekly')
  if (pmFreqText.toLowerCase().includes('monthly')) frequencies.push('Monthly')
  if (pmFreqText.toLowerCase().includes('quarterly')) frequencies.push('Quarterly')
  if (pmFreqText.toLowerCase().includes('bi-yearly')) frequencies.push('Bi-Yearly')
  if (pmFreqText.toLowerCase().includes('yearly') || pmFreqText.toLowerCase().includes('annual')) frequencies.push('Yearly')

  return {
    sop_id: sopId,
    title: getVal('title') || 'Untitled SOP',
    revision: parseInt(getVal('revision') || '1'),
    effective_date: getVal('effectivedate') || now.split('T')[0],
    purpose: getVal('purpose') || '',
    scope: getVal('scope') || '',
    loto_ppe_hazards: getVal('lotoppehazards') || getVal('safety') || '',
    pm_frequencies_included: frequencies,
    procedure_summary: getVal('proceduresummary') || getVal('procedure') || '',
    records_required: getVal('recordsrequired') || getVal('records') || '',
    version_history: [
      {
        revision: parseInt(getVal('revision') || '1'),
        date: getVal('effectivedate') || now.split('T')[0],
        changes: 'Initial version'
      }
    ],
    created_at: now,
    updated_at: now,
    linked_work_orders: []
  }
}

function parseSparesLaborRow(
  headers: string[],
  values: string[],
  rowNum: number
): SparesLabor | null {
  const getVal = (key: string) => {
    const idx = headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
    return idx >= 0 ? values[idx] : ''
  }

  const className = getVal('class') || getVal('equipmentclass')
  if (!className) return null

  const sparesText = getVal('commonspares') || getVal('spares') || ''
  const spares = sparesText
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const laborText = getVal('labortypical') || getVal('labor') || ''
  const labor = parseLaborTypical(laborText)

  return {
    class: className,
    common_spares: spares,
    labor_typical: labor
  }
}

export function generateSampleWorkOrders(): WorkOrder[] {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    {
      work_order_id: 'WO-202401-0001',
      equipment_area: 'Compressor Station 1',
      priority_level: 'High',
      status: 'In Progress',
      type: 'Maintenance',
      task: 'Monthly compressor inspection and lubrication',
      comments_description: 'Check oil levels, inspect for leaks, verify pressure readings',
      scheduled_date: now.toISOString().split('T')[0],
      estimated_downtime_hours: 2.5,
      assigned_technician: 'John Smith',
      entered_by: 'Sarah Johnson',
      terminal: 'Hanceville Terminal',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
      is_overdue: false,
      auto_generated: true
    },
    {
      work_order_id: 'WO-202401-0002',
      equipment_area: 'Valve Actuator Array A',
      priority_level: 'Critical',
      status: 'Overdue',
      type: 'Repair',
      task: 'Replace faulty actuator motor',
      comments_description: 'Motor showing signs of failure, replacement required immediately',
      scheduled_date: yesterday.toISOString().split('T')[0],
      estimated_downtime_hours: 4.0,
      assigned_technician: 'Mike Davis',
      entered_by: 'Sarah Johnson',
      terminal: 'Hanceville Terminal',
      created_at: yesterday.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
      is_overdue: true,
      auto_generated: false
    },
    {
      work_order_id: 'WO-202401-0003',
      equipment_area: 'Heat Exchanger Unit 2',
      priority_level: 'Medium',
      status: 'Scheduled (Not Started)',
      type: 'Inspection',
      task: 'Quarterly thermal efficiency inspection',
      comments_description: 'Verify heat transfer rates, check for fouling',
      scheduled_date: nextWeek.toISOString().split('T')[0],
      estimated_downtime_hours: 1.5,
      assigned_technician: 'John Smith',
      entered_by: 'Admin',
      terminal: 'Hanceville Terminal',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
      is_overdue: false,
      auto_generated: true
    },
    {
      work_order_id: 'WO-202401-0004',
      equipment_area: 'Pump Station B',
      priority_level: 'Low',
      status: 'Completed',
      type: 'Calibration',
      task: 'Calibrate pressure sensors',
      comments_description: 'All sensors calibrated successfully',
      scheduled_date: yesterday.toISOString().split('T')[0],
      estimated_downtime_hours: 1.0,
      assigned_technician: 'Mike Davis',
      entered_by: 'John Smith',
      terminal: 'Hanceville Terminal',
      created_at: yesterday.toISOString(),
      updated_at: now.toISOString(),
      completed_at: now.toISOString(),
      is_overdue: false,
      auto_generated: false
    }
  ]
}

export function generateSampleSOPs(): SOP[] {
  const now = new Date().toISOString()
  
  return [
    {
      sop_id: 'SOP-001',
      title: 'Compressor Maintenance Procedure',
      revision: 3,
      effective_date: '2024-01-01',
      purpose: 'Ensure compressor reliability and prevent unplanned downtime',
      scope: 'Applies to all reciprocating compressors at Hanceville Terminal',
      loto_ppe_hazards: 'LOTO required. PPE: Safety glasses, gloves, hearing protection. Hazards: High pressure, rotating equipment',
      pm_frequencies_included: ['Daily', 'Monthly', 'Quarterly'],
      procedure_summary: '1. Isolate and lockout compressor\n2. Check oil levels and quality\n3. Inspect belts and couplings\n4. Verify pressure relief valves\n5. Test all safety interlocks\n6. Record all readings',
      records_required: 'Maintenance log, oil analysis report, pressure test results',
      version_history: [
        { revision: 3, date: '2024-01-01', changes: 'Added oil analysis requirements' },
        { revision: 2, date: '2023-06-15', changes: 'Updated LOTO procedure' },
        { revision: 1, date: '2023-01-01', changes: 'Initial release' }
      ],
      created_at: now,
      updated_at: now,
      linked_work_orders: []
    },
    {
      sop_id: 'SOP-002',
      title: 'Valve Actuator Inspection',
      revision: 2,
      effective_date: '2024-01-15',
      purpose: 'Maintain valve actuator reliability and prevent leaks',
      scope: 'All pneumatic and electric valve actuators',
      loto_ppe_hazards: 'Verify air/power isolation. PPE: Safety glasses, gloves. Hazards: Stored energy, pinch points',
      pm_frequencies_included: ['Weekly', 'Monthly'],
      procedure_summary: '1. Visual inspection for leaks\n2. Test stroke time\n3. Check air pressure (pneumatic)\n4. Verify limit switches\n5. Lubricate moving parts\n6. Test fail-safe operation',
      records_required: 'Stroke time log, leak inspection checklist',
      version_history: [
        { revision: 2, date: '2024-01-15', changes: 'Added fail-safe testing' },
        { revision: 1, date: '2023-07-01', changes: 'Initial release' }
      ],
      created_at: now,
      updated_at: now,
      linked_work_orders: []
    }
  ]
}

export function generateSampleSparesLabor(): SparesLabor[] {
  return [
    {
      class: 'Compressor',
      common_spares: [
        'Oil filters',
        'Air filters',
        'V-belts',
        'Gasket sets',
        'Pressure relief valves'
      ],
      labor_typical: {
        Daily: 0.25,
        Weekly: 1.0,
        Monthly: 2.5,
        Quarterly: 4.0,
        'Bi-Yearly': 8.0,
        Yearly: 16.0
      }
    },
    {
      class: 'Actuator',
      common_spares: [
        'O-rings',
        'Solenoid valves',
        'Position switches',
        'Mounting hardware'
      ],
      labor_typical: {
        Daily: 0.1,
        Weekly: 0.5,
        Monthly: 1.0,
        Quarterly: 2.0,
        'Bi-Yearly': 3.0,
        Yearly: 6.0
      }
    },
    {
      class: 'Heat Exchanger',
      common_spares: [
        'Gaskets',
        'Tube bundles',
        'Temperature sensors',
        'Pressure gauges'
      ],
      labor_typical: {
        Daily: 0.0,
        Weekly: 0.0,
        Monthly: 1.5,
        Quarterly: 3.0,
        'Bi-Yearly': 6.0,
        Yearly: 12.0
      }
    },
    {
      class: 'Pump',
      common_spares: [
        'Mechanical seals',
        'Impellers',
        'Bearings',
        'Couplings',
        'Vibration sensors'
      ],
      labor_typical: {
        Daily: 0.15,
        Weekly: 0.75,
        Monthly: 2.0,
        Quarterly: 4.0,
        'Bi-Yearly': 8.0,
        Yearly: 16.0
      }
    }
  ]
}
