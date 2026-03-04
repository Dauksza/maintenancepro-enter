import ExcelJS from 'exceljs'
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

/** Coerce any ExcelJS cell value to a plain string. */
function cellStr(v: ExcelJS.CellValue): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'object' && 'richText' in v)
    return (v as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('')
  if (typeof v === 'object' && 'result' in v)
    return cellStr((v as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue)
  if (typeof v === 'object' && 'error' in v) return ''
  return String(v)
}

/** Get all non-empty rows from a worksheet as a 2-D string array. */
function sheetToRows(ws: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = []
  ws.eachRow({ includeEmpty: false }, (row) => {
    // row.values is 1-indexed; slice(1) drops the leading undefined
    const cells = (row.values as ExcelJS.CellValue[]).slice(1).map(cellStr)
    // skip fully-blank rows
    if (cells.some(c => c !== '')) rows.push(cells)
  })
  return rows
}

/** Trigger a browser file download from an ArrayBuffer. */
function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function parseExcelFile(file: File): Promise<{
  data: ExcelImportData | null
  errors: ImportValidationError[]
}> {
  const errors: ImportValidationError[] = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(arrayBuffer)

    const workOrders: WorkOrder[] = []
    const sops: SOP[] = []
    const sparesLabor: SparesLabor[] = []

    const maintenanceSheet = wb.getWorksheet('Maintenance Tracking')
    if (maintenanceSheet) {
      const data = sheetToRows(maintenanceSheet)
      if (data.length > 1) {
        const headers = data[0].map(h => h.trim())
        for (let i = 1; i < data.length; i++) {
          try {
            const wo = parseWorkOrderRow(headers, data[i], i + 1)
            if (wo) workOrders.push(wo)
          } catch (error) {
            errors.push({
              sheet: 'Maintenance Tracking',
              row: i + 1,
              column: 'Multiple',
              error: error instanceof Error ? error.message : 'Parse error'
            })
          }
        }
      }
    }

    const sopSheet = wb.getWorksheet('SOP Library')
    if (sopSheet) {
      const data = sheetToRows(sopSheet)
      if (data.length > 1) {
        const headers = data[0].map(h => h.trim())
        for (let i = 1; i < data.length; i++) {
          try {
            const sop = parseSOPRow(headers, data[i], i + 1)
            if (sop) sops.push(sop)
          } catch (error) {
            errors.push({
              sheet: 'SOP Library',
              row: i + 1,
              column: 'Multiple',
              error: error instanceof Error ? error.message : 'Parse error'
            })
          }
        }
      }
    }

    const sparesSheet = wb.getWorksheet('Spares & Labor') ?? wb.getWorksheet('Spares and Labor')
    if (sparesSheet) {
      const data = sheetToRows(sparesSheet)
      if (data.length > 1) {
        const headers = data[0].map(h => h.trim())
        for (let i = 1; i < data.length; i++) {
          try {
            const sl = parseSparesLaborRow(headers, data[i], i + 1)
            if (sl) sparesLabor.push(sl)
          } catch (error) {
            errors.push({
              sheet: 'Spares & Labor',
              row: i + 1,
              column: 'Multiple',
              error: error instanceof Error ? error.message : 'Parse error'
            })
          }
        }
      }
    }

    if (workOrders.length === 0 && sops.length === 0 && sparesLabor.length === 0) {
      errors.push({
        sheet: 'All',
        row: 0,
        column: 'All',
        error: 'No data found in any sheets. Expected sheets: "Maintenance Tracking", "SOP Library", "Spares & Labor"'
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
        error: error instanceof Error ? error.message : 'Failed to parse Excel file'
      }]
    }
  }
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

export async function exportToExcel(data: ExcelImportData): Promise<void> {
  const wb = new ExcelJS.Workbook()

  const woSheet = wb.addWorksheet('Maintenance Tracking')
  woSheet.addRow([
    'Work Order ID', 'Equipment/Area', 'Priority Level', 'Status', 'Type',
    'Task', 'Comments/Description', 'Scheduled Date', 'Estimated Downtime Hours',
    'Assigned Technician', 'Entered By', 'Terminal', 'Created At', 'Updated At',
    'Completed At', 'Is Overdue', 'Auto Generated'
  ])
  data.workOrders.forEach(wo => {
    woSheet.addRow([
      wo.work_order_id, wo.equipment_area, wo.priority_level, wo.status, wo.type,
      wo.task, wo.comments_description, wo.scheduled_date, wo.estimated_downtime_hours,
      wo.assigned_technician || '', wo.entered_by || '', wo.terminal,
      wo.created_at, wo.updated_at, wo.completed_at || '',
      wo.is_overdue ? 'Yes' : 'No', wo.auto_generated ? 'Yes' : 'No'
    ])
  })

  const sopSheet = wb.addWorksheet('SOP Library')
  sopSheet.addRow([
    'SOP ID', 'Title', 'Revision', 'Effective Date', 'Purpose', 'Scope',
    'LOTO/PPE/Hazards', 'PM Frequencies Included', 'Procedure Summary',
    'Records Required', 'Created At', 'Updated At'
  ])
  data.sops.forEach(sop => {
    sopSheet.addRow([
      sop.sop_id, sop.title, sop.revision, sop.effective_date, sop.purpose,
      sop.scope, sop.loto_ppe_hazards, sop.pm_frequencies_included.join(', '),
      sop.procedure_summary, sop.records_required, sop.created_at, sop.updated_at
    ])
  })

  const sparesSheet = wb.addWorksheet('Spares & Labor')
  sparesSheet.addRow(['Class', 'Common Spares', 'Labor Typical'])
  data.sparesLabor.forEach(sl => {
    const laborText = Object.entries(sl.labor_typical)
      .map(([freq, hours]) => `${freq} ${hours}h`)
      .join('; ')
    sparesSheet.addRow([sl.class, sl.common_spares.join(', '), laborText])
  })

  const timestamp = new Date().toISOString().split('T')[0]
  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer as ArrayBuffer, `MaintenancePro_Export_${timestamp}.xlsx`)
}

