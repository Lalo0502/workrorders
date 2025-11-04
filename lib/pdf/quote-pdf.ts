import jsPDF from 'jspdf'
import { Quote, QuoteItem } from '@/lib/supabase/quotes'
import { Client } from '@/types/client'
import { Project } from '@/types/project'

interface GenerateQuotePDFParams {
  quote: Quote
  client?: Client | null
  project?: Project | null
  items: QuoteItem[]
}

export async function generateQuotePDF(params: GenerateQuotePDFParams) {
  const { quote, client, project, items } = params

  const pdf = new jsPDF()
  const pageWidth = 210 // A4 width
  const pageHeight = 297 // A4 height
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Header
  let yPos = margin
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('M1 NETWORKS', margin, yPos)
  pdf.setFontSize(14)
  pdf.text(`${quote.quote_number}`, pageWidth - margin, yPos, { align: 'right' })

  yPos += 2
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.8)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Status line
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  const issueStr = quote.issue_date
    ? new Date(quote.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A'
  const validStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined
  const statusLine = `Status: ${quote.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | Issued: ${issueStr}` +
    (validStr ? ` | Valid Until: ${validStr}` : '')
  pdf.text(statusLine, margin, yPos)
  yPos += 6

  // Title
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  const titleLines = pdf.splitTextToSize(quote.title || 'Quote', contentWidth)
  pdf.text(titleLines.slice(0, 1), margin, yPos)
  yPos += 5

  // Description
  if (quote.description) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const desc = pdf.splitTextToSize(quote.description, contentWidth)
    pdf.text(desc.slice(0, 3), margin, yPos)
    yPos += Math.min(desc.length, 3) * 3 + 3
  } else {
    yPos += 2
  }

  // Info grid: Client | Project
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4

  const col1X = margin
  const col2X = margin + contentWidth / 2
  const colWidth = contentWidth / 2 - 2

  const addField = (label: string, value: string, x: number, y: number, width: number): number => {
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label.toUpperCase(), x, y)

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    const lines = pdf.splitTextToSize(value, width)
    pdf.text(lines.slice(0, 2), x, y + 3)
    return y + 3 + Math.min(lines.length, 2) * 3 + 3
  }

  let c1y = yPos
  if (client) {
    c1y = addField('Client', client.name, col1X, c1y, colWidth)
    if (client.email) {
      pdf.setFontSize(7)
      pdf.setTextColor(80, 80, 80)
      pdf.text(client.email, col1X, c1y)
      c1y += 4
    }
    if (client.phone) {
      pdf.setFontSize(7)
      pdf.setTextColor(80, 80, 80)
      pdf.text(client.phone, col1X, c1y)
      c1y += 4
    }
  }

  let c2y = yPos
  if (project) {
    c2y = addField('Project', project.name, col2X, c2y, colWidth)
    if (project.description) {
      pdf.setFontSize(7)
      pdf.setTextColor(80, 80, 80)
      const plines = pdf.splitTextToSize(project.description, colWidth)
      pdf.text(plines.slice(0, 1), col2X, c2y)
      c2y += 4
    }
  }

  yPos = Math.max(c1y, c2y) + 2

  // Items table
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('ITEMS', margin, yPos)
  yPos += 4

  // Table headers
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(80, 80, 80)
  const xDesc = margin + 2
  const xQty = margin + 110
  const xUnit = margin + 140
  const xSub = pageWidth - margin
  pdf.text('Description', xDesc, yPos)
  pdf.text('Qty', xQty, yPos)
  pdf.text('Unit Price', xUnit, yPos)
  pdf.text('Subtotal', xSub, yPos, { align: 'right' })
  yPos += 3
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.1)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 1

  if (items.length === 0) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('No items', margin + 2, yPos + 3)
    yPos += 6
  } else {
    items.slice(0, 20).forEach((it) => {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      const descLines = pdf.splitTextToSize(it.description, 100)
      pdf.text(descLines[0], xDesc, yPos + 3)

      pdf.text(String(it.quantity), xQty, yPos + 3)
      pdf.text(`$${it.unit_price.toFixed(2)}`, xUnit, yPos + 3)
      pdf.text(`$${it.subtotal.toFixed(2)}`, xSub, yPos + 3, { align: 'right' })
      yPos += 5
    })

    if (items.length > 20) {
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`+ ${items.length - 20} more item(s)`, margin + 2, yPos + 2)
      yPos += 4
    }
  }

  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4

  // Totals summary box
  const boxX = margin
  const boxW = contentWidth
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.2)

  // Subtotal
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Subtotal', boxX + boxW - 60, yPos)
  pdf.text(`$${quote.subtotal.toFixed(2)}`, boxX + boxW - 2, yPos, { align: 'right' })
  yPos += 5

  // Tax
  if (quote.apply_tax) {
    pdf.text(`Tax (${quote.tax_rate}%)`, boxX + boxW - 60, yPos)
    pdf.text(`$${quote.tax_amount.toFixed(2)}`, boxX + boxW - 2, yPos, { align: 'right' })
    yPos += 5
  }

  // Discount
  if (quote.discount_value && quote.discount_value > 0) {
    const label = quote.discount_type === 'percentage' ? `Discount (${quote.discount_value}%)` : 'Discount'
    pdf.setTextColor(180, 0, 0)
    pdf.text(label, boxX + boxW - 60, yPos)
    pdf.text(`-$${quote.discount_amount.toFixed(2)}`, boxX + boxW - 2, yPos, { align: 'right' })
    pdf.setTextColor(0, 0, 0)
    yPos += 5
  }

  // Total
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('Total', boxX + boxW - 60, yPos)
  pdf.text(`$${quote.total.toFixed(2)}`, boxX + boxW - 2, yPos, { align: 'right' })
  yPos += 8

  // Terms and conditions (all together, no truncation)
  if (quote.terms_and_conditions) {
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 4

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(0, 0, 0)
    pdf.text('TERMS & CONDITIONS', margin, yPos)
    yPos += 4

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(60, 60, 60)
    const tlines = pdf.splitTextToSize(quote.terms_and_conditions, contentWidth)
    pdf.text(tlines, margin, yPos)
    yPos += tlines.length * 3 + 2
  }

  // Footer
  const footerY = pageHeight - 12
  pdf.setFontSize(7)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont('helvetica', 'normal')
  pdf.text('M1 Networks', margin, footerY)
  pdf.text('Phone: (956) 123-4567 | Email: contact@m1networks.com', margin, footerY + 3)
  pdf.text('www.m1networks.com', margin, footerY + 6)

  pdf.text(
    `© ${new Date().getFullYear()} M1 Networks. All rights reserved.`,
    pageWidth / 2,
    footerY + 3,
    { align: 'center' }
  )

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

  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3)

  pdf.save(`${quote.quote_number}.pdf`)
}
