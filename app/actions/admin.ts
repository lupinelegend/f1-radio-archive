"use server"

import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function syncOpenF1(year?: number) {
  try {
    const command = year 
      ? `npm run sync:openf1:${year}`
      : `npm run sync:openf1`
    
    const { stdout, stderr } = await execAsync(command)
    
    return { 
      success: true, 
      output: stdout,
      error: stderr 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

export async function runTranscription(limit?: number) {
  try {
    const command = limit 
      ? `npm run transcribe:limit`
      : `npm run transcribe`
    
    const { stdout, stderr } = await execAsync(command)
    
    return { 
      success: true, 
      output: stdout,
      error: stderr 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

export async function runAutoTag(limit?: number) {
  try {
    let command = 'npm run auto-tag'
    if (limit === 10) command = 'npm run auto-tag:10'
    else if (limit === 100) command = 'npm run auto-tag:100'
    else if (limit === 1000) command = 'npm run auto-tag:1000'
    
    const { stdout, stderr } = await execAsync(command)
    
    return { 
      success: true, 
      output: stdout,
      error: stderr 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}
