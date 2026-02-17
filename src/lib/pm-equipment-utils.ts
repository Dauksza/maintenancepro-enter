import { v4 as uuidv4 } from 'uuid'
import type {
  PMEquipment,
  Valve,
  ValveManifold,
  ValveHeader,
  ValveSection,
  ProcessArea,
  ProcessSystem,
  Pump,
  Gearbox,
  ElectricMotor,
  PressureGauge,
  Thermometer,
  RadarTransmitter,
  ProcessController,
  ValveType,
  ValveActuationType,
  PMEquipmentType
} from './types'

// Sample data generators for PM equipment

export function generateSamplePumps(count: number = 10): Pump[] {
  const pumpTypes: Array<'Centrifugal' | 'Positive Displacement' | 'Submersible' | 'Diaphragm' | 'Peristaltic'> = [
    'Centrifugal',
    'Positive Displacement',
    'Submersible',
    'Diaphragm',
    'Peristaltic'
  ]

  const pumps: Pump[] = []
  for (let i = 0; i < count; i++) {
    const pumpType = pumpTypes[Math.floor(Math.random() * pumpTypes.length)]
    pumps.push({
      asset_id: uuidv4(),
      asset_name: `Pump P-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Pump',
      category: 'PM Equipment',
      status: Math.random() > 0.1 ? 'Operational' : 'Under Maintenance',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Grundfos', 'Flowserve', 'ITT Goulds', 'KSB', 'Sulzer'][Math.floor(Math.random() * 5)],
      model: `Model-${Math.floor(Math.random() * 9000) + 1000}`,
      serial_number: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 100),
      criticality_rating: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)] as 'Low' | 'Medium' | 'High' | 'Critical',
      notes: `${pumpType} pump for process service`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Pump',
      specifications: {
        pump_curve: 'Standard',
        npshr: Math.floor(Math.random() * 15) + 5
      },
      operating_parameters: {
        rated_capacity: Math.floor(Math.random() * 500) + 100,
        operating_pressure: Math.floor(Math.random() * 150) + 50,
        operating_temperature: Math.floor(Math.random() * 100) + 50,
        flow_rate: Math.floor(Math.random() * 1000) + 100,
        power_rating: Math.floor(Math.random() * 100) + 10,
        rpm: [1750, 3500, 1200][Math.floor(Math.random() * 3)],
        efficiency: 70 + Math.random() * 20
      },
      pump_type: pumpType,
      flow_rate_gpm: Math.floor(Math.random() * 1000) + 100,
      head_feet: Math.floor(Math.random() * 300) + 50,
      power_hp: Math.floor(Math.random() * 100) + 10,
      impeller_material: ['316 SS', 'CD4MCu', 'Bronze', 'Cast Iron'][Math.floor(Math.random() * 4)],
      casing_material: ['316 SS', 'Cast Iron', 'Ductile Iron'][Math.floor(Math.random() * 3)],
      seal_type: ['Mechanical', 'Packed Gland', 'Magnetic Drive'][Math.floor(Math.random() * 3)],
      bearing_type: ['Ball', 'Roller', 'Sleeve'][Math.floor(Math.random() * 3)],
      suction_size: [2, 3, 4, 6, 8][Math.floor(Math.random() * 5)],
      discharge_size: [1.5, 2, 3, 4][Math.floor(Math.random() * 4)]
    })
  }
  return pumps
}

export function generateSampleValves(count: number = 100): Valve[] {
  const valveTypes: ValveType[] = [
    'Gate Valve',
    'Globe Valve',
    'Ball Valve',
    'Butterfly Valve',
    'Check Valve',
    'Plug Valve',
    'Needle Valve',
    'Control Valve'
  ]

  const actuationTypes: ValveActuationType[] = ['Manual', 'Pneumatic', 'Electric', 'Hydraulic', 'Solenoid']

  const valves: Valve[] = []
  for (let i = 0; i < count; i++) {
    const valveType = valveTypes[Math.floor(Math.random() * valveTypes.length)]
    const actuationType = actuationTypes[Math.floor(Math.random() * actuationTypes.length)]
    
    valves.push({
      asset_id: uuidv4(),
      asset_name: `${valveType} V-${String(i + 1).padStart(4, '0')}`,
      asset_type: 'Valve',
      category: 'PM Equipment',
      status: Math.random() > 0.05 ? 'Operational' : 'Under Maintenance',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Crane', 'Fisher', 'Masoneilan', 'Emerson', 'Cameron'][Math.floor(Math.random() * 5)],
      model: `${valveType.split(' ')[0]}-${Math.floor(Math.random() * 900) + 100}`,
      serial_number: `VLV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2019 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2024 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 20),
      criticality_rating: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)] as 'Low' | 'Medium' | 'High' | 'Critical',
      notes: `${actuationType} ${valveType} in service`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Valve',
      specifications: {
        end_connection: ['Flanged', 'Threaded', 'Welded'][Math.floor(Math.random() * 3)],
        face_to_face: Math.floor(Math.random() * 20) + 10
      },
      operating_parameters: {
        operating_pressure: Math.floor(Math.random() * 300) + 100,
        operating_temperature: Math.floor(Math.random() * 200) + 100,
        flow_rate: Math.floor(Math.random() * 500) + 50
      },
      valve_type: valveType,
      valve_size: [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12][Math.floor(Math.random() * 11)],
      actuation_type: actuationType,
      body_material: ['Carbon Steel', '316 SS', '304 SS', 'Bronze', 'PVC'][Math.floor(Math.random() * 5)],
      seat_material: ['PTFE', 'Metal', 'Elastomer', 'PEEK'][Math.floor(Math.random() * 4)],
      pressure_rating: [150, 300, 600, 900, 1500][Math.floor(Math.random() * 5)],
      temperature_rating: Math.floor(Math.random() * 500) + 200,
      flow_coefficient_cv: Math.floor(Math.random() * 100) + 10,
      position_indicator: Math.random() > 0.5,
      fail_position: actuationType !== 'Manual' ? (['Open', 'Closed', 'As-Is'][Math.floor(Math.random() * 3)] as 'Open' | 'Closed' | 'As-Is') : undefined,
      manifold_id: null,
      valve_tag: `V-${String(i + 1).padStart(4, '0')}`
    })
  }
  return valves
}

