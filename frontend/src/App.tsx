import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type Summary = {
  total_inspections: number
  total_defects: number
  total_pass: number
  defect_rate_percent: number
  total_qdn: number
  lots_on_hold: string[]
  top_defect_type: string | null
}

type DefectItem = { defect_type: string; count: number }
type MachineItem = { machine_id: string; inspection_count: number }
type InspectionResponse = {
  message?: string
  inspection_id: number
  lot_id: string
  machine_id: string
  image_path?: string
  prediction: {
    filename?: string
    defect_type: string
    confidence: number
    status: string
  }
  qdn: {
    qdn_required: boolean
    containment_status: string
    reason: string
  }
  qdn_record_id?: number | null
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')
).replace(/\/+$/, '')
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !API_BASE_URL
const ROUTES = {
  summary: ['/api/v1/dashboard/summary', '/api/dashboard/summary', '/dashboard/summary'],
  defects: ['/api/v1/dashboard/defect-breakdown', '/api/dashboard/defect-breakdown', '/dashboard/defect-breakdown'],
  machines: ['/api/v1/dashboard/machine-breakdown', '/api/dashboard/machine-breakdown', '/dashboard/machine-breakdown'],
  inspection: ['/api/v1/predict/', '/api/predict/', '/predict/', '/inspect', '/inspections'],
}

const MOCK_SUMMARY: Summary = {
  total_inspections: 1284,
  total_defects: 73,
  total_pass: 1211,
  defect_rate_percent: 5.69,
  total_qdn: 12,
  lots_on_hold: ['LOT-24081', 'LOT-24096', 'LOT-24102'],
  top_defect_type: 'Surface Scratch',
}

const MOCK_DEFECTS: DefectItem[] = [
  { defect_type: 'Surface Scratch', count: 28 },
  { defect_type: 'Dent', count: 19 },
  { defect_type: 'Contamination', count: 14 },
  { defect_type: 'Misalignment', count: 8 },
  { defect_type: 'Other', count: 4 },
]

const MOCK_MACHINES: MachineItem[] = [
  { machine_id: 'LINE-A01', inspection_count: 346 },
  { machine_id: 'LINE-A02', inspection_count: 298 },
  { machine_id: 'LINE-B01', inspection_count: 271 },
  { machine_id: 'LINE-B02', inspection_count: 214 },
  { machine_id: 'LINE-C01', inspection_count: 155 },
]

const DEFECT_COLORS = ['#f7904b', '#e9bd57', '#ae8bf5', '#55b9a2', '#72819a']
const numberFormat = new Intl.NumberFormat('en-US')

function createMockInspection(file: File, lotNumber: string, machineId: string): InspectionResponse {
  const inspectionId = Date.now()
  return {
    message: 'Simulated demo inspection; no image inference was performed.',
    inspection_id: inspectionId,
    lot_id: lotNumber,
    machine_id: machineId,
    image_path: file.name,
    prediction: {
      filename: file.name,
      defect_type: 'surface_scratch',
      confidence: 0.94,
      status: 'DEFECT',
    },
    qdn: {
      qdn_required: true,
      containment_status: 'LOT_ON_HOLD',
      reason: 'Detected surface_scratch with confidence 0.94',
    },
    qdn_record_id: inspectionId + 1,
  }
}

function isApiUnavailable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return (
    !error.response ||
    status === 404 ||
    status === 405 ||
    status === 408 ||
    (status !== undefined && status >= 500)
  )
}

async function getFromRoutes<T>(routes: string[]): Promise<T> {
  let lastError: unknown

  for (const route of routes) {
    try {
      const response = await axios.get<T>(`${API_BASE_URL}${route}`, { timeout: 5000 })
      return response.data
    } catch (error) {
      lastError = error
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status !== 404 && status !== 405) throw error
    }
  }

  throw lastError ?? new Error('No compatible API route was found.')
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (!error.response) return 'Could not reach the API. Check that the backend is running.'
    return `Inspection request failed (${error.response.status}). Please try again.`
  }

  return 'The inspection could not be completed. Please try again.'
}

