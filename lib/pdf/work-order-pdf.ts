import jsPDF from 'jspdf'
import { WorkOrder, Client, ClientLocation, Technician, Material } from '@/types'

interface WorkOrderTechnicianWithDetails {
  technician_id: string
  role?: string
  technicians: Technician | Technician[] | null
}

interface WorkOrderMaterialWithDetails {
  material_id: string
  quantity: number
  notes?: string
  materials: Material | Material[] | null
}

interface GeneratePDFParams {
  workOrder: WorkOrder
  client: Client | null
  location: ClientLocation | null
  technicians: WorkOrderTechnicianWithDetails[]
  materials: WorkOrderMaterialWithDetails[]
}

// Helper function to load image from URL
async function loadImageFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error loading image:', error)
    throw error
  }
}

export async function generateWorkOrderPDF(params: GeneratePDFParams) {
  const { workOrder, client, location, technicians, materials } = params
  
  const pdf = new jsPDF()
  const pageWidth = 210 // A4 width
  const pageHeight = 297 // A4 height
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  const workTypeLabels: Record<string, string> = {
    installation: 'Installation',
    maintenance: 'Maintenance',
    repair: 'Repair',
    inspection: 'Inspection',
    other: 'Other',
  }
  
  const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  
  // ============================================
  // COMPACT HEADER - Single line
  // ============================================
  let yPos = margin
  
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('M1 NETWORKS', margin, yPos)
  
  pdf.setFontSize(14)
  pdf.text(`${workOrder.wo_number}`, pageWidth - margin, yPos, { align: 'right' })
  
  yPos += 2
  
  // Thin line
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.8)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  
  yPos += 5
  
  // ============================================
  // STATUS LINE - Compact info in one line
  // ============================================
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  
  const statusLine = `${statusLabels[workOrder.status] || 'Pending'} | ${priorityLabels[workOrder.priority] || 'Medium'} Priority | ${workTypeLabels[workOrder.work_type] || 'Other'}`
  pdf.text(statusLine, margin, yPos)
  
  yPos += 6
  
  // ============================================
  // TITLE (Bold and prominent)
  // ============================================
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  const titleLines = pdf.splitTextToSize(workOrder.title, contentWidth)
  pdf.text(titleLines.slice(0, 1), margin, yPos) // Max 1 line for title
  
  yPos += 5
  
  // Description (smaller, if exists)
  if (workOrder.description) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(workOrder.description, contentWidth)
    pdf.text(descLines.slice(0, 2), margin, yPos) // Max 2 lines
    yPos += (Math.min(descLines.length, 2) * 3) + 3
  } else {
    yPos += 2
  }
  
  // ============================================
  // MAIN INFO - 4 COLUMN GRID (More compact)
  // ============================================
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4
  
  const gridStartY = yPos
  const col1X = margin
  const col2X = margin + 45
  const col3X = margin + 90
  const col4X = margin + 135
  
  let maxY = yPos
  
  // Helper for grid fields (more compact)
  const addGridField = (label: string, value: string, x: number, y: number, width: number): number => {
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label.toUpperCase(), x, y)
    
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    const lines = pdf.splitTextToSize(value, width - 2)
    pdf.text(lines.slice(0, 2), x, y + 3)
    
    return y + 3 + (Math.min(lines.length, 2) * 3) + 3
  }
  
  // Column 1: Client
  let col1Y = gridStartY
  if (client) {
    col1Y = addGridField('Client', client.name, col1X, col1Y, 43)
  }
  
  // Column 2: Location Name
  let col2Y = gridStartY
  if (location) {
    col2Y = addGridField('Location', location.location_name, col2X, col2Y, 43)
  }
  
  // Column 3: Schedule
  let col3Y = gridStartY
  if (workOrder.scheduled_date) {
    const dateStr = new Date(workOrder.scheduled_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    col3Y = addGridField('Scheduled', dateStr, col3X, col3Y, 43)
    
    if (workOrder.scheduled_start_time && workOrder.scheduled_end_time) {
      pdf.setFontSize(7)
      pdf.setTextColor(80, 80, 80)
      pdf.text(`${workOrder.scheduled_start_time}-${workOrder.scheduled_end_time}`, col3X, col3Y)
      col3Y += 4
    }
  }
  
  // Column 4: Contact
  let col4Y = gridStartY
  const pocName = workOrder.poc_name || location?.poc_name
  const pocPhone = workOrder.poc_phone || location?.poc_phone
  
  if (pocName) {
    col4Y = addGridField('Contact', pocName, col4X, col4Y, 43)
    if (pocPhone) {
      pdf.setFontSize(7)
      pdf.setTextColor(80, 80, 80)
      pdf.text(pocPhone, col4X, col4Y)
      col4Y += 4
    }
  }
  
  maxY = Math.max(col1Y, col2Y, col3Y, col4Y)
  yPos = maxY + 2
  
  // Address line (if location exists)
  if (location && location.address) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(80, 80, 80)
    const addressStr = `${location.address}, ${location.city}, ${location.state} ${location.zip_code || ''}`
    const addrLines = pdf.splitTextToSize(addressStr, contentWidth)
    pdf.text(addrLines.slice(0, 1), margin, yPos)
    yPos += 4
  }
  
  // ============================================
  // TECHNICIANS - Inline compact
  // ============================================
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('TECHNICIANS:', margin, yPos)
  
  pdf.setFont('helvetica', 'normal')
  if (technicians.length > 0) {
    const techNames = technicians.slice(0, 3).map(tech => {
      const techData = Array.isArray(tech.technicians) ? tech.technicians[0] : tech.technicians
      return techData ? techData.name : ''
    }).filter(Boolean).join(', ')
    
    pdf.text(techNames + (technicians.length > 3 ? ` +${technicians.length - 3}` : ''), margin + 30, yPos)
  } else {
    pdf.setTextColor(150, 150, 150)
    pdf.text('Not assigned', margin + 30, yPos)
  }
  
  yPos += 6
  
  // ============================================
  // MATERIALS - Ultra compact table
  // ============================================
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('MATERIALS:', margin, yPos)
  yPos += 4
  
  if (materials.length > 0) {
    // Compact table header
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text('Item', margin + 2, yPos)
    pdf.text('SKU', margin + 85, yPos)
    pdf.text('Qty', margin + 120, yPos)
    pdf.text('Unit', margin + 140, yPos)
    
    yPos += 3
    pdf.setDrawColor(220, 220, 220)
    pdf.setLineWidth(0.1)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 1
    
    // Compact rows
    materials.slice(0, 12).forEach((mat) => {
      const matData = Array.isArray(mat.materials) ? mat.materials[0] : mat.materials
      if (matData) {
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        
        // Material name (truncate if too long)
        const nameLines = pdf.splitTextToSize(matData.name, 80)
        pdf.text(nameLines[0], margin + 2, yPos + 3)
        
        // SKU
        if (matData.sku) {
          pdf.setFontSize(7)
          pdf.setTextColor(100, 100, 100)
          pdf.text(matData.sku, margin + 85, yPos + 3)
        }
        
        // Quantity
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)
        pdf.text(String(mat.quantity), margin + 120, yPos + 3)
        
        // Unit
        pdf.setFontSize(7)
        pdf.text(matData.unit_of_measure || 'unit', margin + 140, yPos + 3)
        
        yPos += 5
      }
    })
    
    if (materials.length > 12) {
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`+ ${materials.length - 12} more item(s)`, margin + 2, yPos + 2)
      yPos += 4
    }
    
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
  } else {
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text('No materials', margin + 2, yPos)
    yPos += 4
  }
  
  yPos += 4
  
  // ============================================
  // NOTES (if exists)
  // ============================================
  if (workOrder.technician_notes) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('NOTES:', margin, yPos)
    yPos += 3
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    const notesLines = pdf.splitTextToSize(workOrder.technician_notes, contentWidth - 2)
    pdf.text(notesLines.slice(0, 4), margin + 1, yPos) // Max 4 lines
    yPos += (Math.min(notesLines.length, 4) * 3) + 5
  }
  
  // ============================================
  // SIGNATURE (only if completed)
  // ============================================
  if (workOrder.status === 'completed' && workOrder.client_signature_name && workOrder.actual_end_date) {
    // Calculate proper space - need at least 40mm for signature + footer
    const footerHeight = 20 // Height needed for footer
    const signatureHeight = 40 // Height needed for signature section
    const remainingSpace = pageHeight - yPos - footerHeight - signatureHeight
    
    // If there's not enough space, position signature higher
    if (remainingSpace < 5) {
      yPos = pageHeight - footerHeight - signatureHeight - 5
    } else {
      yPos += 8 // Add some breathing room
    }
    
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 7
    
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('SIGNATURE:', margin, yPos)
    yPos += 7
    
    // Try to load signature image
    if (workOrder.client_signature) {
      try {
        const signatureImage = await loadImageFromUrl(workOrder.client_signature)
        
        // Signature image (compact)
        pdf.addImage(signatureImage, 'PNG', margin, yPos, 50, 15)
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.2)
        pdf.line(margin, yPos + 16, margin + 50, yPos + 16)
        
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0, 0, 0)
        pdf.text(workOrder.client_signature_name, margin, yPos + 21)
        
      } catch (error) {
        // Fallback
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.2)
        pdf.line(margin, yPos + 8, margin + 60, yPos + 8)
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'italic')
        pdf.text(workOrder.client_signature_name, margin, yPos + 6)
      }
    } else {
      // No image
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPos + 8, margin + 60, yPos + 8)
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text(workOrder.client_signature_name, margin, yPos + 6)
    }
    
    // Date on the right
    const signDate = new Date(workOrder.actual_end_date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.2)
    pdf.line(margin + 110, yPos + 8, margin + 160, yPos + 8)
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text(signDate, margin + 110, yPos + 6)
    
    pdf.setFontSize(7)
    pdf.setTextColor(80, 80, 80)
    pdf.text('Signed By', margin, yPos + 25)
    pdf.text('Date & Time', margin + 110, yPos + 13)
    
    // Extra space before footer
    yPos += 35
  }
  
  // ============================================
  // FOOTER - Company info & page number
  // ============================================
  const footerY = pageHeight - 12
  
  // Left: Company contact info
  pdf.setFontSize(7)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont('helvetica', 'normal')
  pdf.text('M1 Networks', margin, footerY)
  pdf.text('Phone: (956) 123-4567 | Email: contact@m1networks.com', margin, footerY + 3)
  pdf.text('www.m1networks.com', margin, footerY + 6)
  
  // Center: Copyright
  pdf.text(
    `© ${new Date().getFullYear()} M1 Networks. All rights reserved.`,
    pageWidth / 2,
    footerY + 3,
    { align: 'center' }
  )
  
  // Right: Page number & generation date
  pdf.text('Page 1 of 1', pageWidth - margin, footerY, { align: 'right' })
  pdf.text(
    `Generated: ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    pageWidth - margin,
    footerY + 3,
    { align: 'right' }
  )
  
  // Thin line above footer
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
  
  // Save
  pdf.save(`WO-${workOrder.wo_number}.pdf`)
}