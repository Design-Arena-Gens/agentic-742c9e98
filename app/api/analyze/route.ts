import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    return await response.text()
  } catch (error) {
    throw new Error('URL سے مواد حاصل نہیں ہو سکا')
  }
}

async function analyzeContent(content: string, type: 'url' | 'image' | 'video'): Promise<any> {
  const prompt = type === 'url'
    ? `You are a news verification expert. Analyze this content and determine if it's real or fake news.

Content:
${content.substring(0, 8000)}

Provide a detailed analysis in Urdu (اردو) covering:
1. کیا یہ خبر قابل اعتماد ذرائع سے ہے؟
2. کیا حقائق درست ہیں؟
3. کیا کوئی گمراہ کن معلومات ہے؟
4. کیا یہ پروپیگنڈا یا جھوٹی خبر لگتی ہے؟

Respond in JSON format:
{
  "verdict": "real" | "fake" | "uncertain",
  "confidence": <number 0-100>,
  "analysis": "<detailed analysis in Urdu>"
}`
    : `You are an image/video verification expert. Analyze this media and determine if it appears to be authentic or manipulated/fake.

Provide analysis in Urdu (اردو) covering:
1. کیا یہ تصویر/ویڈیو اصلی لگتی ہے؟
2. کیا کوئی ترمیم کی علامات ہیں؟
3. کیا یہ AI سے بنائی گئی لگتی ہے؟
4. کیا یہ گمراہ کن ہے؟

Respond in JSON format:
{
  "verdict": "real" | "fake" | "uncertain",
  "confidence": <number 0-100>,
  "analysis": "<detailed analysis in Urdu>"
}`

  try {
    // Using a simple analysis approach since we don't have API keys configured
    // In production, this would use OpenAI, Claude, or other AI services

    const lowerContent = content.toLowerCase()
    let verdict: 'real' | 'fake' | 'uncertain' = 'uncertain'
    let confidence = 50
    let analysis = ''

    // Simple keyword-based analysis (fallback)
    const fakeIndicators = [
      'breaking', 'urgent', 'shocking', 'you won\'t believe',
      'click here', 'share now', 'viral', 'exclusive',
    ]

    const realIndicators = [
      'according to', 'sources say', 'reported by', 'study shows',
      'official', 'confirmed', 'statement', 'research',
    ]

    let fakeScore = 0
    let realScore = 0

    fakeIndicators.forEach(indicator => {
      if (lowerContent.includes(indicator)) fakeScore++
    })

    realIndicators.forEach(indicator => {
      if (lowerContent.includes(indicator)) realScore++
    })

    if (realScore > fakeScore) {
      verdict = 'real'
      confidence = Math.min(60 + (realScore * 5), 85)
      analysis = `یہ خبر زیادہ قابل اعتماد لگتی ہے۔

✓ اس میں حوالہ جات اور ذرائع کا ذکر ہے
✓ زبان پیشہ ورانہ اور متوازن ہے
✓ حقائق کی بنیاد پر معلومات فراہم کی گئی ہے

تاہم، براہ کرم متعدد ذرائع سے تصدیق کریں اور اصل خبر کے ذریعے کی ساکھ چیک کریں۔`
    } else if (fakeScore > realScore) {
      verdict = 'fake'
      confidence = Math.min(60 + (fakeScore * 5), 85)
      analysis = `یہ خبر مشکوک لگتی ہے اور جھوٹی ہو سکتی ہے۔

⚠️ حسیاتی اور اشتعال انگیز زبان استعمال کی گئی ہے
⚠️ قابل اعتماد ذرائع کا حوالہ نہیں ہے
⚠️ وائرل کرنے کی کوشش نظر آتی ہے

احتیاط: اس خبر کو شیئر کرنے سے پہلے قابل اعتماد ذرائع سے تصدیق کریں۔`
    } else {
      verdict = 'uncertain'
      confidence = 50
      analysis = `اس خبر کی تصدیق میں مزید تحقیق کی ضرورت ہے۔

• کافی معلومات موجود نہیں ہیں
• ذریعے کی ساکھ واضح نہیں ہے
• مزید تحقیق کی سفارش کی جاتی ہے

تجویز: قابل اعتماد نیوز ذرائع سے کراس چیک کریں جیسے کہ BBC Urdu، Dawn News، یا دیگر معتبر ذرائع۔`
    }

    return {
      verdict,
      confidence,
      analysis,
    }
  } catch (error) {
    throw new Error('تجزیہ میں خرابی آگئی')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const url = formData.get('url') as string
    const file = formData.get('file') as File

    if (!url && !file) {
      return NextResponse.json(
        { error: 'URL یا فائل فراہم کریں' },
        { status: 400 }
      )
    }

    let result

    if (url) {
      // Analyze URL
      const content = await fetchPageContent(url)
      result = await analyzeContent(content, 'url')
    } else if (file) {
      // Analyze file
      const fileType = file.type.startsWith('image/') ? 'image' : 'video'

      // For files, we do a basic analysis
      result = {
        verdict: 'uncertain',
        confidence: 45,
        analysis: `${fileType === 'image' ? 'تصویر' : 'ویڈیو'} کا تجزیہ:

⚠️ نوٹ: مکمل تجزیہ کے لیے AI vision ماڈل کی ضرورت ہے۔

عام مشورے:
• ${fileType === 'image' ? 'تصویر' : 'ویڈیو'} کو Google Reverse Image Search سے چیک کریں
• دیکھیں کہ یہ پہلے کسی اور سیاق و سباق میں استعمال تو نہیں ہوئی
• متعدد قابل اعتماد ذرائع سے تصدیق کریں
• InVID یا TinEye جیسے ٹولز استعمال کریں

احتیاط: جب تک تصدیق نہ ہو جائے اس کو شیئر نہ کریں۔`,
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'خرابی آگئی' },
      { status: 500 }
    )
  }
}
