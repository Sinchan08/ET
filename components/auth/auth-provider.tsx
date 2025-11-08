"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  rrno?: string; // <-- ADD THIS LINE (it's optional, for admins)
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "user" | "admin") => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    // const token = localStorage.getItem("auth_token") // We are not using tokens, so we remove this
    const userData = localStorage.getItem("user_data")

    if (userData) { // <-- THIS IS THE FIX
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  // --- FIX 2: Added 'role' as an argument to the function ---
  const login = async (email: string, password: string, role: "user" | "admin"): Promise<boolean> => {
    setLoading(true); // Added this to manage loading state
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // --- FIX 3: Added 'role' to the body of the request ---
        body: JSON.stringify({ email, password, role }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // This assumes your login API returns a 'user' object and not a 'token'
        // based on our previous API code.
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user)

        setLoading(false); // Stop loading
        return true
      }
      setLoading(false); // Stop loading
      return false
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false); // Stop loading
      return false
    }
  }

  const logout = () => {
    /**
     * Clears local session and returns user to the role selection landing page.
     * No authentication is enforced in the current build.
     */
    localStorage.removeItem("auth_token") // Keep these just in case
    localStorage.removeItem("user_data")
    setUser(null)
    router.push("/auth")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}