export function generateSampleMotors(count: number = 20): ElectricMotor[] {
  const motorTypes: Array<'AC Induction' | 'DC' | 'Synchronous' | 'Servo' | 'Stepper'> = [
    'AC Induction',
    'DC',
    'Synchronous',
    'Servo',
    'Stepper'
  ]

  const motors: ElectricMotor[] = []
  for (let i = 0; i < count; i++) {
    const motorType = motorTypes[Math.floor(Math.random() * motorTypes.length)]
    const hp = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100][Math.floor(Math.random() * 14)]
    
    motors.push({
      asset_id: uuidv4(),
      asset_name: `Motor M-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Electric Motor',
      category: 'PM Equipment',
      status: Math.random() > 0.1 ? 'Operational' : 'Under Maintenance',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['ABB', 'Siemens', 'WEG', 'Baldor', 'GE'][Math.floor(Math.random() * 5)],
      model: `${motorType.replace(' ', '-')}-${hp}HP`,
      serial_number: `MTR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2025 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 50),
      criticality_rating: ['Medium', 'High', 'Critical'][Math.floor(Math.random() * 3)] as 'Medium' | 'High' | 'Critical',
      notes: `${hp} HP ${motorType} motor`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Electric Motor',
      specifications: {
        insulation_class: ['F', 'H'][Math.floor(Math.random() * 2)],
        mounting: ['Foot', 'Flange', 'Face'][Math.floor(Math.random() * 3)]
      },
      operating_parameters: {
        power_rating: hp,
        voltage: motorType === 'DC' ? 125 : [230, 460, 575][Math.floor(Math.random() * 3)],
        rpm: [900, 1200, 1800, 3600][Math.floor(Math.random() * 4)],
        efficiency: 85 + Math.random() * 10
      },
      motor_type: motorType,
      horsepower: hp,
      voltage: motorType === 'DC' ? 125 : [230, 460, 575][Math.floor(Math.random() * 3)],
      current_amps: hp * (motorType === 'DC' ? 6 : 1.5),
      phase: motorType === 'DC' ? '1-Phase' : '3-Phase',
      rpm: [900, 1200, 1800, 3600][Math.floor(Math.random() * 4)],
      frame_size: `${[56, 143, 145, 182, 184, 213, 215, 254, 256][Math.floor(Math.random() * 9)]}T`,
      enclosure_type: ['TEFC', 'ODP', 'TENV', 'Explosion Proof'][Math.floor(Math.random() * 4)],
      efficiency_class: ['IE2', 'IE3', 'IE4'][Math.floor(Math.random() * 3)],
      service_factor: 1.0 + (Math.floor(Math.random() * 3) * 0.15)
    })
  }
  return motors
}

