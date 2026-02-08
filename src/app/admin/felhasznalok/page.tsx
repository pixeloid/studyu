'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface UserRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  role: string
  created_at: string | null
}

interface UsersResponse {
  users: UserRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false

    async function fetchUsers() {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(page))

      try {
        const res = await fetch(`/api/admin/users?${params}`)
        const data: UsersResponse = await res.json()
        if (!cancelled) {
          setUsers(data.users)
          setTotal(data.total)
          setTotalPages(data.totalPages)
        }
      } catch {
        if (!cancelled) setUsers([])
      }
      if (!cancelled) setLoading(false)
    }

    fetchUsers()
    return () => { cancelled = true }
  }, [roleFilter, debouncedSearch, page])

  const roles = [
    { value: 'all', label: 'Összes' },
    { value: 'admin', label: 'Adminok' },
    { value: 'user', label: 'Felhasználók' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Felhasználók</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white p-4 border-[3px] border-black mb-6"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => { setRoleFilter(r.value); setPage(1) }}
                className={`
                  px-4 py-2 font-bugrino text-sm uppercase tracking-wider border-[2px] border-black
                  transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]
                  ${roleFilter === r.value
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-50'
                  }
                `}
                style={{ boxShadow: roleFilter === r.value ? '3px 3px 0 var(--bauhaus-blue)' : 'none' }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés név alapján..."
              className="w-full px-4 py-2 border-[2px] border-black bg-white focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow font-bugrino text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
              <tr className="border-b-[3px] border-black">
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Név
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Cég
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Szerepkör
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Regisztráció
                </th>
                <th className="px-6 py-4 text-right font-bugrino text-xs uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b-[2px] border-gray-200">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-5 bg-gray-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b-[2px] border-gray-200 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">{user.full_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{user.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{user.company_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <BauhausBadge variant={user.role === 'admin' ? 'red' : 'outline'}>
                        {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
                      </BauhausBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at && format(new Date(user.created_at), 'yyyy.MM.dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/felhasznalok/${user.id}`}
                        className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                      >
                        Részletek
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">
                      Nincs találat
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t-[3px] border-black flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Összesen <span className="font-bugrino">{total}</span> felhasználó
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 text-sm font-bugrino uppercase tracking-wider border-[2px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                >
                  Előző
                </button>
              )}
              <span className="px-4 py-2 text-sm font-bugrino">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 text-sm font-bugrino uppercase tracking-wider border-[2px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                >
                  Következő
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
