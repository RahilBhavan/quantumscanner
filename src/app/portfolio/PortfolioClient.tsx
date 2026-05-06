'use client'

import { useReducer, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CsvDropzone } from '@/components/portfolio/CsvDropzone'
import { CsvPreviewTable } from '@/components/portfolio/CsvPreviewTable'
import { ScanProgressBar } from '@/components/portfolio/ScanProgressBar'
import { SummaryBar } from '@/components/portfolio/SummaryBar'
import { ExposureChart } from '@/components/portfolio/ExposureChart'
import { CrqcScenarioPanel } from '@/components/portfolio/CrqcScenarioPanel'
import { AddressTable } from '@/components/portfolio/AddressTable'
import { RecommendedActionsSummary } from '@/components/portfolio/RecommendedActionsSummary'
import { LimitationsFooter } from '@/components/shared/LimitationsFooter'
import { parseCsv } from '@/lib/csv/parse'
import { validateCsvRows } from '@/lib/csv/validate'
import { streamPortfolioScan } from '@/lib/client/portfolio-stream'
import { computeRiskScore } from '@/lib/risk/score'
import type { ValidatedRow } from '@/lib/csv/validate'
import type { AddressResult } from '@/lib/api/resolve-address'

const SATS_PER_BTC = 100_000_000

type Phase = 'upload' | 'preview' | 'scanning' | 'results'

interface PortfolioState {
  phase: Phase
  fileName: string | null
  validatedRows: ValidatedRow[]
  parseErrors: string[]
  scanResults: AddressResult[]
  progress: { completed: number; total: number }
  error: string | null
}

type Action =
  | { type: 'FILE_PARSED'; rows: ValidatedRow[]; errors: string[]; fileName: string }
  | { type: 'SCAN_START' }
  | { type: 'SCAN_RESULT'; result: AddressResult }
  | { type: 'SCAN_PROGRESS'; completed: number; total: number }
  | { type: 'SCAN_DONE' }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'RESET' }

const INITIAL: PortfolioState = {
  phase: 'upload',
  fileName: null,
  validatedRows: [],
  parseErrors: [],
  scanResults: [],
  progress: { completed: 0, total: 0 },
  error: null,
}

function reducer(state: PortfolioState, action: Action): PortfolioState {
  switch (action.type) {
    case 'FILE_PARSED':
      return { ...state, phase: 'preview', validatedRows: action.rows, parseErrors: action.errors, fileName: action.fileName, scanResults: [], error: null }
    case 'SCAN_START':
      return { ...state, phase: 'scanning', scanResults: [], progress: { completed: 0, total: state.validatedRows.filter(r => r.isValid && !r.isDuplicate).length }, error: null }
    case 'SCAN_RESULT':
      return { ...state, scanResults: [...state.scanResults, action.result] }
    case 'SCAN_PROGRESS':
      return { ...state, progress: { completed: action.completed, total: action.total } }
    case 'SCAN_DONE':
      return { ...state, phase: 'results' }
    case 'SCAN_ERROR':
      return { ...state, phase: 'results', error: action.message }
    case 'RESET':
      return { ...INITIAL }
    default:
      return state
  }
}

function computeSummary(results: AddressResult[]) {
  const counts = { exposed: 0, safe: 0, empty: 0, unresolvable: 0 }
  const actionCounts = { MIGRATE_IMMEDIATELY: 0, MONITOR: 0, NO_ACTION_NEEDED: 0, MANUAL_REVIEW: 0 }
  let exposedBtc = 0
  let totalBtc = 0

  for (const r of results) {
    if (r.classification === 'EXPOSED') { counts.exposed++; exposedBtc += r.balanceBtc }
    else if (r.classification === 'SAFE_AT_REST') counts.safe++
    else if (r.classification === 'EMPTY') counts.empty++
    else if (r.classification === 'UNRESOLVABLE') counts.unresolvable++

    totalBtc += r.balanceBtc
    const a = r.recommendedAction as keyof typeof actionCounts
    if (a in actionCounts) actionCounts[a]++
  }

  const riskScore = computeRiskScore({
    exposedBtc,
    totalBtc,
    currentYear: new Date().getFullYear(),
  })

  return { ...counts, exposedBtc, totalBtc, actionCounts, riskScore }
}