export function generateSampleGearboxes(count: number = 15): Gearbox[] {
  const gearboxTypes: Array<'Spur' | 'Helical' | 'Bevel' | 'Worm' | 'Planetary'> = [
    'Spur',
    'Helical',
    'Bevel',
    'Worm',
    'Planetary'
  ]

  const gearboxes: Gearbox[] = []
  for (let i = 0; i < count; i++) {
    const gearboxType = gearboxTypes[Math.floor(Math.random() * gearboxTypes.length)]
    const ratios = ['5:1', '10:1', '15:1', '20:1', '25:1', '30:1', '40:1', '50:1', '60:1']
    
    gearboxes.push({
      asset_id: uuidv4(),
      asset_name: `Gearbox GB-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Gearbox',
      category: 'PM Equipment',
      status: Math.random() > 0.15 ? 'Operational' : 'Under Maintenance',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['SEW Eurodrive', 'Nord', 'Sumitomo', 'Bonfiglioli', 'Dodge'][Math.floor(Math.random() * 5)],
      model: `${gearboxType}-${ratios[Math.floor(Math.random() * ratios.length)].replace(':', '-')}`,
      serial_number: `GB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2019 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2024 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 40),
      criticality_rating: ['Medium', 'High', 'Critical'][Math.floor(Math.random() * 3)] as 'Medium' | 'High' | 'Critical',
      notes: `${gearboxType} gearbox for speed reduction`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Gearbox',
      specifications: {
        center_distance: Math.floor(Math.random() * 200) + 100,
        number_of_stages: Math.floor(Math.random() * 3) + 1
      },
      operating_parameters: {
        power_rating: Math.floor(Math.random() * 50) + 10,
        rpm: [900, 1200, 1800][Math.floor(Math.random() * 3)],
        efficiency: 85 + Math.random() * 10
      },
      gearbox_type: gearboxType,
      gear_ratio: ratios[Math.floor(Math.random() * ratios.length)],
      input_rpm: [1200, 1800, 3600][Math.floor(Math.random() * 3)],
      output_rpm: Math.floor(Math.random() * 300) + 50,
      torque_rating: Math.floor(Math.random() * 5000) + 1000,
      lubrication_type: ['Synthetic', 'Mineral Oil', 'Grease'][Math.floor(Math.random() * 3)],
      oil_capacity: Math.floor(Math.random() * 10) + 2,
      mounting_type: ['Foot', 'Flange', 'Shaft'][Math.floor(Math.random() * 3)]
    })
  }
  return gearboxes
}

