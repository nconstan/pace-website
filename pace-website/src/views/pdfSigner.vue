<template>
  <div class="pdf-signer">
    <!-- <div class="header">
      <h1>Document Signer</h1>
      <div class="controls">
        <button @click="clearSignature" class="btn btn-secondary">Clear Signature</button>
        <button @click="generateSignedPDF" class="btn btn-primary">Generate Signed Document</button>
      </div>
    </div>

    <div class="main-content">
       Left Panel - Document Preview 
      <div class="document-panel">
        <div class="document-header">
          <h3>Document Preview</h3>
          <div class="template-selector">
            <label>Document Template:</label>
            <select v-model="selectedTemplate" class="form-control">
              <option value="insurance">Insurance Policy</option>
              <option value="contract">Service Contract</option>
              <option value="agreement">Legal Agreement</option>
            </select>
          </div>
        </div>
        
        <div class="document-container">
          <div class="document-preview">
            <div class="document-content">
              <h2>{{ getTemplateTitle() }}</h2>
              <div class="document-body">
                <p><strong>Date:</strong> {{ formatDate(new Date()) }}</p>
                <p><strong>Document ID:</strong> {{ generateDocumentId() }}</p>
                <hr>
                <div v-html="getTemplateContent()"></div>
                <hr>
                <div class="signature-section">
                  <h4>Signatures</h4>
                  <div v-for="(signature, index) in signatures" :key="index" class="signature-preview">
                    <div class="signature-line">
                      <span class="signature-label">{{ signature.name }}</span>
                      <span class="signature-date">{{ formatDate(signature.date) }}</span>
                    </div>
                    <div class="signature-placeholder">
                      [Signature {{ index + 1 }}]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      Right Panel - Controls 
      <div class="controls-panel">
        Signer Information 
        <div class="section">
          <h3>Signer Information</h3>
          <div class="form-group">
            <label>Email Address:</label>
            <input 
              v-model="signerEmail" 
              type="email" 
              placeholder="Enter email address"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>Name:</label>
            <input 
              v-model="signerName" 
              type="text" 
              placeholder="Enter your name"
              class="form-control"
            />
          </div>
        </div>

        Signature Drawing 
        <div class="section">
          <h3>Draw Your Signature</h3>
          <div class="signature-pad-container">
            <canvas 
              ref="signaturePad" 
              class="signature-pad"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart="startDrawingTouch"
              @touchmove="drawTouch"
              @touchend="stopDrawing"
            ></canvas>
          </div>
          <div class="signature-controls">
            <button @click="clearSignature" class="btn btn-sm btn-secondary">Clear</button>
            <button @click="undoSignature" class="btn btn-sm btn-secondary">Undo</button>
          </div>
        </div>

        Signature Management 
        <div class="section">
          <h3>Add Signature</h3>
          <div class="placement-info">
            <p>Click "Add Signature" to add your signature to the document</p>
          </div>
          <div class="placement-controls">
            <button @click="addSignature" class="btn btn-primary">Add Signature</button>
          </div>
        </div>

        Signature List 
        <div class="section">
          <h3>Signatures on Document</h3>
          <div class="signature-list">
            <div 
              v-for="(signature, index) in signatures" 
              :key="index"
              class="signature-item"
            >
              <div class="signature-preview">
                <img 
                  v-if="signature.imageData" 
                  :src="signature.imageData" 
                  class="signature-preview-image"
                  alt="Signature"
                />
                <div v-else class="signature-preview-text">{{ signature.name.charAt(0) }}</div>
              </div>
              <div class="signature-info">
                <strong>{{ signature.name }}</strong>
                <span>{{ formatDate(signature.date) }}</span>
              </div>
              <button @click="removeSignature(index)" class="btn btn-sm btn-danger">×</button>
            </div>
            <div v-if="signatures.length === 0" class="no-signatures">
              No signatures added yet
            </div>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
// import { ref, onMounted } from 'vue'
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
// import SignaturePad from 'signature_pad'

