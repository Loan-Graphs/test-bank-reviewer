'use client'

import { useState, useEffect } from 'react'
import ReviewerView from '@/components/ReviewerView'
import AdminView from '@/components/AdminView'

type Mode = 'reviewer' | 'admin'

const SESSION_KEY = 'testbank_auth'

export default function Home() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  // Passphrases read from env or hardcoded defaults
  // In production, set NEXT_PUBLIC_REVIEWER_PASS and NEXT_PUBLIC_ADMIN_PASS
  const REVIEWER_PASS = process.env.NEXT_PUBLIC_REVIEWER_PASS || 'gabriel'
  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'lauren'

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored === 'reviewer' || stored === 'admin') {
      setMode(stored as Mode)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const val = input.trim()
    if (val === REVIEWER_PASS) {
      setMode('reviewer')
      sessionStorage.setItem(SESSION_KEY, 'reviewer')
      setError('')
    } else if (val === ADMIN_PASS) {
      setMode('admin')
      sessionStorage.setItem(SESSION_KEY, 'admin')
      setError('')
    } else {
      setError('Invalid passphrase.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setMode(null)
    setInput('')
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Test Bank Reviewer</h1>
            <p className="text-gray-500 mt-2 text-sm">Enter your passphrase to access your view</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Passphrase"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            Reviewer passphrase → gabriel view &nbsp;|&nbsp; Admin passphrase → lauren view
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Test Bank Reviewer</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mode === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {mode === 'admin' ? '👑 Admin — Lauren' : '📝 Reviewer — Gabriel'}
            </span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {mode === 'reviewer' ? <ReviewerView /> : <AdminView />}
      </main>
    </div>
  )
}
