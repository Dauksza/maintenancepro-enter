import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Camera,
  Upload,
  X,
  FloppyDisk,
  Image as ImageIcon,
  Trash
} from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface EquipmentPhoto {
  photo_id: string
  equipment_id: string
  title: string
  description?: string
  category: 'Installation' | 'Maintenance' | 'Defect' | 'Before' | 'After' | 'General'
  image_data: string // Base64 encoded image
  captured_by: string
  captured_at: string
  location?: string
  tags?: string[]
}

interface PhotoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: string
  equipmentName: string
  photos: EquipmentPhoto[]
  onSavePhoto: (photo: EquipmentPhoto) => void
  onDeletePhoto: (photoId: string) => void
}

export function PhotoUploadDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  photos,
  onSavePhoto,
  onDeletePhoto
}: PhotoUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'capture' | 'upload' | 'gallery'>('gallery')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<EquipmentPhoto['category']>('General')
  const [tags, setTags] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    // Cleanup camera stream when component unmounts or dialog closes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])
  
  useEffect(() => {
    if (!open && stream) {
      // Stop camera when dialog closes
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }, [open, stream])
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setStream(mediaStream)
      setIsCameraActive(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error('Camera Access Denied', {
        description: 'Unable to access camera. Please check permissions or use the Upload tab.'
      })
    }
  }
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      
      // Stop camera after capture
      stopCamera()
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', {
        description: 'Please select an image file (PNG, JPG, WEBP)'
      })
      return
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', {
        description: 'Image size must be less than 5MB'
      })
      return
    }
    
    // Read file as base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setCapturedImage(imageData)
      if (!title) {
        setTitle(file.name)
      }
    }
    reader.readAsDataURL(file)
  }
  
  const handleSave = () => {
    if (!capturedImage) {
      toast.error('No Photo Selected', {
        description: 'Please capture or upload a photo first'
      })
      return
    }
    
    if (!title.trim()) {
      toast.error('Title Required', {
        description: 'Please enter a title for the photo'
      })
      return
    }
    
    const photo: EquipmentPhoto = {
      photo_id: `photo-${Date.now()}`,
      equipment_id: equipmentId,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      image_data: capturedImage,
      captured_by: 'System User', // TODO: Replace with actual auth context
      captured_at: new Date().toISOString(),
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
    }
    
    onSavePhoto(photo)
    
    // Reset form
    setCapturedImage(null)
    setTitle('')
    setDescription('')
    setTags('')
    setCategory('General')
    setActiveTab('gallery')
    
    toast.success('Photo Saved', {
      description: 'Photo has been successfully saved to the gallery'
    })
  }
  
  const handleDiscard = () => {
    setCapturedImage(null)
    setTitle('')
    setDescription('')
    setTags('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const equipmentPhotos = photos.filter(p => p.equipment_id === equipmentId)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Photo Documentation - {equipmentName}</DialogTitle>
          <DialogDescription>
            Capture or upload photos for maintenance documentation
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Gallery ({equipmentPhotos.length})</TabsTrigger>
            <TabsTrigger value="capture">Capture Photo</TabsTrigger>
            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              {equipmentPhotos.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No photos yet</p>
                  <p className="text-sm">Use the Capture or Upload tabs to add photos</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 p-4">
                  {equipmentPhotos.map((photo) => (
                    <div
                      key={photo.photo_id}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedImage(photo.image_data)}
                    >
                      <img
                        src={photo.image_data}
                        alt={photo.title}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-3 flex flex-col">
                        <div className="flex-1">
                          <Badge className="mb-2">{photo.category}</Badge>
                          <p className="text-white font-medium text-sm line-clamp-2">{photo.title}</p>
                          {photo.description && (
                            <p className="text-white/80 text-xs mt-1 line-clamp-2">{photo.description}</p>
                          )}
                          <p className="text-white/60 text-xs mt-2">
                            {new Date(photo.captured_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            toast('Delete Photo?', {
                              description: `Are you sure you want to delete "${photo.title}"?`,
                              action: {
                                label: 'Delete',
                                onClick: () => {
                                  onDeletePhoto(photo.photo_id)
                                  toast.success('Photo deleted successfully')
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
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="capture" className="flex-1 overflow-hidden">
            <div className="h-[500px] flex flex-col gap-4">
              {!isCameraActive && !capturedImage && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <Button onClick={startCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Camera permission required
                    </p>
                  </div>
                </div>
              )}
              
              {isCameraActive && !capturedImage && (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {capturedImage && (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-64 object-contain border rounded-lg bg-gray-50"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleDiscard} variant="outline" className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Discard
                      </Button>
                      <Button onClick={() => {
                        setCapturedImage(null)
                        startCamera()
                      }} variant="outline" className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Category</Label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EquipmentPhoto['category'])}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="General">General</option>
                        <option value="Installation">Installation</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Defect">Defect</option>
                        <option value="Before">Before</option>
                        <option value="After">After</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Bearing inspection"
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., wear, lubrication"
                      />
                    </div>
                    
                    <Button onClick={handleSave} className="w-full">
                      <FloppyDisk className="h-4 w-4 mr-2" />
                      Save Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </TabsContent>
          
          <TabsContent value="upload" className="flex-1 overflow-hidden">
            <div className="h-[500px] flex flex-col gap-4">
              {!capturedImage && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      PNG, JPG, WEBP (max 5MB)
                    </p>
                  </div>
                </div>
              )}
              
              {capturedImage && (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <img
                      src={capturedImage}
                      alt="Uploaded"
                      className="w-full h-64 object-contain border rounded-lg bg-gray-50"
                    />
                    <Button onClick={handleDiscard} variant="outline" className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Category</Label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EquipmentPhoto['category'])}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="General">General</option>
                        <option value="Installation">Installation</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Defect">Defect</option>
                        <option value="Before">Before</option>
                        <option value="After">After</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Bearing inspection"
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., wear, lubrication"
                      />
                    </div>
                    
                    <Button onClick={handleSave} className="w-full">
                      <FloppyDisk className="h-4 w-4 mr-2" />
                      Save Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Full-size image viewer */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              className="absolute top-4 right-4"
              variant="outline"
              size="sm"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
