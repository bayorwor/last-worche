// How the free budget falls over time. One axis, thin lines, and the scenario also differs by its dashes,
// so colour never carries the difference alone. The table below the chart holds the same figures.
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { ForecastPoint, ForecastResult } from '../budgetTypes.ts'
import { dayNumber, remainingOnDay, scaleLinear } from '../chartScale.ts'

const HEIGHT = 240
const MARGIN = { top: 20, right: 16, bottom: 28, left: 40 }
const GRID_STEPS = 4

type ForecastChartProps = {
  base: ForecastResult
  scenario: ForecastResult | null
}

function linePath(series: ForecastPoint[], x: (day: number) => number, y: (value: number) => number) {
  return series.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(dayNumber(point.date)).toFixed(1)} ${y(point.remainingPersonDays).toFixed(1)}`).join(' ')
}

export function ForecastChart({ base, scenario }: ForecastChartProps) {
  const { t, formatDate, formatPersonDays } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  // The chart is drawn at its real size, so its text stays readable on a phone.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(entry.contentRect.width, 240))
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const allSeries = scenario ? [base.series, scenario.series] : [base.series]
  const endDates = [...allSeries.flat().map((point) => point.date), base.projectEndDate, scenario?.projectEndDate ?? base.projectEndDate]
  const firstDay = dayNumber(base.series[0]?.date ?? base.projectEndDate)
  const lastDay = Math.max(...endDates.map(dayNumber))
  const maxValue = Math.max(...allSeries.flat().map((point) => point.remainingPersonDays), 1)

  const x = scaleLinear(firstDay, lastDay, MARGIN.left, width - MARGIN.right)
  const y = scaleLinear(0, maxValue, HEIGHT - MARGIN.bottom, MARGIN.top)
  const dayAt = scaleLinear(MARGIN.left, width - MARGIN.right, firstDay, lastDay)
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, step) => (maxValue / GRID_STEPS) * step)

  function showDayUnderPointer(event: PointerEvent<SVGSVGElement>) {
    const { left } = event.currentTarget.getBoundingClientRect()
    const day = Math.round(dayAt(event.clientX - left))
    setHoverDay(Math.min(Math.max(day, firstDay), lastDay))
  }

  const hoverBase = hoverDay === null ? null : remainingOnDay(base.series, hoverDay)
  const hoverScenario = hoverDay === null || !scenario ? null : remainingOnDay(scenario.series, hoverDay)
  const hoverDate = hoverDay === null ? '' : new Date(hoverDay * 86_400_000).toISOString().slice(0, 10)
  const tooltipIsLeft = hoverDay !== null && x(hoverDay) > width / 2

  return (
    <figure>
      {scenario && (
        <figcaption className="mb-2 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <svg width="24" height="4" aria-hidden="true"><line x1="0" y1="2" x2="24" y2="2" stroke="var(--color-ink)" strokeWidth="2" /></svg>
            {t('forecast.seriesBase')}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="24" height="4" aria-hidden="true"><line x1="0" y1="2" x2="24" y2="2" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="6 4" /></svg>
            {t('forecast.seriesScenario')}
          </span>
        </figcaption>
      )}
      <div ref={containerRef} className="relative">
        <svg
          role="img"
          aria-label={t('forecast.chartLabel')}
          width={width}
          height={HEIGHT}
          className="block max-w-full touch-pan-y"
          onPointerMove={showDayUnderPointer}
          onPointerDown={showDayUnderPointer}
          onPointerLeave={() => setHoverDay(null)}
        >
          {gridValues.map((value) => (
            <g key={value}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(value)} y2={y(value)} stroke="var(--color-line)" />
              <text x={MARGIN.left - 6} y={y(value) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)" className="tabular-nums">
                {Math.round(value)}
              </text>
            </g>
          ))}
          <line x1={x(dayNumber(base.projectEndDate))} x2={x(dayNumber(base.projectEndDate))} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="var(--color-muted)" strokeDasharray="2 3" />
          <text x={Math.min(x(dayNumber(base.projectEndDate)) - 4, width - MARGIN.right)} y={MARGIN.top - 6} textAnchor="end" fontSize="11" fill="var(--color-muted)">
            {t('forecast.projectEnd')}
          </text>
          <text x={MARGIN.left} y={HEIGHT - 8} fontSize="11" fill="var(--color-muted)">{formatDate(base.series[0]?.date ?? base.projectEndDate)}</text>
          <path d={linePath(base.series, x, y)} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
          {scenario && <path d={linePath(scenario.series, x, y)} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="6 4" strokeLinejoin="round" />}
          {base.exhaustionDate && <circle cx={x(dayNumber(base.exhaustionDate))} cy={y(0)} r="4.5" fill="var(--color-ink)" stroke="var(--color-panel)" strokeWidth="2" />}
          {scenario?.exhaustionDate && <circle cx={x(dayNumber(scenario.exhaustionDate))} cy={y(0)} r="4.5" fill="var(--color-brand)" stroke="var(--color-panel)" strokeWidth="2" />}
          {hoverDay !== null && <line x1={x(hoverDay)} x2={x(hoverDay)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="var(--color-ink)" strokeOpacity="0.4" />}
        </svg>
        {hoverDay !== null && hoverBase !== null && (
          <div
            className="pointer-events-none absolute top-5 border border-ink bg-panel px-2.5 py-1.5 text-xs whitespace-nowrap tabular-nums"
            style={tooltipIsLeft ? { right: width - x(hoverDay) + 8 } : { left: x(hoverDay) + 8 }}
          >
            <p className="font-semibold">{formatDate(hoverDate)}</p>
            <p>{t('forecast.seriesBase')}: {formatPersonDays(hoverBase)}</p>
            {hoverScenario !== null && <p>{t('forecast.seriesScenario')}: {formatPersonDays(hoverScenario)}</p>}
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-2.5 text-muted">{t('forecast.tableSummary')}</summary>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm tabular-nums [&_td]:border-b [&_td]:border-line [&_td]:px-1.5 [&_td]:py-2 [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs">
            <thead>
              <tr>
                <th scope="col">{t('bookings.columnDate')}</th>
                <th scope="col">{t('forecast.seriesBase')}</th>
                {scenario && <th scope="col">{t('forecast.seriesScenario')}</th>}
              </tr>
            </thead>
            <tbody>
              {base.series.map((point) => (
                <tr key={point.date}>
                  <td className="whitespace-nowrap">{formatDate(point.date)}</td>
                  <td>{formatPersonDays(point.remainingPersonDays)}</td>
                  {scenario && <td>{formatPersonDays(remainingOnDay(scenario.series, dayNumber(point.date)) ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
