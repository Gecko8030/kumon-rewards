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
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('JWT')) {
        throw lastError
      }

      // Don't retry on timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw lastError
      }

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} failed:`, error)
      
      // Wait before retrying
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

export async function checkConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection check timeout')), 10000)
    })

    const checkPromise = supabase.from('students').select('count').limit(1)
    const { error } = await Promise.race([checkPromise, timeoutPromise]) as any
    return !error
  } catch {
    return false
  }
}

export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('timed out') ||
    error?.code === 'NETWORK_ERROR'
  )
} 