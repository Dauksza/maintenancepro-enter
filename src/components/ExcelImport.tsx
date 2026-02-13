import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UploadSimple, CheckCircle, Warning, X } from '@phosphor-icons/react'
import { parseExcelFile } from '@/lib/excel-parser'
import type { ExcelImportData, ImportValidationError } from '@/lib/types'
import { toast } from 'sonner'

interface ExcelImportProps {
  open: boolean
  onClose: () => void
  onImportComplete: (data: ExcelImportData) => void
}

export function ExcelImport({ open, onClose, onImportComplete }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importData, setImportData] = useState<ExcelImportData | null>(null)
  const [errors, setErrors] = useState<ImportValidationError[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      toast.error('Please upload a CSV or TXT file')
      return
    }
    setFile(selectedFile)
    setImportData(null)
    setErrors([])
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleParseFile = async () => {
    if (!file) return

    setImporting(true)
    try {
      const result = await parseExcelFile(file)
      setImportData(result.data)
      setErrors(result.errors)

      if (result.errors.length > 0) {
        toast.warning(`Parsed with ${result.errors.length} warning(s)`)
      } else {
        toast.success('File parsed successfully')
      }
    } catch (error) {
      toast.error('Failed to parse file')
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  const handleConfirmImport = () => {
    if (importData) {
      onImportComplete(importData)
      toast.success('Data imported successfully')
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportData(null)
    setErrors([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadSimple size={24} />
            Import Excel/CSV Data
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file containing Maintenance Tracking, SOP Library, and Spares & Labor data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <UploadSimple size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2 font-medium">Drag and drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Accepts CSV and TXT files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Selected File</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFile(null)
                        setImportData(null)
                        setErrors([])
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </CardTitle>
                  <CardDescription>{file.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                    {!importData && (
                      <Button onClick={handleParseFile} disabled={importing}>
                        {importing ? 'Parsing...' : 'Parse File'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <Warning size={16} />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {errors.length} validation error(s) found:
                    </div>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {errors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>
                          {err.sheet} - Row {err.row}: {err.error}
                        </li>
                      ))}
                      {errors.length > 10 && (
                        <li className="font-semibold">...and {errors.length - 10} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {importData && (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle size={16} />
                    <AlertDescription>
                      File parsed successfully! Review the summary below.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Work Orders</CardDescription>
                        <CardTitle className="text-2xl">{importData.workOrders.length}</CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>SOPs</CardDescription>
                        <CardTitle className="text-2xl">{importData.sops.length}</CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Spares/Labor</CardDescription>
                        <CardTitle className="text-2xl">{importData.sparesLabor.length}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preview - Work Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importData.workOrders.slice(0, 5).map(wo => (
                          <div key={wo.work_order_id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                            <div>
                              <code className="font-mono text-xs bg-muted px-1 rounded">
                                {wo.work_order_id}
                              </code>
                              <span className="ml-2">{wo.equipment_area}</span>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {wo.priority_level}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {wo.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {importData.workOrders.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            ...and {importData.workOrders.length - 5} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button onClick={handleConfirmImport} className="flex-1">
                      Confirm Import
                    </Button>
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
