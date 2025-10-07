"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { syncOpenF1, runTranscription, runAutoTag } from "@/app/actions/admin"
import { useState } from "react"
import { Download, FileText, Tag } from "lucide-react"

export function UpdateSection() {
  const [syncYear, setSyncYear] = useState<string>("2025")
  const [syncing, setSyncing] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [tagging, setTagging] = useState(false)
  const [output, setOutput] = useState<string>("")

  const handleSync = async () => {
    if (!confirm(`Sync clips from ${syncYear}? This may take several minutes.`)) {
      return
    }

    setSyncing(true)
    setOutput("Syncing clips from OpenF1 API...\n")
    
    const result = await syncOpenF1(parseInt(syncYear))
    
    if (result.success) {
      setOutput(prev => prev + "\n✅ Sync completed!\n" + result.output)
    } else {
      setOutput(prev => prev + "\n❌ Error: " + result.error)
    }
    
    setSyncing(false)
  }

  const handleTranscribe = async () => {
    if (!confirm("Transcribe all clips without transcripts? This will use OpenAI API credits.")) {
      return
    }

    setTranscribing(true)
    setOutput("Starting transcription...\n")
    
    const result = await runTranscription()
    
    if (result.success) {
      setOutput(prev => prev + "\n✅ Transcription completed!\n" + result.output)
    } else {
      setOutput(prev => prev + "\n❌ Error: " + result.error)
    }
    
    setTranscribing(false)
  }

  const handleAutoTag = async (limit?: number) => {
    if (!confirm(`Auto-tag ${limit ? limit : 'all'} clips? This will use OpenAI API credits.`)) {
      return
    }

    setTagging(true)
    setOutput("Starting auto-tagging...\n")
    
    const result = await runAutoTag(limit)
    
    if (result.success) {
      setOutput(prev => prev + "\n✅ Auto-tagging completed!\n" + result.output)
    } else {
      setOutput(prev => prev + "\n❌ Error: " + result.error)
    }
    
    setTagging(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sync OpenF1 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Sync Clips
            </CardTitle>
            <CardDescription>
              Fetch new clips from OpenF1 API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
            <Select value={syncYear} onValueChange={setSyncYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="w-full"
            >
              {syncing ? "Syncing..." : `Sync ${syncYear}`}
            </Button>
          </CardContent>
        </Card>

        {/* Transcribe */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcribe
            </CardTitle>
            <CardDescription>
              Generate transcripts using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
            <p className="text-sm text-muted-foreground">
              Transcribe all clips without transcripts
            </p>
            <Button 
              onClick={handleTranscribe} 
              disabled={transcribing}
              className="w-full"
            >
              {transcribing ? "Transcribing..." : "Start Transcription"}
            </Button>
          </CardContent>
        </Card>

        {/* Auto-Tag */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Auto-Tag
            </CardTitle>
            <CardDescription>
              Categorize clips using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAutoTag(10)} 
                disabled={tagging}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                10 clips
              </Button>
              <Button 
                onClick={() => handleAutoTag(100)} 
                disabled={tagging}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                100 clips
              </Button>
            </div>
            <Button 
              onClick={() => handleAutoTag()} 
              disabled={tagging}
              className="w-full"
            >
              {tagging ? "Tagging..." : "Tag All"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Output Console */}
      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {output}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
