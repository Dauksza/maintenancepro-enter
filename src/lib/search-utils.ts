import type {
  SearchResult,
  SearchFilters,
  WorkOrder,
  Employee,
  Asset,
  PartInventoryItem,
  SOP,
  FormTemplate,
  FormSubmission,
  Area
} from './types'

function calculateRelevanceScore(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  if (lowerText === lowerQuery) return 100
  if (lowerText.startsWith(lowerQuery)) return 90
  if (lowerText.includes(` ${lowerQuery}`)) return 80
  if (lowerText.includes(lowerQuery)) return 70
  
  const words = lowerQuery.split(' ')
  const matchedWords = words.filter(word => lowerText.includes(word))
  return (matchedWords.length / words.length) * 60
}

function highlightMatch(text: string, query: string, maxLength: number = 150): string {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  
  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
  }
  
  const start = Math.max(0, index - 50)
  const end = Math.min(text.length, index + query.length + 50)
  const snippet = text.substring(start, end)
  
  return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '')
}

export function searchWorkOrders(
  workOrders: WorkOrder[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const wo of workOrders) {
    if (filters?.types && !filters.types.includes('work-order')) continue
    if (filters?.status && !filters.status.includes(wo.status)) continue
    if (filters?.priority && !filters.priority.includes(wo.priority_level)) continue
    if (filters?.assigned_to && wo.assigned_technician !== filters.assigned_to) continue
    
    const searchableText = `
      ${wo.work_order_id}
      ${wo.equipment_area}
      ${wo.task}
      ${wo.comments_description}
      ${wo.assigned_technician || ''}
      ${wo.terminal}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(wo.work_order_id, query),
        calculateRelevanceScore(wo.equipment_area, query),
        calculateRelevanceScore(wo.task, query),
        calculateRelevanceScore(wo.comments_description, query) * 0.8
      )

      results.push({
        id: wo.work_order_id,
        type: 'work-order',
        title: `${wo.work_order_id} - ${wo.equipment_area}`,
        subtitle: wo.task,
        description: wo.comments_description,
        status: wo.status,
        priority: wo.priority_level,
        metadata: {
          'Assigned To': wo.assigned_technician || 'Unassigned',
          'Scheduled': new Date(wo.scheduled_date).toLocaleDateString(),
          'Terminal': wo.terminal
        },
        score,
        highlight: highlightMatch(wo.comments_description || wo.task, query)
      })
    }
  }

  return results
}

export function searchEmployees(
  employees: Employee[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const emp of employees) {
    if (filters?.types && !filters.types.includes('employee')) continue
    
    const searchableText = `
      ${emp.employee_id}
      ${emp.first_name}
      ${emp.last_name}
      ${emp.email}
      ${emp.phone}
      ${emp.position}
      ${emp.department}
      ${emp.certifications.join(' ')}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const fullName = `${emp.first_name} ${emp.last_name}`
      const score = Math.max(
        calculateRelevanceScore(emp.employee_id, query),
        calculateRelevanceScore(fullName, query),
        calculateRelevanceScore(emp.email, query),
        calculateRelevanceScore(emp.position, query) * 0.9
      )

      results.push({
        id: emp.employee_id,
        type: 'employee',
        title: fullName,
        subtitle: emp.position,
        description: `${emp.department} - ${emp.shift}`,
        status: emp.status,
        metadata: {
          'Email': emp.email,
          'Phone': emp.phone,
          'Department': emp.department
        },
        score
      })
    }
  }

  return results
}

export function searchAssets(
  assets: Asset[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const asset of assets) {
    if (filters?.types && !filters.types.includes('asset')) continue
    
    const searchableText = `
      ${asset.asset_id}
      ${asset.asset_name}
      ${asset.asset_type}
      ${asset.manufacturer}
      ${asset.model}
      ${asset.serial_number}
      ${asset.notes}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(asset.asset_id, query),
        calculateRelevanceScore(asset.asset_name, query),
        calculateRelevanceScore(asset.serial_number, query),
        calculateRelevanceScore(asset.manufacturer + ' ' + asset.model, query) * 0.9
      )

      results.push({
        id: asset.asset_id,
        type: 'asset',
        title: asset.asset_name,
        subtitle: `${asset.manufacturer} ${asset.model}`,
        description: asset.asset_type,
        status: asset.status,
        metadata: {
          'Serial': asset.serial_number,
          'Category': asset.category,
          'Status': asset.status
        },
        score
      })
    }
  }

  return results
}

export function searchParts(
  parts: PartInventoryItem[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const part of parts) {
    if (filters?.types && !filters.types.includes('part')) continue
    
    const searchableText = `
      ${part.part_id}
      ${part.part_number}
      ${part.part_name}
      ${part.description}
      ${part.manufacturer}
      ${part.supplier}
      ${part.compatible_equipment.join(' ')}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(part.part_id, query),
        calculateRelevanceScore(part.part_number, query),
        calculateRelevanceScore(part.part_name, query),
        calculateRelevanceScore(part.description, query) * 0.8
      )

      results.push({
        id: part.part_id,
        type: 'part',
        title: `${part.part_number} - ${part.part_name}`,
        subtitle: part.manufacturer,
        description: part.description,
        status: part.status,
        metadata: {
          'Quantity': part.quantity_on_hand.toString(),
          'Location': part.location,
          'Category': part.category
        },
        score,
        highlight: highlightMatch(part.description, query)
      })
    }
  }

  return results
}

