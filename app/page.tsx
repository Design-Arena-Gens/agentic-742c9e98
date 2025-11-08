'use client'

import { useState } from 'react'

interface AnalysisResult {
  verdict: 'real' | 'fake' | 'uncertain'
  confidence: number
  analysis: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUrl('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    setFile(null)
    setPreview(null)
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()

      if (file) {
        formData.append('file', file)
      } else if (url) {
        formData.append('url', url)
      } else {
        setError('براہ کرم ایک URL یا فائل فراہم کریں')
        setLoading(false)
        return
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'تجزیہ میں خرابی')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'کچھ غلط ہو گیا')
    } finally {
      setLoading(false)
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'real': return 'سچی خبر'
      case 'fake': return 'جھوٹی خبر'
      case 'uncertain': return 'غیر یقینی'
      default: return verdict
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">خبروں کی تصدیق</h1>
        <p className="subtitle">News Verifier - Check if news, images, and videos are real or fake</p>
      </div>

      <div className="input-section">
        <label className="label">خبر کا لنک (URL)</label>
        <div className="input-group">
          <input
            type="text"
            className="input"
            placeholder="https://example.com/news-article یا تصویر/ویڈیو کا لنک"
            value={url}
            onChange={handleUrlChange}
            disabled={loading || !!file}
          />
        </div>

        <label className="label">یا تصویر/ویڈیو اپ لوڈ کریں</label>
        <label className="file-label">
          <input
            type="file"
            className="file-input"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={loading || !!url}
          />
          {file ? `منتخب شدہ: ${file.name}` : 'فائل منتخب کریں'}
        </label>

        {preview && (
          <div className="preview">
            {file?.type.startsWith('image/') ? (
              <img src={preview} alt="Preview" />
            ) : (
              <video src={preview} controls />
            )}
          </div>
        )}

        <button
          className="button"
          onClick={handleAnalyze}
          disabled={loading || (!url && !file)}
        >
          {loading ? 'تجزیہ جاری ہے...' : 'تجزیہ کریں'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>براہ کرم انتظار کریں، تجزیہ جاری ہے...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>خرابی:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result">
          <div className="result-header">
            <span className={`badge badge-${result.verdict}`}>
              {getVerdictText(result.verdict)}
            </span>
            <span className="confidence">
              یقین: {result.confidence}%
            </span>
          </div>
          <div className="analysis">
            <strong>تفصیلی تجزیہ:</strong>
            <br /><br />
            {result.analysis}
          </div>
        </div>
      )}
    </div>
  )
}
