import { supabase } from './client'

/**
 * Uploads a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param file - The file to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Uploads multiple files to a work order folder
 * @param woNumber - Work order number (e.g., WO-2025-0001)
 * @param files - Array of files to upload
 * @param subfolder - Subfolder name (e.g., 'before', 'after', 'signature')
 * @returns Array of public URLs
 */
export async function uploadWorkOrderFiles(
  woNumber: string,
  files: File[],
  subfolder: string
): Promise<string[]> {
  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}_${i}.${fileExt}`
    const path = `${woNumber}/${subfolder}/${fileName}`

    try {
      const url = await uploadFile('workorders', path, file)
      urls.push(url)
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error)
      throw error
    }
  }

  return urls
}

/**
 * Uploads a signature image (from canvas dataURL)
 * @param woNumber - Work order number
 * @param dataUrl - Base64 data URL from canvas
 * @returns Public URL of the uploaded signature
 */
export async function uploadSignature(
  woNumber: string,
  dataUrl: string
): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  
  // Create a File object
  const file = new File([blob], 'signature.png', { type: 'image/png' })
  
  const path = `${woNumber}/signature/signature.png`
  
  return await uploadFile('workorders', path, file)
}

/**
 * Deletes a file from storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

/**
 * Deletes all files in a work order folder
 * @param woNumber - Work order number
 */
export async function deleteWorkOrderFiles(woNumber: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('workorders')
    .list(woNumber, {
      limit: 1000,
    })

  if (error) {
    console.error('Error listing files:', error)
    throw error
  }

  if (data && data.length > 0) {
    const filePaths = data.map((file) => `${woNumber}/${file.name}`)
    await supabase.storage.from('workorders').remove(filePaths)
  }
}
