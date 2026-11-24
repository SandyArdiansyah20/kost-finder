import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth.jsx'

export function useFavorites() {
  const { user } = useAuth()
  const [ids, setIds] = useState(new Set())

  useEffect(() => {
    if (!user) { setIds(new Set()); return }
    supabase.from('favorites').select('listing_id').eq('user_id', user.id)
      .then(({ data }) => setIds(new Set((data ?? []).map((r) => r.listing_id))))
  }, [user])

  const toggle = useCallback(async (listingId) => {
    if (!user) return false
    const next = new Set(ids)
    if (ids.has(listingId)) {
      next.delete(listingId)
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId)
    } else {
      next.add(listingId)
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId })
    }
    setIds(next)
    return true
  }, [user, ids])

  return { ids, toggle }
}
