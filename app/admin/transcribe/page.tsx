'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TranscribePage() {
  const [limit, setLimit] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTranscribe = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to transcribe')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Transcribe Radio Clips</CardTitle>
          <CardDescription>
            Use OpenAI Whisper to transcribe F1 radio messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="limit">Number of clips to transcribe</Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          <Button 
            onClick={handleTranscribe} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Transcribing...' : 'Start Transcription'}
          </Button>

          {loading && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ⏳ Transcribing clips... This may take 2-5 minutes for {limit} clips.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error:</p>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  ✅ {result.message}
                </p>
                <div className="mt-2 text-sm text-green-800 dark:text-green-200">
                  <p>Total: {result.total}</p>
                  <p>Successful: {result.successful}</p>
                  <p>Failed: {result.failed}</p>
                </div>
              </div>

              {result.results && result.results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Results:</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.results.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                          item.success
                            ? 'bg-green-50 dark:bg-green-950'
                            : 'bg-red-50 dark:bg-red-950'
                        }`}
                      >
                        <p className="font-medium">{item.title}</p>
                        {item.success ? (
                          <p className="text-xs mt-1 text-green-700 dark:text-green-300">
                            {item.transcript}...
                          </p>
                        ) : (
                          <p className="text-xs mt-1 text-red-700 dark:text-red-300">
                            Error: {item.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
