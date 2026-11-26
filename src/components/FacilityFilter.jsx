import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function FacilityFilter({ value, onChange }) {
    const [facilities, setFacilities] = useState([])

    useEffect(() => {
        supabase
            .from('facilities')
            .select('id, name')
            .order('id')
            .then(({ data }) => setFacilities(data ?? []))
    }, [])

    const getStatus = (name) => {
        if (value.include.includes(name)) return 'include'
        if (value.exclude.includes(name)) return 'exclude'
        return 'neutral'
    }

    const toggleTag = (name) => {
        const status = getStatus(name)
        let include = [...value.include]
        let exclude = [...value.exclude]

        if (status === 'neutral') {
            include.push(name)
        } else if (status === 'include') {
            include = include.filter((item) => item !== name)
            exclude.push(name)
        } else {
            exclude = exclude.filter((item) => item !== name)
        }

        onChange({ include, exclude })
    }

    const hasFilter = value.include.length > 0 || value.exclude.length > 0

    if (facilities.length === 0) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Filter Fasilitas
                </span>
                {hasFilter && (
                    <button
                        type="button"
                        onClick={() => onChange({ include: [], exclude: [] })}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                        Reset fasilitas
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {facilities.map((f) => {
                    const status = getStatus(f.name)

                    let style = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    let prefix = ''

                    if (status === 'include') {
                        style = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                    } else if (status === 'exclude') {
                        style = 'border-red-500 bg-red-50 text-red-700 font-medium'
                    }

                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleTag(f.name)}
                            className={`rounded-full border px-3 py-1 text-xs transition ${style}`}
                        >
                            {prefix}{f.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}