export async function downloadExcelTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook()

  const woSheet = wb.addWorksheet('Maintenance Tracking')
  woSheet.addRow([
    'Work Order ID', 'Equipment/Area', 'Priority Level', 'Status', 'Type',
    'Task', 'Comments/Description', 'Scheduled Date', 'Estimated Downtime Hours',
    'Assigned Technician', 'Entered By', 'Terminal'
  ])
  woSheet.addRow([
    'WO-202401-0001', 'Compressor Station 1', 'High', 'Scheduled (Not Started)',
    'Maintenance', 'Monthly compressor inspection', 'Check oil levels and pressure',
    '2024-02-01', 2.5, 'John Smith', 'Admin', 'Hanceville Terminal'
  ])
  woSheet.addRow([
    'WO-202401-0002', 'Valve Actuator Array A', 'Medium', 'In Progress',
    'Inspection', 'Quarterly actuator inspection', 'Test stroke time and verify operation',
    '2024-02-05', 1.0, 'Jane Doe', 'Admin', 'Hanceville Terminal'
  ])

  const sopSheet = wb.addWorksheet('SOP Library')
  sopSheet.addRow([
    'SOP ID', 'Title', 'Revision', 'Effective Date', 'Purpose', 'Scope',
    'LOTO/PPE/Hazards', 'PM Frequencies Included', 'Procedure Summary', 'Records Required'
  ])
  sopSheet.addRow([
    'SOP-001', 'Compressor Maintenance Procedure', 3, '2024-01-01',
    'Ensure compressor reliability', 'All reciprocating compressors',
    'LOTO required. PPE: Safety glasses, gloves, hearing protection',
    'Daily, Monthly, Quarterly', '1. Isolate compressor\n2. Check oil levels\n3. Inspect components',
    'Maintenance log, oil analysis'
  ])
  sopSheet.addRow([
    'SOP-002', 'Valve Actuator Inspection', 2, '2024-01-15',
    'Maintain actuator reliability', 'All pneumatic and electric actuators',
    'Verify air/power isolation. PPE: Safety glasses, gloves',
    'Weekly, Monthly', '1. Visual inspection\n2. Test stroke time\n3. Lubricate parts',
    'Stroke time log, inspection checklist'
  ])

  const sparesSheet = wb.addWorksheet('Spares & Labor')
  sparesSheet.addRow(['Class', 'Common Spares', 'Labor Typical'])
  sparesSheet.addRow(['Compressor', 'Oil filters, Air filters, V-belts, Gasket sets',
    'Daily 0.25h; Weekly 1h; Monthly 2.5h; Quarterly 4h; Bi-Yearly 8h; Yearly 16h'])
  sparesSheet.addRow(['Actuator', 'O-rings, Solenoid valves, Position switches',
    'Daily 0.1h; Weekly 0.5h; Monthly 1h; Quarterly 2h; Bi-Yearly 3h; Yearly 6h'])
  sparesSheet.addRow(['Pump', 'Mechanical seals, Impellers, Bearings, Couplings',
    'Daily 0.15h; Weekly 0.75h; Monthly 2h; Quarterly 4h; Bi-Yearly 8h; Yearly 16h'])

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer as ArrayBuffer, 'MaintenancePro_Template.xlsx')
}