export function PortfolioClient() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  async function handleFile(file: File) {
    const parseResult = await parseCsv(file)
    const validated = validateCsvRows(parseResult.rows)
    dispatch({ type: 'FILE_PARSED', rows: validated, errors: parseResult.errors, fileName: file.name })
  }

  const handleScan = useCallback(() => {
    dispatch({ type: 'SCAN_START' })

    const addresses = state.validatedRows
      .filter(r => r.isValid && !r.isDuplicate)
      .map(r => r.address)

    const cancel = streamPortfolioScan({
      addresses,
      onEvent: event => {
        if (event.type === 'result') dispatch({ type: 'SCAN_RESULT', result: event.data })
        else if (event.type === 'progress') dispatch({ type: 'SCAN_PROGRESS', completed: event.completed, total: event.total })
        else if (event.type === 'error') dispatch({ type: 'SCAN_ERROR', message: event.message })
      },
      onDone: () => dispatch({ type: 'SCAN_DONE' }),
      onError: err => dispatch({ type: 'SCAN_ERROR', message: err.message }),
    })

    return cancel
  }, [state.validatedRows])

  const { phase, validatedRows, parseErrors, scanResults, progress, error, fileName } = state
  const summary = phase === 'results' || phase === 'scanning' ? computeSummary(scanResults) : null
  const validCount = validatedRows.filter(r => r.isValid && !r.isDuplicate).length

  return (
    <div className="space-y-8">
      {phase === 'upload' && (
        <CsvDropzone onFile={handleFile} />
      )}

      {(phase === 'preview' || phase === 'scanning' || phase === 'results') && (
        <section aria-label="CSV preview" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{fileName}</h2>
              <p className="text-sm text-muted-foreground">
                {validCount} valid addresses · {validatedRows.filter(r => r.isDuplicate).length} duplicates · {validatedRows.filter(r => !r.isValid).length} invalid
              </p>
              {parseErrors.map((e, i) => (
                <p key={i} className="text-sm text-destructive mt-1">{e}</p>
              ))}
            </div>
            <div className="flex gap-2">
              {phase === 'preview' && (
                <>
                  <Button variant="outline" onClick={() => dispatch({ type: 'RESET' })}>
                    Change file
                  </Button>
                  <Button onClick={handleScan} disabled={validCount === 0}>
                    Scan {validCount} addresses
                  </Button>
                </>
              )}
              {phase === 'results' && (
                <Button variant="outline" onClick={() => dispatch({ type: 'RESET' })}>
                  Start over
                </Button>
              )}
            </div>
          </div>
          <CsvPreviewTable rows={validatedRows} totalCount={validatedRows.length} />
        </section>
      )}

      {phase === 'scanning' && (
        <section aria-label="Scan progress">
          <ScanProgressBar completed={progress.completed} total={progress.total} />
        </section>
      )}

      {(phase === 'scanning' || phase === 'results') && summary && (
        <section aria-label="Portfolio results" className="space-y-6">
          {error && (
            <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">
              Scan encountered an error: {error}
            </div>
          )}
          <SummaryBar
            total={scanResults.length}
            exposed={summary.exposed}
            safe={summary.safe}
            empty={summary.empty}
            unresolvable={summary.unresolvable}
            exposedBtc={summary.exposedBtc}
            totalBtc={summary.totalBtc}
          />
          <ExposureChart
            safe={summary.safe}
            exposed={summary.exposed}
            empty={summary.empty}
            unresolvable={summary.unresolvable}
          />
          <CrqcScenarioPanel scores={summary.riskScore} />
          <RecommendedActionsSummary counts={summary.actionCounts} />
          {scanResults.length > 0 && <AddressTable results={scanResults} />}
        </section>
      )}

      <LimitationsFooter />
    </div>
  )
}
