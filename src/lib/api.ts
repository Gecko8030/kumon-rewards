import { supabase } from './supabase'

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
  timeout?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, delay = 2000, backoff = true, timeout = 15000 } = options
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      })

      const result = await Promise.race([fn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error as Error
      
      console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error)
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Don't retry on authentication errors
      if (error instanceof Error && (
        error.message.includes('JWT') ||
        error.message.includes('auth') ||
        error.message.includes('unauthorized') ||
        error.message.includes('401')
      )) {
        throw lastError
      }

      // Don't retry on timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw lastError
      }

      // Don't retry on validation errors
      if (error instanceof Error && (
        error.message.includes('validation') ||
        error.message.includes('constraint') ||
        error.message.includes('duplicate')
      )) {
        throw lastError
      }

      // Wait before retrying
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
      console.log(`Waiting ${waitTime}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

export async function checkConnection(): Promise<boolean> {
  try {
    console.log('Checking database connection...')
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection check timeout')), 10000)
    })

    const checkPromise = supabase.from('students').select('count').limit(1)
    const { data, error } = await Promise.race([checkPromise, timeoutPromise]) as any
    
    if (error) {
      console.error('Database connection check failed:', error)
      return false
    }
    
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection check error:', error)
    return false
  }
}

export function isNetworkError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || error.toString() || ''
  const errorCode = error.code || ''
  
  return (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'ERR_NETWORK' ||
    errorCode === 'ERR_INTERNET_DISCONNECTED'
  )
} 