import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Upload,
  File,
  FileText,
  FilePdf,
  FileDoc,
  FileImage,
  Trash,
  Download,
  Eye
} from '@phosphor-icons/react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export interface EquipmentDocument {
  document_id: string
  equipment_id: string
  document_type: 'Manual' | 'Drawing' | 'Certificate' | 'Photo' | 'Report' | 'Other'
  title: string
  description?: string
  file_name: string
  file_type: string
  file_size: number
  file_data: string // Base64 encoded for small files
  uploaded_by: string
  uploaded_at: string
  tags?: string[]
}

interface DocumentStorageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: string
  equipmentName: string
  documents: EquipmentDocument[]
  onSaveDocument: (document: EquipmentDocument) => void
  onDeleteDocument: (documentId: string) => void
}

export function DocumentStorageDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  documents,
  onSaveDocument,
  onDeleteDocument
}: DocumentStorageDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<EquipmentDocument['document_type']>('Manual')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB for base64 storage)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File Too Large', {
          description: 'File size must be less than 5MB for inline storage. Consider using external storage for larger files.'
        })
        return
      }
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name)
      }
    }
  }
  
  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        
        const document: EquipmentDocument = {
          document_id: `doc-${Date.now()}`,
          equipment_id: equipmentId,
          document_type: documentType,
          title: title || selectedFile.name,
          description: description || undefined,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_data: base64Data,
          uploaded_by: 'System User', // TODO: Replace with actual auth context
          uploaded_at: new Date().toISOString(),
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
        }
        
        onSaveDocument(document)
        
        // Reset form
        setSelectedFile(null)
        setTitle('')
        setDescription('')
        setTags('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        setIsUploading(false)
      }
      
      reader.onerror = () => {
        toast.error('Upload Failed', {
          description: 'Error reading file. Please try again.'
        })
        setIsUploading(false)
      }
      
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload Failed', {
        description: 'Failed to upload document. Please try again.'
      })
      setIsUploading(false)
    }
  }
  
  const handleDownload = (doc: EquipmentDocument) => {
    // Create a download link from base64 data
    const link = document.createElement('a')
    link.href = doc.file_data
    link.download = doc.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleView = (doc: EquipmentDocument) => {
    // Open document in new window
    const win = window.open()
    if (win) {
      if (doc.file_type.startsWith('image/')) {
        win.document.write(`<img src="${doc.file_data}" style="max-width: 100%; height: auto;" />`)
      } else if (doc.file_type === 'application/pdf') {
        win.document.write(`<embed src="${doc.file_data}" width="100%" height="100%" type="application/pdf" />`)
      } else {
        // For other types, just download
        handleDownload(doc)
      }
    }
  }
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5" />
    if (fileType === 'application/pdf') return <FilePdf className="h-5 w-5" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileDoc className="h-5 w-5" />
    if (fileType.includes('text')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  const equipmentDocs = documents.filter(d => d.equipment_id === equipmentId)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Storage - {equipmentName}</DialogTitle>
          <DialogDescription>
            Upload and manage manuals, drawings, photos, and other documents for this equipment
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload New Document</CardTitle>
              <CardDescription>Maximum file size: 5MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={documentType} onValueChange={(value) => setDocumentType(value as EquipmentDocument['document_type'])}>
                  <SelectTrigger id="document-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Drawing">Drawing</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                    <SelectItem value="Photo">Photo</SelectItem>
                    <SelectItem value="Report">Report</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="file-input">Select File</Label>
                <Input
                  id="file-input"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., maintenance, safety, installation"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
              </div>
              
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Stored Documents ({equipmentDocs.length})
              </CardTitle>
              <CardDescription>
                View, download, or delete documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                {equipmentDocs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {equipmentDocs.map((doc) => (
                      <Card key={doc.document_id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getFileIcon(doc.file_type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{doc.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {doc.file_name}
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                {doc.document_type}
                              </Badge>
                            </div>
                            
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleView(doc)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toast('Delete Document?', {
                                    description: `Are you sure you want to delete "${doc.title}"?`,
                                    action: {
                                      label: 'Delete',
                                      onClick: () => {
                                        onDeleteDocument(doc.document_id)
                                        toast.success('Document deleted successfully')
                                      }
                                    },
                                    cancel: {
                                      label: 'Cancel',
                                      onClick: () => {}
                                    }
                                  })
                                }}
                              >
                                <Trash className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
