'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const SUBJECTS = ['Mortgage Basics', 'Compliance', 'Underwriting', 'FHA/VA/USDA', 'Conventional']

export default function AdminView() {
  const [importSubject, setImportSubject] = useState(SUBJECTS[0])
  const [sheetUrl, setSheetUrl] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const progress = useQuery(api.questions.getProgress)
  const queueStatus = useQuery(api.queue.getStatus)
  const memories = useQuery(api.memory.listAll)
  const seedMutation = useMutation(api.questions.importMockData)
  const enqueueAll = useMutation(api.queue.enqueueAll)

  const handleMockImport = async () => {
    setIsImporting(true)
    setImportStatus(null)
    try {
      const result = await seedMutation({ subject: importSubject })
      await enqueueAll()
      setImportStatus(result.seeded ? `✓ Imported ${result.count} mock questions for "${importSubject}" and queued for Claude evaluation.` : `Questions for "${importSubject}" already exist.`)
    } catch (e) {
      setImportStatus(`Error: ${e}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleSheetImport = async () => {
    // TODO: Google Sheets integration
    // 1. Parse sheetUrl to extract spreadsheetId
    // 2. Use Google Sheets API with service account credentials (GOOGLE_SERVICE_ACCOUNT_JSON env var)
    // 3. Read Q+A pairs from the specified sheet/range
    // 4. Insert into questions table via importFromSheet mutation
    // 5. Enqueue all for Claude evaluation
    // 6. Sync approved verdicts back via Google Sheets API write
    //
    // Service account setup: see docs/google-sheets-setup.md
    // Required env vars: GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_SCOPES
    setImportStatus('⚠️ Google Sheets integration not yet configured. Use mock data import above. See TODO in AdminView.tsx for setup instructions.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Import question banks, monitor review progress, manage Claude memory.</p>
      </div>

      {/* Progress Overview */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: progress.total, color: 'text-gray-900' },
            { label: 'Pending', value: progress.pending, color: 'text-indigo-600' },
            { label: 'Approved', value: progress.approved, color: 'text-green-600' },
            { label: 'Overridden', value: progress.overridden, color: 'text-orange-500' },
            { label: 'Skipped', value: progress.skipped, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Per-Subject Breakdown */}
      {progress && Object.keys(progress.subjects).length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Progress by Subject</h2>
          <div className="space-y-3">
            {Object.entries(progress.subjects).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{subject}</span>
                  <span className="text-gray-500">{data.done}/{data.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.total > 0 ? (data.done / data.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Queue Status */}
      {queueStatus && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Claude Evaluation Queue</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-indigo-600">{queueStatus.queued}</p>
              <p className="text-xs text-gray-500">Queued</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-500">{queueStatus.processing}</p>
              <p className="text-xs text-gray-500">Processing</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{queueStatus.done}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{queueStatus.failed}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Background evaluation runs via /api/evaluate. Each question is sent to Claude with subject-specific memory context.
          </p>
        </div>
      )}

      {/* Import Section */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-4">Import Question Bank</h2>

        {/* Mock Data Import */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Mock Data Import (Dev Mode)</h3>
          <div className="flex gap-3">
            <select
              value={importSubject}
              onChange={(e) => setImportSubject(e.target.value)}
              className="border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleMockImport}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isImporting ? 'Importing...' : 'Import Mock Q&A'}
            </button>
          </div>
        </div>

        {/* Google Sheets Import */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-1">Google Sheets Import</h3>
          <p className="text-xs text-gray-500 mb-3">
            {/* TODO: Set up Google Sheets service account */}
            {/* Required: GOOGLE_SERVICE_ACCOUNT_JSON env var with service account credentials */}
            {/* The sheet must have columns: Question, Correct Answer, [Option A, Option B, Option C, Option D] */}
            ⚠️ Requires Google Sheets service account setup. See README for instructions.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Google Sheets URL or ID"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={importSubject}
              onChange={(e) => setImportSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleSheetImport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Import from Sheet
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="mt-3 p-3 rounded-lg bg-gray-100 text-sm text-gray-700">
            {importStatus}
          </div>
        )}
      </div>

      {/* Claude Memory */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-1">Claude Subject Memory</h2>
        <p className="text-sm text-gray-500 mb-4">Patterns where Claude made mistakes — used to improve future prompts.</p>
        {!memories || memories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No mistakes recorded yet.</p>
            <p className="text-xs mt-1">Mistakes are logged when a reviewer overrides Claude's verdict.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((m) => (
              <div key={m._id} className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-yellow-800">{m.subject}</span>
                  <span className="text-yellow-600">{m.createdAt.slice(0, 10)}</span>
                </div>
                <p className="text-sm font-medium text-yellow-900">Pattern: {m.mistakePattern}</p>
                <p className="text-xs text-yellow-700 mt-1">Example: {m.exampleQuestion}</p>
                <p className="text-xs text-green-700 mt-1">✓ Resolution: {m.resolution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