export function generateSampleInstruments(): Array<PressureGauge | Thermometer | RadarTransmitter | ProcessController> {
  const instruments: Array<PressureGauge | Thermometer | RadarTransmitter | ProcessController> = []
  
  // Generate Pressure Gauges
  for (let i = 0; i < 30; i++) {
    const gaugeType: 'Bourdon Tube' | 'Diaphragm' | 'Digital' | 'Capsule' = 
      ['Bourdon Tube', 'Diaphragm', 'Digital', 'Capsule'][Math.floor(Math.random() * 4)] as 'Bourdon Tube' | 'Diaphragm' | 'Digital' | 'Capsule'
    
    instruments.push({
      asset_id: uuidv4(),
      asset_name: `Pressure Gauge PG-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Pressure Gauge',
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Ashcroft', 'WIKA', 'Rosemount', 'Winters'][Math.floor(Math.random() * 4)],
      model: `${gaugeType.split(' ')[0]}-${Math.floor(Math.random() * 900) + 100}`,
      serial_number: `PG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2021 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2026 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 6) + 6, Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: 0,
      criticality_rating: ['Low', 'Medium'][Math.floor(Math.random() * 2)] as 'Low' | 'Medium',
      notes: `${gaugeType} pressure gauge`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Pressure Gauge',
      specifications: {},
      operating_parameters: {},
      gauge_type: gaugeType,
      pressure_range: {
        min: 0,
        max: [100, 200, 300, 500, 1000, 1500, 3000][Math.floor(Math.random() * 7)]
      },
      accuracy_percent: [0.5, 1.0, 1.5, 2.0][Math.floor(Math.random() * 4)],
      connection_size: ['1/4"', '1/2"', '3/4"'][Math.floor(Math.random() * 3)],
      dial_size: [2.5, 4, 6][Math.floor(Math.random() * 3)],
      pressure_unit: ['PSI', 'Bar', 'kPa'][Math.floor(Math.random() * 3)] as 'PSI' | 'Bar' | 'kPa',
      calibration_due_date: new Date(2025, Math.floor(Math.random() * 12), 1).toISOString()
    })
  }
  
  // Generate Thermometers
  for (let i = 0; i < 25; i++) {
    const thermType: 'Bimetallic' | 'RTD' | 'Thermocouple' | 'Digital' | 'Infrared' = 
      ['Bimetallic', 'RTD', 'Thermocouple', 'Digital', 'Infrared'][Math.floor(Math.random() * 5)] as 'Bimetallic' | 'RTD' | 'Thermocouple' | 'Digital' | 'Infrared'
    
    instruments.push({
      asset_id: uuidv4(),
      asset_name: `Thermometer TT-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Thermometer',
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Omega', 'Fluke', 'WIKA', 'Rosemount'][Math.floor(Math.random() * 4)],
      model: `${thermType}-${Math.floor(Math.random() * 900) + 100}`,
      serial_number: `TT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2021 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2026 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 6) + 6, Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: 0,
      criticality_rating: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
      notes: `${thermType} temperature sensor`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Thermometer',
      specifications: {},
      operating_parameters: {},
      thermometer_type: thermType,
      temperature_range: {
        min: thermType === 'Infrared' ? -50 : 0,
        max: [200, 400, 600, 1000, 1500][Math.floor(Math.random() * 5)]
      },
      accuracy: [0.5, 1.0, 2.0][Math.floor(Math.random() * 3)],
      probe_length: Math.floor(Math.random() * 20) + 2,
      connection_type: ['1/2" NPT', '3/4" NPT', 'Flange'][Math.floor(Math.random() * 3)],
      temperature_unit: ['°F', '°C'][Math.floor(Math.random() * 2)] as '°F' | '°C',
      calibration_due_date: new Date(2025, Math.floor(Math.random() * 12), 1).toISOString()
    })
  }
  
  // Generate Radar Transmitters
  for (let i = 0; i < 15; i++) {
    const radarType: 'Guided Wave' | 'Non-Contact' | 'Pulse' = 
      ['Guided Wave', 'Non-Contact', 'Pulse'][Math.floor(Math.random() * 3)] as 'Guided Wave' | 'Non-Contact' | 'Pulse'
    
    instruments.push({
      asset_id: uuidv4(),
      asset_name: `Level Transmitter LT-${String(i + 1).padStart(3, '0')}`,
      asset_type: 'Radar Transmitter',
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Emerson', 'Endress+Hauser', 'Siemens', 'VEGA'][Math.floor(Math.random() * 4)],
      model: `${radarType.split(' ')[0]}-${Math.floor(Math.random() * 900) + 100}`,
      serial_number: `LT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 10),
      criticality_rating: ['High', 'Critical'][Math.floor(Math.random() * 2)] as 'High' | 'Critical',
      notes: `${radarType} radar level transmitter`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: 'Radar Transmitter',
      specifications: {},
      operating_parameters: {},
      transmitter_type: radarType,
      measurement_range: {
        min: 0,
        max: [20, 30, 40, 60, 80, 100][Math.floor(Math.random() * 6)]
      },
      frequency_ghz: [6, 26, 80][Math.floor(Math.random() * 3)],
      beam_angle: Math.floor(Math.random() * 15) + 5,
      process_connection: ['2" Flange', '3" Flange', '4" Flange'][Math.floor(Math.random() * 3)],
      output_signal: ['4-20mA', 'HART', 'Profibus', 'Modbus'][Math.floor(Math.random() * 4)] as '4-20mA' | 'HART' | 'Profibus' | 'Modbus',
      display_type: ['LCD', 'LED', 'None'][Math.floor(Math.random() * 3)] as 'LCD' | 'LED' | 'None',
      tank_application: ['Storage Tank', 'Process Vessel', 'Reactor', 'Day Tank'][Math.floor(Math.random() * 4)]
    })
  }
  
  // Generate Process Controllers
  for (let i = 0; i < 20; i++) {
    const controllerType: 'Level' | 'Temperature' = Math.random() > 0.5 ? 'Level' : 'Temperature'
    
    instruments.push({
      asset_id: uuidv4(),
      asset_name: `${controllerType} Controller ${controllerType === 'Level' ? 'LC' : 'TC'}-${String(i + 1).padStart(3, '0')}`,
      asset_type: `Process Controller - ${controllerType}`,
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: [],
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: ['Honeywell', 'Yokogawa', 'ABB', 'Emerson'][Math.floor(Math.random() * 4)],
      model: `${controllerType}-PID-${Math.floor(Math.random() * 900) + 100}`,
      serial_number: `${controllerType === 'Level' ? 'LC' : 'TC'}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
      warranty_expiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1).toISOString(),
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      next_maintenance_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      downtime_hours_ytd: Math.floor(Math.random() * 15),
      criticality_rating: ['High', 'Critical'][Math.floor(Math.random() * 2)] as 'High' | 'Critical',
      notes: `${controllerType} process controller with PID`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pm_equipment_type: controllerType === 'Level' ? 'Process Controller - Level' : 'Process Controller - Temperature',
      specifications: {},
      operating_parameters: {
        control_range: {
          min: 0,
          max: controllerType === 'Level' ? 100 : 500
        }
      },
      controller_type: controllerType,
      control_algorithm: ['PID', 'On-Off', 'Cascade'][Math.floor(Math.random() * 3)] as 'PID' | 'On-Off' | 'Fuzzy Logic' | 'Cascade',
      input_type: controllerType === 'Level' ? '4-20mA from LT' : 'Thermocouple Type K',
      output_type: '4-20mA to Control Valve',
      setpoint_range: {
        min: 0,
        max: controllerType === 'Level' ? 100 : 500
      },
      control_accuracy: [0.1, 0.5, 1.0][Math.floor(Math.random() * 3)],
      communication_protocol: ['Modbus', 'HART', 'Profibus', 'Ethernet/IP'][Math.floor(Math.random() * 4)] as 'Modbus' | 'HART' | 'Profibus' | 'Ethernet/IP' | 'OPC-UA',
      display_features: ['Trend Display', 'Alarm History', 'Tuning Parameters'],
      alarm_outputs: Math.floor(Math.random() * 4) + 2
    })
  }
  
  return instruments
}

