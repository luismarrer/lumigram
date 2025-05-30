'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from './supabase-providers'

export function UserSync() {
    const { user } = useUser()
    const { supabase, isLoaded } = useSupabase()

    useEffect(() => {
        const syncUser = async () => {
            if (!user || !supabase || !isLoaded) return

            try {
                const { error } = await supabase
                    .from('users')
                    .upsert({
                        id: user.id,
                        username: user.username || user.id,
                        full_name: user.fullName,
                        avatar_url: user.imageUrl,
                    }, {
                        onConflict: 'id'
                    })

                if (error) {
                    console.error('Error syncing user:', error)
                }
            } catch (error) {
                console.error('Error syncing user:', error)
            }
        }

        syncUser()
    }, [user, supabase, isLoaded])

    return null
}
