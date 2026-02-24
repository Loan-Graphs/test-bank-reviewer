'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const SUBJECTS = ['Mortgage Basics', 'Compliance', 'Underwriting', 'FHA/VA/USDA', 'Conventional']

export default function ReviewerView() {
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined)
  const [note, setNote] = useState('')
  const [lastAction, setLastAction] = useState<string | null>(null)

  const progress = useQuery(api.questions.getProgress)
  const nextQuestion = useQuery(api.questions.getNextPending, {
    subject: selectedSubject,
  })
  const seedMutation = useMutation(api.questions.importMockData)
  const reviewMutation = useMutation(api.questions.review)
  const enqueueAll = useMutation(api.queue.enqueueAll)

  const handleSeed = async () => {
    const subject = selectedSubject || 'Mortgage Basics'
    await seedMutation({ subject })
    await enqueueAll()
  }

  const handleReview = async (action: 'approve' | 'override' | 'skip') => {
    if (!nextQuestion) return
    await reviewMutation({
      questionId: nextQuestion._id,
      action,
      humanNote: note || undefined,
      reviewer: 'gabriel',
    })
    setNote('')
    setLastAction(action)
    setTimeout(() => setLastAction(null), 2000)
  }

  const verdictColors: Record<string, string> = {
    correct: 'bg-green-50 border-green-200 text-green-800',
    incorrect: 'bg-red-50 border-red-200 text-red-800',
    needs_review: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }

  const confidenceColor = (conf?: number) => {
    if (!conf) return 'text-gray-400'
    if (conf >= 80) return 'text-green-600'
    if (conf >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {progress && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Review Progress</h2>
            <span className="text-sm text-gray-500">
              {progress.total - progress.pending} / {progress.total} reviewed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${progress.total > 0 ? ((progress.total - progress.pending) / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✓ {progress.approved} approved</span>
            <span className="text-orange-500">↩ {progress.overridden} overridden</span>
            <span className="text-gray-400">⏭ {progress.skipped} skipped</span>
            <span className="text-indigo-600">⏳ {progress.pending} pending</span>
          </div>
        </div>
      )}

      {/* Subject Selector */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subject</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSubject(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedSubject ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Subjects
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSubject === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* No questions seeded */}
      {progress && progress.total === 0 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">No questions loaded yet. Load mock data to get started.</p>
          <button
            onClick={handleSeed}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Load Mock Q&amp;A Data (Mortgage Basics)
          </button>
        </div>
      )}

      {/* All done */}
      {progress && progress.total > 0 && !nextQuestion && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900">All caught up!</h3>
          <p className="text-green-700 mt-1">No pending questions for {selectedSubject || 'any subject'}.</p>
        </div>
      )}

      {/* Question Card */}
      {nextQuestion && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{nextQuestion.subject}</span>
              {lastAction && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lastAction === 'approve' ? 'bg-green-100 text-green-700' : lastAction === 'override' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                  {lastAction === 'approve' ? '✓ Approved' : lastAction === 'override' ? '↩ Overridden' : '⏭ Skipped'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">{nextQuestion.question}</h2>
          </div>

          {/* Options (if MCQ) */}
          {nextQuestion.options && nextQuestion.options.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Answer Choices</p>
              <div className="space-y-2">
                {nextQuestion.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${opt === nextQuestion.correctAnswer ? 'border-green-300 bg-green-50 text-green-800 font-medium' : 'border-gray-200 text-gray-700'}`}
                  >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {opt === nextQuestion.correctAnswer && <span className="ml-2 text-green-600">✓ Correct</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Correct Answer</p>
            <p className="text-gray-900 font-medium">{nextQuestion.correctAnswer}</p>
          </div>

          {/* Claude's Verdict */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Claude's Pre-Evaluation</p>
            {nextQuestion.claudeVerdict ? (
              <div className={`p-4 rounded-lg border ${verdictColors[nextQuestion.claudeVerdict] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{nextQuestion.claudeVerdict.replace('_', ' ')}</span>
                  <span className={`text-sm font-bold ${confidenceColor(nextQuestion.claudeConfidence)}`}>
                    {nextQuestion.claudeConfidence}% confidence
                  </span>
                </div>
                <p className="text-sm">{nextQuestion.claudeExplanation}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  Claude evaluation pending... Questions are evaluated in background queue.
                  <br />
                  <span className="text-xs text-gray-400 mt-1 block">
                    In production, trigger via /api/evaluate endpoint or run the background worker.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Reviewer Note */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Reviewer Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this question or answer..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex gap-3">
            <button
              onClick={() => handleReview('approve')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => handleReview('override')}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Override
            </button>
            <button
              onClick={() => handleReview('skip')}
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