function App() {
  const [summary, setSummary] = useState(MOCK_SUMMARY)
  const [defects, setDefects] = useState(MOCK_DEFECTS)
  const [machines, setMachines] = useState(MOCK_MACHINES)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [usingMockData, setUsingMockData] = useState(DEMO_MODE)
  const [refreshing, setRefreshing] = useState(false)
  const [lotNumber, setLotNumber] = useState('')
  const [machineId, setMachineId] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [inspection, setInspection] = useState<InspectionResponse | null>(null)
  const [inspectionIsMock, setInspectionIsMock] = useState(false)
  const [inspectionError, setInspectionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function loadDashboard(showRefreshIndicator = true) {
    if (DEMO_MODE) {
      setSummary(MOCK_SUMMARY)
      setDefects(MOCK_DEFECTS)
      setMachines(MOCK_MACHINES)
      setUsingMockData(true)
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (showRefreshIndicator) setRefreshing(true)
    const [summaryResult, defectsResult, machinesResult] = await Promise.allSettled([
      getFromRoutes<Summary>(ROUTES.summary),
      getFromRoutes<DefectItem[]>(ROUTES.defects),
      getFromRoutes<MachineItem[]>(ROUTES.machines),
    ])

    const hasMissingData =
      summaryResult.status === 'rejected' ||
      defectsResult.status === 'rejected' ||
      machinesResult.status === 'rejected'

    setSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : MOCK_SUMMARY)
    setDefects(defectsResult.status === 'fulfilled' ? defectsResult.value : MOCK_DEFECTS)
    setMachines(machinesResult.status === 'fulfilled' ? machinesResult.value : MOCK_MACHINES)
    setUsingMockData(hasMissingData)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard(false)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  async function handleInspectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!image) return

    setSubmitting(true)
    setInspectionError('')
    setInspection(null)
    setInspectionIsMock(false)

    if (DEMO_MODE) {
      setInspection(createMockInspection(image, lotNumber, machineId))
      setInspectionIsMock(true)
      setUsingMockData(true)
      setSubmitting(false)
      return
    }

    let lastError: unknown
    for (const route of ROUTES.inspection) {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('lot_id', lotNumber)
      formData.append('lot_number', lotNumber)
      formData.append('machine_id', machineId)

      try {
        const response = await axios.post<InspectionResponse>(
          `${API_BASE_URL}${route}`,
          formData,
          { timeout: 5000 },
        )
        setInspection(response.data)
        setInspectionIsMock(false)
        void loadDashboard()
        setSubmitting(false)
        return
      } catch (error) {
        lastError = error
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status !== 404 && status !== 405) break
      }
    }

    if (isApiUnavailable(lastError)) {
      setInspection(createMockInspection(image, lotNumber, machineId))
      setInspectionIsMock(true)
    } else {
      setInspectionError(getErrorMessage(lastError))
    }
    setSubmitting(false)
  }

  const holdCount = summary.lots_on_hold.length
  const chartHasData = defects.some((item) => item.count > 0)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Factory quality home">
          <span className="brand-mark"><Factory size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">Forge<span>IQ</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><Activity size={17} /> Overview</a>
          <a className="nav-item" href="#inspection"><ImagePlus size={17} /> New inspection</a>
          <a className="nav-item" href="#analytics"><ClipboardCheck size={17} /> Analytics</a>
        </nav>
        <div className="sidebar-bottom">
          <span className="live-dot" />
          <span>Quality system</span>
          <span className="online-label">{usingMockData ? 'DEMO' : 'LIVE'}</span>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span> Quality overview</div>
          <div className="topbar-right">
            <span className="environment-tag"><span className={usingMockData ? 'demo-dot' : 'live-dot'} /> {usingMockData ? 'Demo mode' : 'Production floor'}</span>
            <div className="avatar" aria-label="Quality team">QT</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading" id="overview">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> FACTORY OPERATIONS</div>
              <h1>Quality overview</h1>
              <p className="page-subtitle">Monitor inspections, detect defects, and keep production moving.</p>
            </div>
            <button className="refresh-button" type="button" onClick={() => void loadDashboard()} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh data'}
            </button>
          </section>

          {usingMockData && !loading && (
            <div className="demo-notice" role="status">
              <span className="demo-dot" />
              {DEMO_MODE
                ? 'Demo mode is on. Dashboard metrics and inspection results are simulated.'
                : 'The API is unavailable. Demo data is shown for dashboard metrics and inspections.'}
              {API_BASE_URL && <span className="demo-api">API: {API_BASE_URL}</span>}
            </div>
          )}

          <section className="kpi-grid" aria-label="Key performance indicators">
            <article className="kpi-card">
              <div className="kpi-top"><span className="kpi-icon cyan"><Activity size={17} /></span><span className="kpi-trend">ALL TIME</span></div>
              <p className="kpi-label">Total inspections</p>
              <div className="kpi-value">{loading ? <span className="skeleton-value" /> : numberFormat.format(summary.total_inspections)}</div>
              <div className="kpi-foot"><span className="kpi-foot-muted">Recorded inspections</span></div>
            </article>
            <article className="kpi-card">
              <div className="kpi-top"><span className="kpi-icon coral"><AlertTriangle size={17} /></span><span className="kpi-trend">QUALITY</span></div>
              <p className="kpi-label">Total defects</p>
              <div className="kpi-value">{loading ? <span className="skeleton-value" /> : numberFormat.format(summary.total_defects)}</div>
              <div className="kpi-foot"><span className="kpi-foot-muted">Flagged for review</span></div>
            </article>
            <article className="kpi-card">
              <div className="kpi-top"><span className="kpi-icon amber"><ArrowUpRight size={17} /></span><span className="kpi-trend">YIELD</span></div>
              <p className="kpi-label">Defect rate</p>
              <div className="kpi-value">{loading ? <span className="skeleton-value" /> : <>{summary.defect_rate_percent.toFixed(2)}<span className="kpi-unit">%</span></>}</div>
              <div className="kpi-foot"><span className="kpi-foot-muted">Of total inspections</span></div>
            </article>
            <article className="kpi-card hold-card">
              <div className="kpi-top"><span className="kpi-icon violet"><ShieldAlert size={17} /></span><span className="kpi-trend">CONTAINMENT</span></div>
              <p className="kpi-label">Active lot holds</p>
              <div className="kpi-value">{loading ? <span className="skeleton-value" /> : numberFormat.format(holdCount)}</div>
              <div className="kpi-foot"><span className={holdCount > 0 ? 'status-inline alert-text' : 'status-inline'}><span className={holdCount > 0 ? 'status-dot alert-dot' : 'status-dot'} />{holdCount > 0 ? 'Requires attention' : 'All clear'}</span></div>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel upload-panel" id="inspection">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">QUALITY CONTROL</div>
                  <h2>Run an inspection</h2>
                  <p className="panel-description">Upload a product image for AI-powered defect analysis.</p>
                </div>
                <span className="panel-heading-icon"><ImagePlus size={18} /></span>
              </div>

              <form className="inspection-form" onSubmit={handleInspectionSubmit}>
                <div className="form-row">
                  <label className="field">
                    <span>Lot number <span className="required">*</span></span>
                    <input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} placeholder="e.g. LOT-24108" required />
                  </label>
                  <label className="field">
                    <span>Machine ID <span className="required">*</span></span>
                    <input value={machineId} onChange={(event) => setMachineId(event.target.value)} placeholder="e.g. LINE-A01" required />
                  </label>
                </div>

                <label className={`upload-zone ${image ? 'has-image' : ''}`} htmlFor="product-image">
                  <input
                    id="product-image"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(event) => {
                      const selectedImage = event.target.files?.[0] ?? null
                      if (selectedImage && !selectedImage.type.startsWith('image/')) {
                        setInspectionError('Choose a valid image file.')
                        setImage(null)
                        setPreviewUrl('')
                        event.currentTarget.value = ''
                        return
                      }
                      if (selectedImage && selectedImage.size > 10 * 1024 * 1024) {
                        setInspectionError('Image must be 10 MB or less.')
                        setImage(null)
                        setPreviewUrl('')
                        event.currentTarget.value = ''
                        return
                      }
                      setInspectionError('')
                      setImage(selectedImage)
                      setPreviewUrl(selectedImage ? URL.createObjectURL(selectedImage) : '')
                    }}
                  />
                  {previewUrl ? (
                    <img className="image-preview" src={previewUrl} alt="Selected product for inspection" />
                  ) : (
                    <span className="upload-icon"><Upload size={19} /></span>
                  )}
                  <span className="upload-copy">
                    <strong>{image ? image.name : 'Drop an image or browse files'}</strong>
                    <small>{image ? `${(image.size / 1024 / 1024).toFixed(2)} MB · Click to change` : 'JPG, PNG or WEBP · Max 10 MB'}</small>
                  </span>
                  <span className="browse-button">Browse</span>
                </label>

                {inspectionError && <div className="form-error" role="alert"><AlertTriangle size={15} />{inspectionError}</div>}
                <button className="submit-button" type="submit" disabled={submitting || !image}>
                  {submitting ? <LoaderCircle size={16} className="spin" /> : <Activity size={16} />}
                  {submitting ? 'Analyzing image…' : 'Analyze product'}
                </button>
              </form>

              {inspection && (
                <div className="inspection-result" role="status">
                  <div className="result-header">
                    <div className="result-title"><CheckCircle2 size={17} /> Inspection complete <span>#{inspection.inspection_id}</span>{inspectionIsMock && <span className="demo-result-tag">SIMULATED</span>}</div>
                    <span className={inspection.prediction.status === 'DEFECT' ? 'result-status defect' : 'result-status pass'}>
                      {inspection.prediction.status}
                    </span>
                  </div>
                  <div className="result-metrics">
                    <div><small>DEFECT TYPE</small><strong>{inspection.prediction.defect_type.replaceAll('_', ' ')}</strong></div>
                    <div><small>CONFIDENCE</small><strong>{(inspection.prediction.confidence * 100).toFixed(1)}%</strong></div>
                  </div>
                  {inspection.qdn.qdn_required && (
                    <div className="qdn-alert"><ShieldAlert size={17} /><div><strong>QDN lot hold triggered</strong><span>{inspection.qdn.containment_status.replaceAll('_', ' ')} · {inspection.qdn.reason}</span></div></div>
                  )}
                </div>
              )}
            </article>

            <article className="panel hold-panel">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">CONTAINMENT</div>
                  <h2>Lots on hold</h2>
                  <p className="panel-description">Lots requiring quality team attention.</p>
                </div>
                <span className="hold-count">{holdCount.toString().padStart(2, '0')}</span>
              </div>
              {summary.lots_on_hold.length > 0 ? (
                <ul className="hold-list">
                  {summary.lots_on_hold.map((lot) => (
                    <li key={lot}>
                      <span className="hold-list-icon"><ShieldAlert size={15} /></span>
                      <span className="hold-lot">{lot}</span>
                      <span className="hold-state"><span className="status-dot alert-dot" /> ON HOLD</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-holds"><CheckCircle2 size={21} /><strong>No active lot holds</strong><span>Production is clear.</span></div>
              )}
              {summary.top_defect_type && (
                <div className="top-defect">
                  <span className="top-defect-label">MOST COMMON DEFECT</span>
                  <strong>{summary.top_defect_type.replaceAll('_', ' ')}</strong>
                  <span className="top-defect-arrow"><ArrowUpRight size={15} /></span>
                </div>
              )}
            </article>
          </section>

          <section className="analytics-section" id="analytics">
            <div className="analytics-heading">
              <div><div className="section-kicker">PRODUCTION INSIGHTS</div><h2>Inspection analytics</h2></div>
              <span className="chart-caption"><span className={usingMockData ? 'demo-dot' : 'live-dot'} /> {usingMockData ? 'Demo data' : 'Live data'}</span>
            </div>
            <div className="charts-grid">
              <article className="panel chart-panel">
                <div className="chart-title">
                  <div><h3>Defect breakdown</h3><p>Distribution by defect category</p></div>
                  <span className="chart-total">{numberFormat.format(defects.reduce((total, item) => total + item.count, 0))} <small>defects</small></span>
                </div>
                {chartHasData ? (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={defects} dataKey="count" nameKey="defect_type" innerRadius="58%" outerRadius="82%" paddingAngle={4} stroke="none">
                          {defects.map((item, index) => <Cell key={item.defect_type} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#171c24', border: '1px solid #2a3340', borderRadius: 8, color: '#edf2f7' }}
                          itemStyle={{ color: '#edf2f7' }}
                          formatter={(value) => [value, 'Inspections']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-center"><strong>{numberFormat.format(defects.reduce((total, item) => total + item.count, 0))}</strong><span>DEFECTS</span></div>
                  </div>
                ) : <div className="chart-empty">No defect data available.</div>}
                <div className="chart-legend">
                  {defects.map((item, index) => (
                    <div className="legend-item" key={item.defect_type}>
                      <span className="legend-swatch" style={{ backgroundColor: DEFECT_COLORS[index % DEFECT_COLORS.length] }} />
                      <span>{item.defect_type.replaceAll('_', ' ')}</span><strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel chart-panel machine-chart-panel">
                <div className="chart-title">
                  <div><h3>Machine inspections</h3><p>Inspection volume by machine</p></div>
                  <span className="chart-total">{machines.length} <small>machines</small></span>
                </div>
                {machines.length > 0 ? (
                  <div className="machine-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={machines} margin={{ top: 10, right: 8, left: -18, bottom: 3 }}>
                        <CartesianGrid stroke="#27303b" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="machine_id" tick={{ fill: '#8995a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8995a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(107, 197, 176, 0.06)' }}
                          contentStyle={{ background: '#171c24', border: '1px solid #2a3340', borderRadius: 8, color: '#edf2f7' }}
                          itemStyle={{ color: '#82d2bc' }}
                          formatter={(value) => [value, 'Inspections']}
                        />
                        <Bar dataKey="inspection_count" fill="#70cbb4" radius={[4, 4, 0, 0]} maxBarSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="chart-empty">No machine data available.</div>}
                <div className="machine-summary">
                  <span><span className="legend-swatch machine-swatch" /> Inspection volume</span>
                  <span>{numberFormat.format(machines.reduce((total, item) => total + item.inspection_count, 0))} total</span>
                </div>
              </article>
            </div>
          </section>

          <footer className="page-footer">
            <span><Factory size={13} /> ForgeIQ · Factory quality systems</span>
            <span>AI-powered inspection &amp; containment</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

export default App
