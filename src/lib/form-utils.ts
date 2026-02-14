import { 
  FormTemplate, 
  FormSection, 
  FormField, 
  FormSubmission,
  JHAHazard,
  InspectionItem,
  HazardLevel,
  FormFieldResponse
} from './types'

export function generatePremadeTemplates(): FormTemplate[] {
  return [
    createGeneralJHATemplate(),
    createElectricalWorkJHATemplate(),
    createConfinedSpaceJHATemplate(),
    createHotWorkJHATemplate(),
    createEquipmentInspectionTemplate(),
    createVehicleInspectionTemplate(),
    createSafetyWalkInspectionTemplate(),
    createLockoutTagoutInspectionTemplate(),
    createFireExtinguisherInspectionTemplate(),
    createPPEInspectionTemplate(),
  ]
}

function createGeneralJHATemplate(): FormTemplate {
  return {
    template_id: 'jha-general-001',
    template_name: 'General Job Hazard Analysis',
    template_type: 'JHA',
    description: 'Standard JHA form for identifying and mitigating workplace hazards for any maintenance task',
    category: 'Safety',
    is_premade: true,
    sections: [
      {
        section_id: 'section-job-info',
        title: 'Job Information',
        description: 'Basic information about the job being performed',
        fields: [
          {
            field_id: 'job-title',
            field_type: 'text',
            label: 'Job/Task Title',
            required: true,
            order: 1
          },
          {
            field_id: 'job-location',
            field_type: 'text',
            label: 'Job Location',
            required: true,
            order: 2
          },
          {
            field_id: 'job-date',
            field_type: 'date',
            label: 'Date of Analysis',
            required: true,
            order: 3
          },
          {
            field_id: 'conducted-by',
            field_type: 'text',
            label: 'Analysis Conducted By',
            required: true,
            order: 4
          },
          {
            field_id: 'reviewed-by',
            field_type: 'text',
            label: 'Reviewed By (Supervisor)',
            required: false,
            order: 5
          },
        ],
        order: 1
      },
      {
        section_id: 'section-ppe',
        title: 'Required PPE',
        description: 'Personal protective equipment required for this job',
        fields: [
          {
            field_id: 'ppe-hard-hat',
            field_type: 'checkbox',
            label: 'Hard Hat',
            required: false,
            order: 1
          },
          {
            field_id: 'ppe-safety-glasses',
            field_type: 'checkbox',
            label: 'Safety Glasses',
            required: false,
            order: 2
          },
          {
            field_id: 'ppe-gloves',
            field_type: 'checkbox',
            label: 'Gloves',
            required: false,
            order: 3
          },
          {
            field_id: 'ppe-steel-toe',
            field_type: 'checkbox',
            label: 'Steel-Toe Boots',
            required: false,
            order: 4
          },
          {
            field_id: 'ppe-hearing',
            field_type: 'checkbox',
            label: 'Hearing Protection',
            required: false,
            order: 5
          },
          {
            field_id: 'ppe-respirator',
            field_type: 'checkbox',
            label: 'Respirator',
            required: false,
            order: 6
          },
          {
            field_id: 'ppe-fall-protection',
            field_type: 'checkbox',
            label: 'Fall Protection',
            required: false,
            order: 7
          },
          {
            field_id: 'ppe-other',
            field_type: 'text',
            label: 'Other PPE',
            required: false,
            order: 8
          },
        ],
        order: 2
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: true,
    approval_workflow: ['supervisor', 'safety-manager'],
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Maintenance', 'Repair'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'jha', 'hazard-analysis', 'general']
  }
}

function createElectricalWorkJHATemplate(): FormTemplate {
  return {
    template_id: 'jha-electrical-001',
    template_name: 'Electrical Work JHA',
    template_type: 'JHA',
    description: 'Job hazard analysis specifically for electrical maintenance and repair work',
    category: 'Safety - Electrical',
    is_premade: true,
    sections: [
      {
        section_id: 'section-electrical-info',
        title: 'Electrical Work Information',
        fields: [
          {
            field_id: 'work-description',
            field_type: 'textarea',
            label: 'Work Description',
            required: true,
            order: 1
          },
          {
            field_id: 'voltage-level',
            field_type: 'select',
            label: 'Voltage Level',
            options: ['Low Voltage (<50V)', 'Medium Voltage (50-1000V)', 'High Voltage (>1000V)'],
            required: true,
            order: 2
          },
          {
            field_id: 'energized-work',
            field_type: 'radio',
            label: 'Will work be performed on energized equipment?',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'arc-flash-ppe',
            field_type: 'select',
            label: 'Arc Flash PPE Category',
            options: ['Category 0', 'Category 1', 'Category 2', 'Category 3', 'Category 4'],
            required: true,
            conditional: {
              show_if_field: 'energized-work',
              show_if_value: 'Yes'
            },
            order: 4
          },
          {
            field_id: 'lockout-required',
            field_type: 'checkbox',
            label: 'Lockout/Tagout Required',
            required: false,
            order: 5
          },
          {
            field_id: 'test-equipment',
            field_type: 'textarea',
            label: 'Test Equipment Required',
            required: false,
            order: 6
          },
        ],
        order: 1
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: true,
    approval_workflow: ['supervisor', 'electrical-manager', 'safety-manager'],
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Maintenance', 'Repair', 'Calibration'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'jha', 'electrical', 'lockout-tagout', 'arc-flash']
  }
}

function createConfinedSpaceJHATemplate(): FormTemplate {
  return {
    template_id: 'jha-confined-space-001',
    template_name: 'Confined Space Entry JHA',
    template_type: 'JHA',
    description: 'Comprehensive JHA for confined space entry operations',
    category: 'Safety - Confined Space',
    is_premade: true,
    sections: [
      {
        section_id: 'section-space-info',
        title: 'Confined Space Information',
        fields: [
          {
            field_id: 'space-location',
            field_type: 'text',
            label: 'Confined Space Location/ID',
            required: true,
            order: 1
          },
          {
            field_id: 'entry-date',
            field_type: 'datetime',
            label: 'Entry Date/Time',
            required: true,
            order: 2
          },
          {
            field_id: 'permit-number',
            field_type: 'text',
            label: 'Entry Permit Number',
            required: true,
            order: 3
          },
          {
            field_id: 'atmospheric-test',
            field_type: 'radio',
            label: 'Atmospheric Testing Completed',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
          {
            field_id: 'oxygen-level',
            field_type: 'number',
            label: 'Oxygen Level (%)',
            validation: { min: 0, max: 100 },
            required: true,
            order: 5
          },
          {
            field_id: 'lel-level',
            field_type: 'number',
            label: 'LEL Level (%)',
            validation: { min: 0, max: 100 },
            required: true,
            order: 6
          },
          {
            field_id: 'h2s-level',
            field_type: 'number',
            label: 'H2S Level (ppm)',
            required: true,
            order: 7
          },
          {
            field_id: 'co-level',
            field_type: 'number',
            label: 'CO Level (ppm)',
            required: true,
            order: 8
          },
          {
            field_id: 'ventilation',
            field_type: 'radio',
            label: 'Mechanical Ventilation Required',
            options: ['Yes', 'No'],
            required: true,
            order: 9
          },
          {
            field_id: 'standby-person',
            field_type: 'text',
            label: 'Standby Person Name',
            required: true,
            order: 10
          },
          {
            field_id: 'rescue-equipment',
            field_type: 'textarea',
            label: 'Rescue Equipment Available',
            required: true,
            order: 11
          },
        ],
        order: 1
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: true,
    approval_workflow: ['entry-supervisor', 'safety-manager'],
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Maintenance', 'Repair', 'Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'jha', 'confined-space', 'permit-required']
  }
}

function createHotWorkJHATemplate(): FormTemplate {
  return {
    template_id: 'jha-hot-work-001',
    template_name: 'Hot Work Permit JHA',
    template_type: 'JHA',
    description: 'JHA for hot work operations including welding, cutting, and grinding',
    category: 'Safety - Hot Work',
    is_premade: true,
    sections: [
      {
        section_id: 'section-hot-work',
        title: 'Hot Work Details',
        fields: [
          {
            field_id: 'work-type',
            field_type: 'select',
            label: 'Type of Hot Work',
            options: ['Welding', 'Cutting', 'Grinding', 'Brazing', 'Soldering', 'Other'],
            required: true,
            order: 1
          },
          {
            field_id: 'permit-number',
            field_type: 'text',
            label: 'Hot Work Permit Number',
            required: true,
            order: 2
          },
          {
            field_id: 'fire-watch',
            field_type: 'text',
            label: 'Fire Watch Person',
            required: true,
            order: 3
          },
          {
            field_id: 'fire-extinguisher',
            field_type: 'radio',
            label: 'Fire Extinguisher Present',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
          {
            field_id: 'combustibles-removed',
            field_type: 'radio',
            label: 'Combustibles Removed/Protected',
            options: ['Yes', 'No'],
            required: true,
            order: 5
          },
          {
            field_id: 'fire-blankets',
            field_type: 'checkbox',
            label: 'Fire Blankets Available',
            required: false,
            order: 6
          },
          {
            field_id: 'gas-test',
            field_type: 'radio',
            label: 'Flammable Gas Test Completed',
            options: ['Yes', 'No', 'N/A'],
            required: true,
            order: 7
          },
        ],
        order: 1
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: true,
    approval_workflow: ['supervisor', 'fire-safety-officer'],
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Maintenance', 'Repair'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'jha', 'hot-work', 'welding', 'fire-safety']
  }
}

function createEquipmentInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-equipment-001',
    template_name: 'General Equipment Inspection',
    template_type: 'Inspection',
    description: 'Standard equipment inspection checklist for routine maintenance',
    category: 'Inspection',
    is_premade: true,
    sections: [
      {
        section_id: 'section-equipment-info',
        title: 'Equipment Information',
        fields: [
          {
            field_id: 'equipment-id',
            field_type: 'text',
            label: 'Equipment ID/Tag Number',
            required: true,
            order: 1
          },
          {
            field_id: 'equipment-name',
            field_type: 'text',
            label: 'Equipment Name',
            required: true,
            order: 2
          },
          {
            field_id: 'inspection-date',
            field_type: 'date',
            label: 'Inspection Date',
            required: true,
            order: 3
          },
          {
            field_id: 'inspector-name',
            field_type: 'text',
            label: 'Inspector Name',
            required: true,
            order: 4
          },
        ],
        order: 1
      },
      {
        section_id: 'section-visual',
        title: 'Visual Inspection',
        fields: [
          {
            field_id: 'overall-condition',
            field_type: 'rating',
            label: 'Overall Condition',
            required: true,
            validation: { min: 1, max: 5 },
            order: 1
          },
          {
            field_id: 'cleanliness',
            field_type: 'radio',
            label: 'Cleanliness',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            required: true,
            order: 2
          },
          {
            field_id: 'damage-present',
            field_type: 'radio',
            label: 'Visible Damage',
            options: ['None', 'Minor', 'Moderate', 'Severe'],
            required: true,
            order: 3
          },
          {
            field_id: 'corrosion',
            field_type: 'radio',
            label: 'Corrosion Present',
            options: ['None', 'Minor', 'Moderate', 'Severe'],
            required: true,
            order: 4
          },
          {
            field_id: 'leaks',
            field_type: 'radio',
            label: 'Leaks Detected',
            options: ['None', 'Minor', 'Major'],
            required: true,
            order: 5
          },
          {
            field_id: 'loose-parts',
            field_type: 'checkbox',
            label: 'Loose Parts/Fasteners',
            required: false,
            order: 6
          },
        ],
        order: 2
      },
      {
        section_id: 'section-operational',
        title: 'Operational Check',
        fields: [
          {
            field_id: 'operates-normally',
            field_type: 'radio',
            label: 'Equipment Operates Normally',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'unusual-noise',
            field_type: 'radio',
            label: 'Unusual Noises',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 2
          },
          {
            field_id: 'vibration',
            field_type: 'radio',
            label: 'Excessive Vibration',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 3
          },
          {
            field_id: 'temperature',
            field_type: 'radio',
            label: 'Operating Temperature',
            options: ['Normal', 'Elevated', 'Excessive'],
            required: true,
            order: 4
          },
        ],
        order: 3
      },
      {
        section_id: 'section-safety',
        title: 'Safety Systems',
        fields: [
          {
            field_id: 'guards-intact',
            field_type: 'radio',
            label: 'Guards/Barriers Intact',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'emergency-stop',
            field_type: 'radio',
            label: 'Emergency Stop Functional',
            options: ['Yes', 'No', 'N/A'],
            required: true,
            order: 2
          },
          {
            field_id: 'safety-labels',
            field_type: 'radio',
            label: 'Safety Labels Present/Legible',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
        ],
        order: 4
      },
      {
        section_id: 'section-results',
        title: 'Inspection Results',
        fields: [
          {
            field_id: 'pass-fail',
            field_type: 'radio',
            label: 'Inspection Result',
            options: ['Pass', 'Pass with Recommendations', 'Fail'],
            required: true,
            order: 1
          },
          {
            field_id: 'deficiencies',
            field_type: 'textarea',
            label: 'Deficiencies/Issues Found',
            required: false,
            order: 2
          },
          {
            field_id: 'recommendations',
            field_type: 'textarea',
            label: 'Recommendations',
            required: false,
            order: 3
          },
          {
            field_id: 'next-inspection',
            field_type: 'date',
            label: 'Next Inspection Due',
            required: true,
            order: 4
          },
        ],
        order: 5
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: false,
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection', 'Maintenance'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['inspection', 'equipment', 'preventive-maintenance']
  }
}

function createVehicleInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-vehicle-001',
    template_name: 'Vehicle Daily Inspection',
    template_type: 'Inspection',
    description: 'Daily pre-trip vehicle inspection checklist',
    category: 'Inspection - Vehicle',
    is_premade: true,
    sections: [
      {
        section_id: 'section-vehicle-info',
        title: 'Vehicle Information',
        fields: [
          {
            field_id: 'vehicle-number',
            field_type: 'text',
            label: 'Vehicle Number',
            required: true,
            order: 1
          },
          {
            field_id: 'odometer',
            field_type: 'number',
            label: 'Odometer Reading',
            required: true,
            order: 2
          },
          {
            field_id: 'inspection-date',
            field_type: 'datetime',
            label: 'Inspection Date/Time',
            required: true,
            order: 3
          },
          {
            field_id: 'driver-name',
            field_type: 'text',
            label: 'Driver Name',
            required: true,
            order: 4
          },
        ],
        order: 1
      },
      {
        section_id: 'section-exterior',
        title: 'Exterior Inspection',
        fields: [
          {
            field_id: 'body-damage',
            field_type: 'radio',
            label: 'Body Damage',
            options: ['None', 'Minor', 'Requires Repair'],
            required: true,
            order: 1
          },
          {
            field_id: 'lights',
            field_type: 'radio',
            label: 'All Lights Working',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'mirrors',
            field_type: 'radio',
            label: 'Mirrors Intact/Adjusted',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'tires',
            field_type: 'radio',
            label: 'Tire Condition',
            options: ['Good', 'Adequate', 'Needs Replacement'],
            required: true,
            order: 4
          },
          {
            field_id: 'tire-pressure',
            field_type: 'radio',
            label: 'Tire Pressure',
            options: ['Normal', 'Low', 'Check Required'],
            required: true,
            order: 5
          },
        ],
        order: 2
      },
      {
        section_id: 'section-fluids',
        title: 'Fluid Levels',
        fields: [
          {
            field_id: 'engine-oil',
            field_type: 'radio',
            label: 'Engine Oil',
            options: ['Full', 'Add', 'Low'],
            required: true,
            order: 1
          },
          {
            field_id: 'coolant',
            field_type: 'radio',
            label: 'Coolant',
            options: ['Full', 'Add', 'Low'],
            required: true,
            order: 2
          },
          {
            field_id: 'brake-fluid',
            field_type: 'radio',
            label: 'Brake Fluid',
            options: ['Full', 'Add', 'Low'],
            required: true,
            order: 3
          },
          {
            field_id: 'windshield-washer',
            field_type: 'radio',
            label: 'Windshield Washer Fluid',
            options: ['Full', 'Add', 'Empty'],
            required: true,
            order: 4
          },
        ],
        order: 3
      },
      {
        section_id: 'section-safety',
        title: 'Safety Equipment',
        fields: [
          {
            field_id: 'seatbelts',
            field_type: 'radio',
            label: 'Seatbelts Functional',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'horn',
            field_type: 'radio',
            label: 'Horn Works',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'wipers',
            field_type: 'radio',
            label: 'Wipers Functional',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'fire-extinguisher',
            field_type: 'radio',
            label: 'Fire Extinguisher Present',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
          {
            field_id: 'first-aid-kit',
            field_type: 'radio',
            label: 'First Aid Kit Present',
            options: ['Yes', 'No'],
            required: true,
            order: 5
          },
        ],
        order: 4
      },
      {
        section_id: 'section-result',
        title: 'Inspection Result',
        fields: [
          {
            field_id: 'vehicle-status',
            field_type: 'radio',
            label: 'Vehicle Status',
            options: ['Safe to Operate', 'Operate with Caution', 'Out of Service'],
            required: true,
            order: 1
          },
          {
            field_id: 'issues-found',
            field_type: 'textarea',
            label: 'Issues/Defects Found',
            required: false,
            order: 2
          },
        ],
        order: 5
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: false,
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['inspection', 'vehicle', 'daily', 'pre-trip']
  }
}

function createSafetyWalkInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-safety-walk-001',
    template_name: 'Safety Walk-Through Inspection',
    template_type: 'Safety',
    description: 'Workplace safety inspection for identifying hazards and compliance issues',
    category: 'Safety',
    is_premade: true,
    sections: [
      {
        section_id: 'section-info',
        title: 'Inspection Information',
        fields: [
          {
            field_id: 'area-inspected',
            field_type: 'text',
            label: 'Area/Department Inspected',
            required: true,
            order: 1
          },
          {
            field_id: 'inspection-date',
            field_type: 'date',
            label: 'Inspection Date',
            required: true,
            order: 2
          },
          {
            field_id: 'inspector',
            field_type: 'text',
            label: 'Inspector Name',
            required: true,
            order: 3
          },
        ],
        order: 1
      },
      {
        section_id: 'section-housekeeping',
        title: 'Housekeeping',
        fields: [
          {
            field_id: 'floors-clean',
            field_type: 'radio',
            label: 'Floors Clean and Dry',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'aisles-clear',
            field_type: 'radio',
            label: 'Aisles and Exits Clear',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'materials-stored',
            field_type: 'radio',
            label: 'Materials Properly Stored',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'waste-disposal',
            field_type: 'radio',
            label: 'Waste Properly Disposed',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
        ],
        order: 2
      },
      {
        section_id: 'section-hazards',
        title: 'Hazard Identification',
        fields: [
          {
            field_id: 'slip-trip-hazards',
            field_type: 'radio',
            label: 'Slip/Trip Hazards Present',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 1
          },
          {
            field_id: 'electrical-hazards',
            field_type: 'radio',
            label: 'Electrical Hazards',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 2
          },
          {
            field_id: 'chemical-hazards',
            field_type: 'radio',
            label: 'Chemical Hazards',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 3
          },
          {
            field_id: 'fall-hazards',
            field_type: 'radio',
            label: 'Fall Hazards',
            options: ['None', 'Minor', 'Significant'],
            required: true,
            order: 4
          },
        ],
        order: 3
      },
      {
        section_id: 'section-ppe',
        title: 'PPE Compliance',
        fields: [
          {
            field_id: 'ppe-worn',
            field_type: 'radio',
            label: 'Employees Wearing Required PPE',
            options: ['Yes', 'Partial', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'ppe-available',
            field_type: 'radio',
            label: 'PPE Available and Accessible',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'ppe-condition',
            field_type: 'radio',
            label: 'PPE in Good Condition',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
        ],
        order: 4
      },
      {
        section_id: 'section-summary',
        title: 'Inspection Summary',
        fields: [
          {
            field_id: 'overall-score',
            field_type: 'rating',
            label: 'Overall Safety Score',
            validation: { min: 1, max: 5 },
            required: true,
            order: 1
          },
          {
            field_id: 'hazards-identified',
            field_type: 'number',
            label: 'Number of Hazards Identified',
            required: true,
            order: 2
          },
          {
            field_id: 'corrective-actions',
            field_type: 'textarea',
            label: 'Required Corrective Actions',
            required: false,
            order: 3
          },
        ],
        order: 5
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: false,
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'inspection', 'workplace', 'hazard-identification']
  }
}

function createLockoutTagoutInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-loto-001',
    template_name: 'Lockout/Tagout Inspection',
    template_type: 'Safety',
    description: 'LOTO equipment and procedure inspection',
    category: 'Safety - LOTO',
    is_premade: true,
    sections: [
      {
        section_id: 'section-loto-info',
        title: 'LOTO Information',
        fields: [
          {
            field_id: 'equipment-id',
            field_type: 'text',
            label: 'Equipment ID',
            required: true,
            order: 1
          },
          {
            field_id: 'inspection-date',
            field_type: 'date',
            label: 'Inspection Date',
            required: true,
            order: 2
          },
          {
            field_id: 'inspector',
            field_type: 'text',
            label: 'Inspector Name',
            required: true,
            order: 3
          },
        ],
        order: 1
      },
      {
        section_id: 'section-devices',
        title: 'LOTO Devices',
        fields: [
          {
            field_id: 'locks-adequate',
            field_type: 'radio',
            label: 'Adequate Number of Locks',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'locks-labeled',
            field_type: 'radio',
            label: 'Locks Properly Labeled',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'tags-legible',
            field_type: 'radio',
            label: 'Tags Legible and Intact',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'devices-secured',
            field_type: 'radio',
            label: 'Devices Properly Secured',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
        ],
        order: 2
      },
      {
        section_id: 'section-procedure',
        title: 'Procedure Compliance',
        fields: [
          {
            field_id: 'energy-sources',
            field_type: 'radio',
            label: 'All Energy Sources Identified',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'isolation-points',
            field_type: 'radio',
            label: 'Isolation Points Documented',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'zero-energy-verified',
            field_type: 'radio',
            label: 'Zero Energy State Verified',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'stored-energy',
            field_type: 'radio',
            label: 'Stored Energy Released',
            options: ['Yes', 'No', 'N/A'],
            required: true,
            order: 4
          },
        ],
        order: 3
      },
      {
        section_id: 'section-result',
        title: 'Inspection Result',
        fields: [
          {
            field_id: 'compliant',
            field_type: 'radio',
            label: 'LOTO Procedure Compliant',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'deficiencies',
            field_type: 'textarea',
            label: 'Deficiencies Found',
            required: false,
            order: 2
          },
        ],
        order: 4
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: true,
    approval_workflow: ['safety-manager'],
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'inspection', 'loto', 'lockout-tagout', 'energy-control']
  }
}

function createFireExtinguisherInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-fire-ext-001',
    template_name: 'Fire Extinguisher Inspection',
    template_type: 'Inspection',
    description: 'Monthly fire extinguisher inspection checklist',
    category: 'Safety - Fire',
    is_premade: true,
    sections: [
      {
        section_id: 'section-extinguisher-info',
        title: 'Extinguisher Information',
        fields: [
          {
            field_id: 'extinguisher-id',
            field_type: 'text',
            label: 'Extinguisher ID/Tag Number',
            required: true,
            order: 1
          },
          {
            field_id: 'location',
            field_type: 'text',
            label: 'Location',
            required: true,
            order: 2
          },
          {
            field_id: 'inspection-date',
            field_type: 'date',
            label: 'Inspection Date',
            required: true,
            order: 3
          },
          {
            field_id: 'inspector',
            field_type: 'text',
            label: 'Inspector Initials',
            required: true,
            order: 4
          },
        ],
        order: 1
      },
      {
        section_id: 'section-visual',
        title: 'Visual Inspection',
        fields: [
          {
            field_id: 'accessible',
            field_type: 'radio',
            label: 'Accessible and Visible',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'signage',
            field_type: 'radio',
            label: 'Signage Present',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
          {
            field_id: 'instructions-legible',
            field_type: 'radio',
            label: 'Operating Instructions Legible',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
          {
            field_id: 'seal-intact',
            field_type: 'radio',
            label: 'Safety Seal Intact',
            options: ['Yes', 'No'],
            required: true,
            order: 4
          },
          {
            field_id: 'pin-intact',
            field_type: 'radio',
            label: 'Tamper Pin Intact',
            options: ['Yes', 'No'],
            required: true,
            order: 5
          },
          {
            field_id: 'damage',
            field_type: 'radio',
            label: 'Physical Damage',
            options: ['None', 'Minor', 'Severe'],
            required: true,
            order: 6
          },
          {
            field_id: 'corrosion',
            field_type: 'radio',
            label: 'Corrosion',
            options: ['None', 'Minor', 'Severe'],
            required: true,
            order: 7
          },
        ],
        order: 2
      },
      {
        section_id: 'section-gauge',
        title: 'Pressure Gauge Check',
        fields: [
          {
            field_id: 'gauge-reading',
            field_type: 'radio',
            label: 'Gauge Reading',
            options: ['Green (Normal)', 'Yellow', 'Red (Recharge)'],
            required: true,
            order: 1
          },
          {
            field_id: 'gauge-readable',
            field_type: 'radio',
            label: 'Gauge Readable',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
        ],
        order: 3
      },
      {
        section_id: 'section-hose',
        title: 'Hose and Nozzle',
        fields: [
          {
            field_id: 'hose-condition',
            field_type: 'radio',
            label: 'Hose Condition',
            options: ['Good', 'Cracked', 'Damaged'],
            required: true,
            order: 1
          },
          {
            field_id: 'nozzle-clear',
            field_type: 'radio',
            label: 'Nozzle Clear',
            options: ['Yes', 'No'],
            required: true,
            order: 2
          },
        ],
        order: 4
      },
      {
        section_id: 'section-action',
        title: 'Action Required',
        fields: [
          {
            field_id: 'action-needed',
            field_type: 'radio',
            label: 'Action Required',
            options: ['None', 'Minor Service', 'Recharge', 'Replace'],
            required: true,
            order: 1
          },
          {
            field_id: 'notes',
            field_type: 'textarea',
            label: 'Notes',
            required: false,
            order: 2
          },
        ],
        order: 5
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: false,
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'inspection', 'fire-extinguisher', 'monthly']
  }
}

function createPPEInspectionTemplate(): FormTemplate {
  return {
    template_id: 'insp-ppe-001',
    template_name: 'PPE Inspection',
    template_type: 'Safety',
    description: 'Personal protective equipment condition inspection',
    category: 'Safety - PPE',
    is_premade: true,
    sections: [
      {
        section_id: 'section-info',
        title: 'Inspection Information',
        fields: [
          {
            field_id: 'ppe-type',
            field_type: 'select',
            label: 'PPE Type',
            options: ['Hard Hat', 'Safety Glasses', 'Gloves', 'Fall Protection', 'Respirator', 'Hearing Protection', 'Other'],
            required: true,
            order: 1
          },
          {
            field_id: 'ppe-id',
            field_type: 'text',
            label: 'PPE ID/Serial Number',
            required: false,
            order: 2
          },
          {
            field_id: 'inspection-date',
            field_type: 'date',
            label: 'Inspection Date',
            required: true,
            order: 3
          },
          {
            field_id: 'inspector',
            field_type: 'text',
            label: 'Inspector Name',
            required: true,
            order: 4
          },
        ],
        order: 1
      },
      {
        section_id: 'section-condition',
        title: 'Condition Assessment',
        fields: [
          {
            field_id: 'overall-condition',
            field_type: 'radio',
            label: 'Overall Condition',
            options: ['Excellent', 'Good', 'Fair', 'Poor', 'Unacceptable'],
            required: true,
            order: 1
          },
          {
            field_id: 'cracks',
            field_type: 'radio',
            label: 'Cracks or Splits',
            options: ['None', 'Minor', 'Major'],
            required: true,
            order: 2
          },
          {
            field_id: 'wear',
            field_type: 'radio',
            label: 'Excessive Wear',
            options: ['None', 'Minor', 'Major'],
            required: true,
            order: 3
          },
          {
            field_id: 'damage',
            field_type: 'radio',
            label: 'Physical Damage',
            options: ['None', 'Minor', 'Major'],
            required: true,
            order: 4
          },
          {
            field_id: 'cleanliness',
            field_type: 'radio',
            label: 'Cleanliness',
            options: ['Clean', 'Dirty', 'Contaminated'],
            required: true,
            order: 5
          },
        ],
        order: 2
      },
      {
        section_id: 'section-functional',
        title: 'Functional Check',
        fields: [
          {
            field_id: 'functions-properly',
            field_type: 'radio',
            label: 'Functions Properly',
            options: ['Yes', 'No'],
            required: true,
            order: 1
          },
          {
            field_id: 'adjustments-work',
            field_type: 'radio',
            label: 'Adjustments/Straps Work',
            options: ['Yes', 'No', 'N/A'],
            required: true,
            order: 2
          },
          {
            field_id: 'labels-legible',
            field_type: 'radio',
            label: 'Labels/Markings Legible',
            options: ['Yes', 'No'],
            required: true,
            order: 3
          },
        ],
        order: 3
      },
      {
        section_id: 'section-result',
        title: 'Inspection Result',
        fields: [
          {
            field_id: 'status',
            field_type: 'radio',
            label: 'PPE Status',
            options: ['Approved for Use', 'Repair Needed', 'Remove from Service'],
            required: true,
            order: 1
          },
          {
            field_id: 'deficiencies',
            field_type: 'textarea',
            label: 'Deficiencies/Issues',
            required: false,
            order: 2
          },
        ],
        order: 4
      },
    ],
    version: 1,
    status: 'Active',
    requires_approval: false,
    linked_sop_ids: [],
    linked_asset_ids: [],
    linked_work_order_types: ['Inspection'],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['safety', 'inspection', 'ppe', 'personal-protective-equipment']
  }
}

export function calculateFormScore(submission: FormSubmission): number {
  if (!submission.field_responses) return 0
  
  const responses = Object.values(submission.field_responses)
  if (responses.length === 0) return 0
  
  let totalScore = 0
  let scorableFields = 0
  
  responses.forEach(response => {
    if (response.value === 'Yes' || response.value === 'Good' || response.value === 'Excellent' || response.value === 'Pass') {
      totalScore += 1
      scorableFields += 1
    } else if (response.value === 'No' || response.value === 'Poor' || response.value === 'Fail') {
      scorableFields += 1
    } else if (typeof response.value === 'number' && response.value >= 1 && response.value <= 5) {
      totalScore += response.value / 5
      scorableFields += 1
    }
  })
  
  return scorableFields > 0 ? Math.round((totalScore / scorableFields) * 100) : 0
}

export function identifyIssues(submission: FormSubmission): string[] {
  const issues: string[] = []
  
  Object.values(submission.field_responses || {}).forEach(response => {
    if (response.value === 'No' || 
        response.value === 'Poor' || 
        response.value === 'Fail' || 
        response.value === 'Major' ||
        response.value === 'Severe' ||
        response.value === 'Out of Service' ||
        response.value === 'Remove from Service') {
      issues.push(response.field_label)
    }
  })
  
  return issues
}

export function generateCorrectiveActions(submission: FormSubmission): string[] {
  const actions: string[] = []
  
  Object.values(submission.field_responses || {}).forEach(response => {
    if (response.value === 'Repair Needed') {
      actions.push(`Repair ${response.field_label}`)
    } else if (response.value === 'Replace' || response.value === 'Remove from Service') {
      actions.push(`Replace ${response.field_label}`)
    } else if (response.value === 'Recharge') {
      actions.push(`Recharge ${response.field_label}`)
    } else if (response.value === 'Major' || response.value === 'Severe') {
      actions.push(`Investigate and address ${response.field_label}`)
    }
  })
  
  return actions
}
