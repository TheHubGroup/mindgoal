// This file is no longer needed with Supabase Auth
// Keeping for reference but can be deleted

export const PasswordUtils = {
  hashPassword: async (password: string): Promise<string> => {
    // No longer needed - Supabase Auth handles password hashing
    return password
  },

  verifyPassword: async (password: string, hash: string): Promise<boolean> => {
    // No longer needed - Supabase Auth handles password verification
    return password === hash
  }
}