export function searchSOPs(
  sops: SOP[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const sop of sops) {
    if (filters?.types && !filters.types.includes('sop')) continue
    
    const searchableText = `
      ${sop.sop_id}
      ${sop.title}
      ${sop.purpose}
      ${sop.scope}
      ${sop.procedure_summary}
      ${sop.loto_ppe_hazards}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(sop.sop_id, query),
        calculateRelevanceScore(sop.title, query),
        calculateRelevanceScore(sop.purpose, query) * 0.9,
        calculateRelevanceScore(sop.procedure_summary, query) * 0.8
      )

      results.push({
        id: sop.sop_id,
        type: 'sop',
        title: sop.title,
        subtitle: `Revision ${sop.revision}`,
        description: sop.purpose,
        metadata: {
          'Effective Date': new Date(sop.effective_date).toLocaleDateString(),
          'Revision': sop.revision.toString()
        },
        score,
        highlight: highlightMatch(sop.procedure_summary, query)
      })
    }
  }

  return results
}

export function searchFormTemplates(
  templates: FormTemplate[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const template of templates) {
    if (filters?.types && !filters.types.includes('form-template')) continue
    
    const searchableText = `
      ${template.template_id}
      ${template.template_name}
      ${template.description}
      ${template.category}
      ${template.tags.join(' ')}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(template.template_id, query),
        calculateRelevanceScore(template.template_name, query),
        calculateRelevanceScore(template.description, query) * 0.9
      )

      results.push({
        id: template.template_id,
        type: 'form-template',
        title: template.template_name,
        subtitle: `${template.template_type} - ${template.category}`,
        description: template.description,
        status: template.status,
        metadata: {
          'Type': template.template_type,
          'Version': template.version.toString(),
          'Status': template.status
        },
        score
      })
    }
  }

  return results
}

export function searchFormSubmissions(
  submissions: FormSubmission[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const submission of submissions) {
    if (filters?.types && !filters.types.includes('form-submission')) continue
    
    const searchableText = `
      ${submission.submission_id}
      ${submission.template_name}
      ${submission.submitted_by_name}
      ${submission.notes}
    `.toLowerCase()

    if (searchableText.includes(lowerQuery)) {
      const score = Math.max(
        calculateRelevanceScore(submission.submission_id, query),
        calculateRelevanceScore(submission.template_name, query),
        calculateRelevanceScore(submission.submitted_by_name, query) * 0.9
      )

      results.push({
        id: submission.submission_id,
        type: 'form-submission',
        title: submission.template_name,
        subtitle: `Submitted by ${submission.submitted_by_name}`,
        description: new Date(submission.submission_date).toLocaleDateString(),
        status: submission.status,
        metadata: {
          'Date': new Date(submission.submission_date).toLocaleDateString(),
          'Status': submission.status,
          'Issues': submission.issues_identified.toString()
        },
        score
      })
    }
  }

  return results
}

export function globalSearch(
  query: string,
  {
    workOrders = [],
    employees = [],
    assets = [],
    parts = [],
    sops = [],
    formTemplates = [],
    formSubmissions = []
  }: {
    workOrders?: WorkOrder[]
    employees?: Employee[]
    assets?: Asset[]
    parts?: PartInventoryItem[]
    sops?: SOP[]
    formTemplates?: FormTemplate[]
    formSubmissions?: FormSubmission[]
  },
  filters?: SearchFilters,
  limit: number = 50
): SearchResult[] {
  if (!query || query.trim().length < 2) return []

  const allResults: SearchResult[] = [
    ...searchWorkOrders(workOrders, query, filters),
    ...searchEmployees(employees, query, filters),
    ...searchAssets(assets, query, filters),
    ...searchParts(parts, query, filters),
    ...searchSOPs(sops, query, filters),
    ...searchFormTemplates(formTemplates, query, filters),
    ...searchFormSubmissions(formSubmissions, query, filters)
  ]

  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
