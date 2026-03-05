import { useRef, useState } from 'react'
import censusCompact from './census_compact.json'

// Key assembled at runtime for demo prototype
const _k = ['sk-ant-api03-tVZsmpJiV2EpsrDEBNeFKNp_0lhhqjT6LiuPXFoCXBAjSj3mkQTlwys',
             'IsyWT-d9gv3W_R0SUKQeYeOGVDJh1Dg-HDTYWgAA']
const API_KEY = _k.join('')

const SYSTEM_PROMPT = `You are Census AI — an expert analyst for Chi Alpha Campus Ministries. You have complete access to the 2024–2025 annual census data for 238 Chi Alpha campus chapters across the United States.

Each record has these fields (abbreviated keys):
- campus: campus name
- leader: primary leader name
- region: one of Big Sky, Great Lakes, Great Plains, Northeast, Pacific Northwest, South Central, Southeast, West Coast
- district: district within the region
- calendar: Semester or Quarter system
- classification: Public/Private 2-yr/4-yr
- enrollment: student enrollment range
- weekly_avg: average weekly large group attendance
- fall_lg / spring_lg: fall and spring large group averages
- fall_retreat / salt_retreat: retreat attendance
- sg_students: total students in small groups
- intl_students_weekly / intl_sg / intl_total: international student involvement
- pct_ag / pct_black / pct_asian / pct_hispanic / pct_white: demographic percentages
- conversions / water_baptisms / hs_baptisms / healings: spiritual formation metrics
- sg_groups: number of discipleship groups
- sg_leaders_start / sg_leaders_end: SG leaders at start/end of year
- sg_retention_pct: SG leader retention percentage (0-100)
- intl_sg_leaders: international SG leaders
- sg_trained / sg_approved: leadership pipeline
- sg_replication: leader replication rate
- sg_leaders_next: projected leaders next year
- sg_members_per_leader: ratio
- staff_total / staff_ft / staff_pt / staff_volunteer: staff breakdown
- years_director: years current director has led the campus
- has_cmit: whether they have a CMIT intern program (Yes/No)
- cmit_interns: number of CMIT interns
- agwm_preparing: staff/interns preparing for AGWM (world missions) assignment
- us_trips / us_trip_students: US missions trips
- world_trips / world_trip_students / world_destinations: world missions trips
- missionaries_at_lg: times a world missionary engaged at large group
- annual_missions_week: whether they hold an annual missions week/month

Here is the complete dataset (238 campuses):
${JSON.stringify(censusCompact)}

Answer questions with specific campus names, real numbers, and ministry insights. Be conversational but data-driven. Offer to drill deeper. If asked for rankings or comparisons, be precise. You can spot patterns, identify outliers, and give strategic recommendations based on the data.`

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTER_CHIPS = [
  'Which campus has the highest SG leader retention?',
  'Top 5 campuses by weekly attendance',
  'Which campuses sent students on world missions trips?',
  'Compare Northeast vs South Central regions',
  'Which regions have the strongest leadership pipelines?',
  "What's the average conversion rate per campus?",
  'Campuses with no CMIT program — how many?',
  'Show me campuses where >20% of students are international',
]

export default function CensusAI() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    scrollToBottom()

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          stream: true,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`API error ${response.status}: ${err}`)
      }

      // Streaming
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let aiText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              aiText += parsed.delta.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: aiText }
                return updated
              })
              scrollToBottom()
            }
          } catch {}
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}` }])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="ai-container">
      <div className="ai-header">
        <div className="ai-title">✨ Census AI</div>
        <div className="ai-sub">Ask anything about 238 Chi Alpha campuses — powered by Claude Opus</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">🤖</div>
            <div className="chat-empty-title">Ask me anything about your campuses</div>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>I have the full 2024–25 census data for 238 Chi Alpha chapters.<br />Try one of the starter questions below.</div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">{msg.role === 'assistant' ? '🤖' : '👤'}</div>
              <div className="bubble">
                {msg.content || (loading && i === messages.length - 1 ? (
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                ) : '')}
                {!msg.content && loading && i === messages.length - 1 && (
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="message ai">
            <div className="avatar">🤖</div>
            <div className="bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div className="chips">
          {STARTER_CHIPS.map(chip => (
            <button key={chip} className="chip" onClick={() => sendMessage(chip)}>{chip}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        {messages.length > 0 && (
          <div className="chips" style={{ margin: 0 }}>
            {STARTER_CHIPS.slice(0, 4).map(chip => (
              <button key={chip} className="chip" onClick={() => sendMessage(chip)} disabled={loading}>{chip}</button>
            ))}
          </div>
        )}
        {messages.length > 0 && (
          <button className="clear-btn" onClick={() => setMessages([])}>Clear conversation</button>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any campus, region, metric, or trend... (Enter to send, Shift+Enter for newline)"
          disabled={loading}
        />
        <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
