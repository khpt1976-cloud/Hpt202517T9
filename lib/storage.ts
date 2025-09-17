// Storage utility to replace localStorage with database
export class DatabaseStorage {
  // Save data to database
  static async setItem(key: string, value: any, description?: string): Promise<void> {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          description
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save ${key} to database`)
      }
      
      // Also save to localStorage as backup
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to database:`, error)
      // Fallback to localStorage only
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  }

  // Get data from database, fallback to localStorage
  static async getItem(key: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`)
      if (response.ok) {
        const data = await response.json()
        return typeof data === 'string' ? data : JSON.stringify(data)
      }
    } catch (error) {
      console.error(`Error loading ${key} from database:`, error)
    }

    // Fallback to localStorage
    const localValue = localStorage.getItem(key)
    if (localValue) {
      // Migrate to database
      try {
        await this.setItem(key, localValue)
      } catch (error) {
        console.error(`Error migrating ${key} to database:`, error)
      }
    }
    return localValue
  }

  // Remove data from both database and localStorage
  static async removeItem(key: string): Promise<void> {
    try {
      await fetch(`/api/settings?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error(`Error removing ${key} from database:`, error)
    }
    
    localStorage.removeItem(key)
  }

  // Clear all data (use with caution)
  static async clear(): Promise<void> {
    try {
      await fetch('/api/settings', {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error clearing database:', error)
    }
    
    localStorage.clear()
  }
}

// Synchronous versions for compatibility
export class SyncStorage {
  static setItem(key: string, value: any): void {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    // Async save to database in background
    DatabaseStorage.setItem(key, value).catch(console.error)
  }

  static getItem(key: string): string | null {
    return localStorage.getItem(key)
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key)
    // Async remove from database in background
    DatabaseStorage.removeItem(key).catch(console.error)
  }
}