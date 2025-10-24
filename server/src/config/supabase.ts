import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './env.js'

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required for file uploads')
}

export const supabase = createClient(SUPABASE_PROJECT_URL, supabaseKey)

// Helper function to upload file to claims_documents bucket
export const uploadToClaimsBucket = async (file: Express.Multer.File, claimId: string, documentName: string) => {
  const fileExtension = file.originalname.split('.').pop()
  const fileName = `${claimId}/${documentName}.${fileExtension}`
  
  const { data, error } = await supabase.storage
    .from('claims_documents')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get the public URL (for reference, but we'll use secure download instead)
  const { data: urlData } = supabase.storage
    .from('claims_documents')
    .getPublicUrl(fileName)

  return {
    path: data.path,
    url: urlData.publicUrl
  }
}

// Helper function to delete file from claims_documents bucket
export const deleteFromClaimsBucket = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('claims_documents')
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