// // Document State
// const selectedTemplate = ref('insurance')
// const signerEmail = ref('')
// const signerName = ref('')

// // Signature State
// const signaturePad = ref<HTMLCanvasElement>()
// let signaturePadInstance: SignaturePad | null = null
// const signatures = ref<Array<{
//   name: string
//   email: string
//   date: Date
//   imageData?: string
// }>>([])

// // Drawing State
// let isDrawing = false
// let lastX = 0
// let lastY = 0

// // Initialize signature pad
// onMounted(() => {
//   initializeSignaturePad()
// })

// const initializeSignaturePad = () => {
//   if (!signaturePad.value) return
  
//   signaturePadInstance = new SignaturePad(signaturePad.value, {
//     backgroundColor: 'white',
//     penColor: 'black'
//   })
// }

// const startDrawing = (e: MouseEvent) => {
//   isDrawing = true
//   const rect = signaturePad.value?.getBoundingClientRect()
//   if (rect) {
//     lastX = e.clientX - rect.left
//     lastY = e.clientY - rect.top
//   }
// }

// const draw = (e: MouseEvent) => {
//   if (!isDrawing || !signaturePadInstance) return
  
//   const rect = signaturePad.value?.getBoundingClientRect()
//   if (rect) {
//     const x = e.clientX - rect.left
//     const y = e.clientY - rect.top
    
//     const ctx = signaturePad.value?.getContext('2d')
//     if (ctx) {
//       ctx.beginPath()
//       ctx.moveTo(lastX, lastY)
//       ctx.lineTo(x, y)
//       ctx.stroke()
//       lastX = x
//       lastY = y
//     }
//   }
// }

// const stopDrawing = () => {
//   isDrawing = false
// }

// const startDrawingTouch = (e: TouchEvent) => {
//   e.preventDefault()
//   const touch = e.touches[0]
//   const mouseEvent = new MouseEvent('mousedown', {
//     clientX: touch.clientX,
//     clientY: touch.clientY
//   })
//   startDrawing(mouseEvent)
// }

// const drawTouch = (e: TouchEvent) => {
//   e.preventDefault()
//   const touch = e.touches[0]
//   const mouseEvent = new MouseEvent('mousemove', {
//     clientX: touch.clientX,
//     clientY: touch.clientY
//   })
//   draw(mouseEvent)
// }

// const clearSignature = () => {
//   signaturePadInstance?.clear()
// }

// const undoSignature = () => {
//   const data = signaturePadInstance?.toData()
//   if (data && data.length > 0) {
//     data.pop()
//     signaturePadInstance?.fromData(data)
//   }
// }

// const addSignature = () => {
//   if (!signerName.value.trim() || !signerEmail.value.trim()) {
//     alert('Please enter both name and email')
//     return
//   }
  
//   if (signaturePadInstance?.isEmpty()) {
//     alert('Please draw a signature first')
//     return
//   }
  
//   // Convert signature to image data
//   const signatureImageData = signaturePadInstance?.toDataURL() || ''
  
//   // Add signature to the list
//   signatures.value.push({
//     name: signerName.value,
//     email: signerEmail.value,
//     date: new Date(),
//     imageData: signatureImageData
//   })
  
//   // Clear form
//   signerName.value = ''
//   signerEmail.value = ''
//   clearSignature()
// }

// const removeSignature = (index: number) => {
//   signatures.value.splice(index, 1)
// }

// const formatDate = (date: Date) => {
//   return date.toLocaleDateString()
// }

// const generateDocumentId = () => {
//   return 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase()
// }

// const getTemplateTitle = () => {
//   const titles = {
//     insurance: 'Insurance Policy Document',
//     contract: 'Service Contract Agreement',
//     agreement: 'Legal Agreement Document'
//   }
//   return titles[selectedTemplate.value as keyof typeof titles] || 'Document'
// }

// const getTemplateContent = () => {
//   const templates = {
//     insurance: `
//       <h3>Policy Details</h3>
//       <p>This insurance policy provides comprehensive coverage for the specified period. 
//       All terms and conditions are subject to the policy guidelines and applicable laws.</p>
      
