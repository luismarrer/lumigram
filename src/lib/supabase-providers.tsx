'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { createContext, useContext, useEffect, useState } from 'react'

type SupabaseContext = {
    supabase: SupabaseClient | null
    isLoaded: boolean
    error: Error | null
}

const Context = createContext<SupabaseContext>({
    supabase: null,
    isLoaded: false,
    error: null
})

type Props = {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export default function SupabaseProvider({ children, fallback = <div>Loading...</div> }: Props) {
    const { session, isLoaded: isClerkLoaded } = useSession()
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const initSupabase = async () => {
        if (!isClerkLoaded) return

        try {
            if (!session) {
                setSupabase(null)
                setIsLoaded(true)
                return
            }

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Missing Supabase environment variables')
            }

            const token = await session.getToken({ template: 'supabase' })
            
            const client = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            })

            setSupabase(client)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to initialize Supabase client'))
        } finally {
            setIsLoaded(true)
        }
        }

        if (isClerkLoaded) {
            initSupabase()
        }
    }, [session, isClerkLoaded])

    return (
        <Context.Provider value={{ supabase, isLoaded, error }}>
            {!isLoaded ? fallback : error ? (
                <div className="text-red-500">
                    Error: {error.message}
                </div>
            ) : children}
        </Context.Provider>
    )
}

export const useSupabase = () => {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider')
    }
    return {
        supabase: context.supabase,
        isLoaded: context.isLoaded
    }
}