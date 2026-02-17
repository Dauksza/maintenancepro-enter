import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { PMEquipment, Pump, Valve, ElectricMotor, Gearbox } from '@/lib/types'

interface PMEquipmentDetailDialogProps {
  equipment: PMEquipment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PMEquipmentDetailDialog({
  equipment,
  open,
  onOpenChange
}: PMEquipmentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{equipment.asset_name}</DialogTitle>
          <DialogDescription>
            {equipment.pm_equipment_type} - {equipment.manufacturer} {equipment.model}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Status and Criticality */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge
                  variant={
                    equipment.status === 'Operational'
                      ? 'default'
                      : equipment.status === 'Under Maintenance'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {equipment.status}
                </Badge>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Criticality</div>
                <Badge
                  variant={
                    equipment.criticality_rating === 'Critical'
                      ? 'destructive'
                      : equipment.criticality_rating === 'High'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {equipment.criticality_rating}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-3">Basic Information</h3>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Serial Number</dt>
                  <dd className="font-mono text-sm">{equipment.serial_number}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Purchase Date</dt>
                  <dd className="text-sm">
                    {equipment.purchase_date
                      ? new Date(equipment.purchase_date).toLocaleDateString()
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Warranty Expiry</dt>
                  <dd className="text-sm">
                    {equipment.warranty_expiry
                      ? new Date(equipment.warranty_expiry).toLocaleDateString()
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Downtime YTD</dt>
                  <dd className="text-sm">{equipment.downtime_hours_ytd} hours</dd>
                </div>
              </dl>
            </div>
            
            <Separator />
            
            {/* Maintenance Schedule */}
            <div>
              <h3 className="font-semibold mb-3">Maintenance Schedule</h3>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Last Maintenance</dt>
                  <dd className="text-sm">
                    {equipment.last_maintenance_date
                      ? new Date(equipment.last_maintenance_date).toLocaleDateString()
                      : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Next Maintenance</dt>
                  <dd className="text-sm">
                    {equipment.next_maintenance_date
                      ? new Date(equipment.next_maintenance_date).toLocaleDateString()
                      : 'Not scheduled'}
                  </dd>
                </div>
              </dl>
            </div>
            
            <Separator />
            
            {/* Equipment-Specific Details */}
            {equipment.pm_equipment_type === 'Pump' && (
              <div>
                <h3 className="font-semibold mb-3">Pump Specifications</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Pump Type</dt>
                    <dd className="text-sm">{(equipment as Pump).pump_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Flow Rate</dt>
                    <dd className="text-sm">{(equipment as Pump).flow_rate_gpm} GPM</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Head</dt>
                    <dd className="text-sm">{(equipment as Pump).head_feet} feet</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Power</dt>
                    <dd className="text-sm">{(equipment as Pump).power_hp} HP</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Impeller Material</dt>
                    <dd className="text-sm">{(equipment as Pump).impeller_material}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Seal Type</dt>
                    <dd className="text-sm">{(equipment as Pump).seal_type}</dd>
                  </div>
                </dl>
              </div>
            )}
            
            {equipment.pm_equipment_type === 'Valve' && (
              <div>
                <h3 className="font-semibold mb-3">Valve Specifications</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Valve Type</dt>
                    <dd className="text-sm">{(equipment as Valve).valve_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Size</dt>
                    <dd className="text-sm">{(equipment as Valve).valve_size}"</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Actuation</dt>
                    <dd className="text-sm">{(equipment as Valve).actuation_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Body Material</dt>
                    <dd className="text-sm">{(equipment as Valve).body_material}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Pressure Rating</dt>
                    <dd className="text-sm">{(equipment as Valve).pressure_rating} PSI</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Flow Coefficient (Cv)</dt>
                    <dd className="text-sm">{(equipment as Valve).flow_coefficient_cv}</dd>
                  </div>
                </dl>
              </div>
            )}
            
            {equipment.pm_equipment_type === 'Electric Motor' && (
              <div>
                <h3 className="font-semibold mb-3">Motor Specifications</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Motor Type</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).motor_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Horsepower</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).horsepower} HP</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Voltage</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).voltage}V</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Phase</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).phase}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">RPM</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).rpm}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Enclosure</dt>
                    <dd className="text-sm">{(equipment as ElectricMotor).enclosure_type}</dd>
                  </div>
                </dl>
              </div>
            )}
            
            {equipment.pm_equipment_type === 'Gearbox' && (
              <div>
                <h3 className="font-semibold mb-3">Gearbox Specifications</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Gearbox Type</dt>
                    <dd className="text-sm">{(equipment as Gearbox).gearbox_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Gear Ratio</dt>
                    <dd className="text-sm">{(equipment as Gearbox).gear_ratio}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Input RPM</dt>
                    <dd className="text-sm">{(equipment as Gearbox).input_rpm}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Output RPM</dt>
                    <dd className="text-sm">{(equipment as Gearbox).output_rpm}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Torque Rating</dt>
                    <dd className="text-sm">{(equipment as Gearbox).torque_rating} lb-ft</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Lubrication</dt>
                    <dd className="text-sm">{(equipment as Gearbox).lubrication_type}</dd>
                  </div>
                </dl>
              </div>
            )}
            
            <Separator />
            
            {/* Notes */}
            {equipment.notes && (
              <div>
                <h3 className="font-semibold mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground">{equipment.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