//       <h4>Coverage Summary</h4>
//       <ul>
//         <li>Property Damage Coverage</li>
//         <li>Liability Protection</li>
//         <li>Medical Payments</li>
//         <li>Uninsured Motorist Coverage</li>
//       </ul>
      
//       <h4>Policy Terms</h4>
//       <p>This policy is valid for one year from the effective date. Premium payments are due monthly. 
//       Any changes to the policy must be communicated in writing.</p>
//     `,
//     contract: `
//       <h3>Service Agreement</h3>
//       <p>This service contract outlines the terms and conditions for the provision of services 
//       between the service provider and the client.</p>
      
//       <h4>Service Scope</h4>
//       <ul>
//         <li>Consultation Services</li>
//         <li>Project Management</li>
//         <li>Technical Support</li>
//         <li>Maintenance Services</li>
//       </ul>
      
//       <h4>Terms and Conditions</h4>
//       <p>Services will be provided according to the agreed schedule. Payment terms are net 30 days. 
//       This agreement is binding for the specified term.</p>
//     `,
//     agreement: `
//       <h3>Legal Agreement</h3>
//       <p>This legal agreement establishes the terms and conditions governing the relationship 
//       between the parties involved.</p>
      
//       <h4>Agreement Terms</h4>
//       <ul>
//         <li>Confidentiality Provisions</li>
//         <li>Intellectual Property Rights</li>
//         <li>Dispute Resolution</li>
//         <li>Termination Clauses</li>
//       </ul>
      
//       <h4>Legal Provisions</h4>
//       <p>This agreement is governed by applicable state and federal laws. Any disputes will be 
//       resolved through arbitration as specified in the agreement.</p>
//     `
//   }
//   return templates[selectedTemplate.value as keyof typeof templates] || ''
// }

// const generateSignedPDF = async () => {
//   if (signatures.value.length === 0) {
//     alert('Please add at least one signature before generating the document')
//     return
//   }
  
//   try {
//     // Create a new PDF document
//     const pdfDoc = await PDFDocument.create()
//     const page = pdfDoc.addPage([595, 842]) // A4 size
//     const { height } = page.getSize()
    
//     // Add fonts
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
//     // Add title
//     page.drawText(getTemplateTitle(), {
//       x: 50,
//       y: height - 50,
//       size: 20,
//       font: boldFont,
//       color: rgb(0, 0, 0)
//     })
    
//     // Add date and document ID
//     page.drawText(`Date: ${formatDate(new Date())}`, {
//       x: 50,
//       y: height - 80,
//       size: 12,
//       font: font,
//       color: rgb(0, 0, 0)
//     })
    
//     page.drawText(`Document ID: ${generateDocumentId()}`, {
//       x: 50,
//       y: height - 100,
//       size: 12,
//       font: font,
//       color: rgb(0, 0, 0)
//     })
    
//     // Add template content
//     const contentLines = getTemplateContent()
//       .replace(/<[^>]*>/g, '') // Remove HTML tags
//       .split('\n')
//       .filter(line => line.trim())
    
//     let yPosition = height - 150
//     for (const line of contentLines) {
//       if (yPosition < 200) {
//         // Add new page if needed
//         //const newPage = pdfDoc.addPage([595, 842])
//         yPosition = height - 50
//       }
      
//       page.drawText(line.trim(), {
//         x: 50,
//         y: yPosition,
//         size: 10,
//         font: font,
//         color: rgb(0, 0, 0)
//       })
//       yPosition -= 15
//     }
    
//     // Add signatures
//     yPosition = Math.max(yPosition, 200)
//     page.drawText('Signatures:', {
//       x: 50,
//       y: yPosition,
//       size: 14,
//       font: boldFont,
//       color: rgb(0, 0, 0)
//     })
    
//          yPosition -= 30
//      for (const signature of signatures.value) {
//        if (yPosition < 100) {
//          // Add new page for signatures
//          //const newPage = pdfDoc.addPage([595, 842])
//          yPosition = height - 50
//        }
       
