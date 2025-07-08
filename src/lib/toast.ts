import toast from 'react-hot-toast'

// Keep track of recent toasts to prevent duplicates
const recentToasts = new Map<string, number>()
const TOAST_COOLDOWN = 2000 // 2 seconds

export const showToast = {
  success: (message: string, options?: any) => {
    const now = Date.now()
    const lastShown = recentToasts.get(message)
    
    if (lastShown && now - lastShown < TOAST_COOLDOWN) {
      return // Don't show duplicate toast
    }
    
    recentToasts.set(message, now)
    toast.success(message, options)
  },
  
  error: (message: string, options?: any) => {
    const now = Date.now()
    const lastShown = recentToasts.get(message)
    
    if (lastShown && now - lastShown < TOAST_COOLDOWN) {
      return // Don't show duplicate toast
    }
    
    recentToasts.set(message, now)
    toast.error(message, options)
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [message, timestamp] of recentToasts.entries()) {
    if (now - timestamp > TOAST_COOLDOWN) {
      recentToasts.delete(message)
    }
  }
}, 5000) 