// Valve hierarchy utilities
export function createValveHierarchy(valves: Valve[]): {
  manifolds: ValveManifold[]
  headers: ValveHeader[]
  sections: ValveSection[]
  areas: ProcessArea[]
  systems: ProcessSystem[]
} {
  const manifolds: ValveManifold[] = []
  const headers: ValveHeader[] = []
  const sections: ValveSection[] = []
  const areas: ProcessArea[] = []
  const systems: ProcessSystem[] = []
  
  // Create 10 manifolds, each containing 10 valves
  for (let i = 0; i < 10; i++) {
    const valveGroup = valves.slice(i * 10, (i + 1) * 10)
    const manifoldId = uuidv4()
    
    // Update valves to reference manifold
    valveGroup.forEach(valve => {
      valve.manifold_id = manifoldId
      valve.parent_asset_id = manifoldId
    })
    
    manifolds.push({
      asset_id: manifoldId,
      asset_name: `Manifold MF-${String(i + 1).padStart(2, '0')}`,
      asset_type: 'Valve Manifold',
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: valveGroup.map(v => v.asset_id),
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: 'Custom',
      model: `MF-${i + 1}`,
      serial_number: `MF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020, 0, 1).toISOString(),
      warranty_expiry: null,
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: null,
      next_maintenance_date: null,
      downtime_hours_ytd: 0,
      criticality_rating: 'Medium',
      notes: `Valve manifold with ${valveGroup.length} valves`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      manifold_tag: `MF-${String(i + 1).padStart(2, '0')}`,
      valve_ids: valveGroup.map(v => v.asset_id),
      header_id: null,
      manifold_type: 'Distribution',
      inlet_size: 6,
      outlet_count: valveGroup.length
    })
  }
  
  // Create 3 headers, each containing 3-4 manifolds
  const manifoldsPerHeader = [3, 3, 4]
  let manifoldIndex = 0
  
  for (let i = 0; i < 3; i++) {
    const manifoldGroup = manifolds.slice(manifoldIndex, manifoldIndex + manifoldsPerHeader[i])
    const headerId = uuidv4()
    
    // Update manifolds to reference header
    manifoldGroup.forEach(manifold => {
      manifold.header_id = headerId
      manifold.parent_asset_id = headerId
    })
    
    headers.push({
      asset_id: headerId,
      asset_name: `Header HD-${String(i + 1).padStart(2, '0')}`,
      asset_type: 'Valve Header',
      category: 'PM Equipment',
      status: 'Operational',
      area_id: null,
      parent_asset_id: null,
      child_asset_ids: manifoldGroup.map(m => m.asset_id),
      assigned_employee_ids: [],
      required_skill_ids: [],
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: 'Custom',
      model: `HD-${i + 1}`,
      serial_number: `HD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchase_date: new Date(2020, 0, 1).toISOString(),
      warranty_expiry: null,
      availability_windows: [],
      meter_readings: [],
      last_maintenance_date: null,
      next_maintenance_date: null,
      downtime_hours_ytd: 0,
      criticality_rating: 'High',
      notes: `Distribution header with ${manifoldGroup.length} manifolds`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      header_tag: `HD-${String(i + 1).padStart(2, '0')}`,
      manifold_ids: manifoldGroup.map(m => m.asset_id),
      section_id: null,
      header_type: i === 0 ? 'Supply' : i === 1 ? 'Return' : 'Distribution',
      main_line_size: 12
    })
    
    manifoldIndex += manifoldsPerHeader[i]
  }
  
  // Create 2 sections, each with headers
  const section1Id = uuidv4()
  const section2Id = uuidv4()
  
  headers[0].section_id = section1Id
  headers[0].parent_asset_id = section1Id
  headers[1].section_id = section1Id
  headers[1].parent_asset_id = section1Id
  headers[2].section_id = section2Id
  headers[2].parent_asset_id = section2Id
  
  sections.push({
    asset_id: section1Id,
    asset_name: 'Section A - North Wing',
    asset_type: 'Valve Section',
    category: 'PM Equipment',
    status: 'Operational',
    area_id: null,
    parent_asset_id: null,
    child_asset_ids: [headers[0].asset_id, headers[1].asset_id],
    assigned_employee_ids: [],
    required_skill_ids: [],
    maintenance_task_ids: [],
    linked_sop_ids: [],
    manufacturer: 'Custom',
    model: 'SEC-A',
    serial_number: `SEC-A-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    purchase_date: new Date(2020, 0, 1).toISOString(),
    warranty_expiry: null,
    availability_windows: [],
    meter_readings: [],
    last_maintenance_date: null,
    next_maintenance_date: null,
    downtime_hours_ytd: 0,
    criticality_rating: 'High',
    notes: 'North wing valve section',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    section_tag: 'SEC-A',
    header_ids: [headers[0].asset_id, headers[1].asset_id],
    process_area_id: null,
    section_description: 'Primary distribution section for north wing'
  })
  
  sections.push({
    asset_id: section2Id,
    asset_name: 'Section B - South Wing',
    asset_type: 'Valve Section',
    category: 'PM Equipment',
    status: 'Operational',
    area_id: null,
    parent_asset_id: null,
    child_asset_ids: [headers[2].asset_id],
    assigned_employee_ids: [],
    required_skill_ids: [],
    maintenance_task_ids: [],
    linked_sop_ids: [],
    manufacturer: 'Custom',
    model: 'SEC-B',
    serial_number: `SEC-B-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    purchase_date: new Date(2020, 0, 1).toISOString(),
    warranty_expiry: null,
    availability_windows: [],
    meter_readings: [],
    last_maintenance_date: null,
    next_maintenance_date: null,
    downtime_hours_ytd: 0,
    criticality_rating: 'High',
    notes: 'South wing valve section',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    section_tag: 'SEC-B',
    header_ids: [headers[2].asset_id],
    process_area_id: null,
    section_description: 'Distribution section for south wing'
  })
  
  // Create 1 process area containing both sections
  const areaId = uuidv4()
  sections[0].process_area_id = areaId
  sections[0].parent_asset_id = areaId
  sections[1].process_area_id = areaId
  sections[1].parent_asset_id = areaId
  
  areas.push({
    asset_id: areaId,
    asset_name: 'Process Area 1 - Main Production',
    asset_type: 'Process Area',
    category: 'PM Equipment',
    status: 'Operational',
    area_id: null,
    parent_asset_id: null,
    child_asset_ids: [section1Id, section2Id],
    assigned_employee_ids: [],
    required_skill_ids: [],
    maintenance_task_ids: [],
    linked_sop_ids: [],
    manufacturer: 'Custom',
    model: 'PA-01',
    serial_number: `PA-01-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    purchase_date: new Date(2020, 0, 1).toISOString(),
    warranty_expiry: null,
    availability_windows: [],
    meter_readings: [],
    last_maintenance_date: null,
    next_maintenance_date: null,
    downtime_hours_ytd: 0,
    criticality_rating: 'Critical',
    notes: 'Main production area',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    area_tag: 'PA-01',
    section_ids: [section1Id, section2Id],
    system_id: null,
    area_description: 'Main production facility process area',
    operating_unit: 'Production Unit 1'
  })
  
  // Create 1 system containing the area
  const systemId = uuidv4()
  areas[0].system_id = systemId
  areas[0].parent_asset_id = systemId
  
  systems.push({
    asset_id: systemId,
    asset_name: 'Distribution System - Plant Wide',
    asset_type: 'Process System',
    category: 'PM Equipment',
    status: 'Operational',
    area_id: null,
    parent_asset_id: null,
    child_asset_ids: [areaId],
    assigned_employee_ids: [],
    required_skill_ids: [],
    maintenance_task_ids: [],
    linked_sop_ids: [],
    manufacturer: 'Custom',
    model: 'SYS-01',
    serial_number: `SYS-01-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    purchase_date: new Date(2020, 0, 1).toISOString(),
    warranty_expiry: null,
    availability_windows: [],
    meter_readings: [],
    last_maintenance_date: null,
    next_maintenance_date: null,
    downtime_hours_ytd: 0,
    criticality_rating: 'Critical',
    notes: 'Plant-wide distribution system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    system_tag: 'SYS-01',
    area_ids: [areaId],
    system_description: 'Comprehensive plant-wide fluid distribution system',
    system_type: 'Distribution',
    criticality: 'Critical'
  })
  
  return { manifolds, headers, sections, areas, systems }
}

export function getAllPMEquipment(): Array<PMEquipment> {
  const pumps = generateSamplePumps(10)
  const valves = generateSampleValves(100)
  const motors = generateSampleMotors(20)
  const gearboxes = generateSampleGearboxes(15)
  const instruments = generateSampleInstruments()
  
  return [...pumps, ...valves, ...motors, ...gearboxes, ...instruments]
}