//        // Add signature line
//        page.drawLine({
//          start: { x: 50, y: yPosition },
//          end: { x: 250, y: yPosition },
//          thickness: 1,
//          color: rgb(0, 0, 0)
//        })
       
//        // Add signature image if available
//        if (signature.imageData) {
//          try {
//            // Convert base64 image to PDF image
//            const imageData = signature.imageData.split(',')[1]
//            const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))
           
//            // Embed the image in the PDF
//            const image = await pdfDoc.embedPng(imageBytes)
//            const imageDims = image.scale(0.3) // Scale down the image
           
//            page.drawImage(image, {
//              x: 50,
//              y: yPosition - imageDims.height - 5,
//              width: imageDims.width,
//              height: imageDims.height
//            })
//          } catch (error) {
//            console.error('Error embedding signature image:', error)
//          }
//        }
       
//        // Add name
//        page.drawText(signature.name, {
//          x: 50,
//          y: yPosition - (signature.imageData ? 80 : 15),
//          size: 12,
//          font: font,
//          color: rgb(0, 0, 0)
//        })
       
//        // Add date
//        page.drawText(formatDate(signature.date), {
//          x: 50,
//          y: yPosition - (signature.imageData ? 95 : 30),
//          size: 10,
//          font: font,
//          color: rgb(0.5, 0.5, 0.5)
//        })
       
//        yPosition -= (signature.imageData ? 120 : 60)
//      }
    
//     // Save the PDF
//     const pdfBytes = await pdfDoc.save()
//     const blob = new Blob([pdfBytes], { type: 'application/pdf' })
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = `signed-${selectedTemplate.value}-${generateDocumentId()}.pdf`
//     a.click()
//     URL.revokeObjectURL(url)
    
//     alert('Signed document generated successfully!')
//   } catch (error) {
//     console.error('Error generating PDF:', error)
//     alert('Error generating PDF')
//   }
// }
</script>

<style scoped>
.pdf-signer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  height: calc(100vh - 150px);
}

.document-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.document-header {
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-header h3 {
  margin: 0;
  color: #333;
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.template-selector label {
  font-weight: 500;
  color: #555;
}

.document-container {
  height: calc(100% - 60px);
  overflow: auto;
  padding: 20px;
}

.document-preview {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 30px;
  min-height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.document-content h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.document-body {
  line-height: 1.6;
  color: #333;
}

.document-body h3 {
  color: #007bff;
  margin-top: 20px;
  margin-bottom: 10px;
}

.document-body h4 {
  color: #555;
  margin-top: 15px;
  margin-bottom: 8px;
}

.document-body ul {
  margin-left: 20px;
}

.document-body li {
  margin-bottom: 5px;
}

.signature-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.signature-preview {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #f8f9fa;
}

.signature-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.signature-label {
  font-weight: bold;
  color: #333;
}

.signature-date {
  color: #666;
  font-size: 0.9em;
}

.signature-placeholder {
  border-bottom: 1px solid #333;
  padding: 5px 0;
  color: #999;
  font-style: italic;
}

.controls-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow-y: auto;
}

.section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.signature-pad-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.signature-pad {
  width: 100%;
  height: 150px;
  background: white;
  cursor: crosshair;
}

.signature-controls {
  display: flex;
  gap: 10px;
}

.placement-info {
  margin-bottom: 15px;
}

.placement-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.placement-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.signature-list {
  max-height: 200px;
  overflow-y: auto;
}

.signature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.signature-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.signature-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.signature-preview-text {
  font-size: 18px;
  font-weight: bold;
  color: #666;
}

.signature-item:hover {
  background-color: #f8f9fa;
}

.signature-info {
  display: flex;
  flex-direction: column;
}

.signature-info strong {
  font-size: 14px;
  color: #333;
}

.signature-info span {
  font-size: 12px;
  color: #666;
}

.no-signatures {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .controls-panel {
    max-height: 400px;
  }
}
</style>
  