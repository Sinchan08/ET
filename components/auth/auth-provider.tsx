"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// --- FIX 1: Add 'rrno' and 'id' to the User type ---
interface User {
  id: number // Use number for the database ID
  email: string
  name: string
  role: "user" | "admin"
  rrno?: string // This is the fix for the 'rrno does not exist' error
}

interface AuthContextType {
  user: User | null
  // Update login function type to accept role
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
    // const token = localStorage.getItem("auth_token") // We are not using this
    const userData = localStorage.getItem("user_data")

    // --- FIX 2: Check for 'userData' only ---
    // This was the bug causing the "You are not logged in" error
    if (userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  // --- FIX 3: Add 'role' to the function and the request body ---
  const login = async (email: string, password: string, role: "user" | "admin"): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }), // Add 'role'
      })

      if (response.ok) {
        const data = await response.json()
        // localStorage.setItem("auth_token", data.token) // Not using token
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user)
        setLoading(false);
        return true
      }
      setLoading(false);
      return false
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false);
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
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