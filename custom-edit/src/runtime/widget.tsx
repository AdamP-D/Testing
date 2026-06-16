/** @jsx jsx */
/**
 * Custom Edit Widget for ArcGIS Experience Builder Developer Edition
 *
 * Receives selected features from:
 *   (a) Map/other widgets via the Message Framework (DataRecordsSelectionChangeMessage)
 *   (b) Any data-aware widget (Table, List, …) via the "Edit" data action
 *
 * Renders an ArcGIS FeatureForm for attribute editing and saves via applyEdits.
 */
import {
  React,
  jsx,
  css,
  type AllWidgetProps,
  type DataRecord,
  DataSourceManager,
  type FeatureLayerDataSource,
  MutableStoreManager
} from 'jimu-core'
import { loadArcGISJSAPIModules } from 'jimu-arcgis'
import { Button, Alert, Loading } from 'jimu-ui'
import type { IMConfig } from '../config'

const { useState, useEffect, useRef, useMemo, useCallback } = React

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecordSnapshot {
  id: string
  data: Record<string, any>
}

type FeedbackMsg = { kind: 'success' | 'error'; text: string }

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyle = () => css`
  .ced-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--sys-color-surface-paper, #fff);
    font-family: var(--ref-typeface-noto-sans-regular, "Avenir Next", Arial, sans-serif);
    font-size: 14px;
    color: var(--ref-palette-neutral-1100, #1a1a1a);
  }

  /* ── Header ─────────────────────────────────────── */
  .ced-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    background: var(--sys-color-primary-main, #0079c1);
    color: #fff;
    flex-shrink: 0;
    gap: 8px;
  }
  .ced-header-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ced-header-badge {
    font-size: 11px;
    background: rgba(255,255,255,0.25);
    padding: 2px 8px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  /* ── Empty state ─────────────────────────────────── */
  .ced-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    gap: 10px;
  }
  .ced-empty-icon {
    font-size: 38px;
    opacity: 0.3;
  }
  .ced-empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ref-palette-neutral-900, #333);
  }
  .ced-empty-hint {
    font-size: 12px;
    line-height: 1.6;
    max-width: 280px;
    color: var(--ref-palette-neutral-700, #666);
  }

  /* ── Feature list (multi-select summary) ─────────── */
  .ced-feature-list {
    border-bottom: 1px solid var(--ref-palette-neutral-300, #e0e0e0);
    max-height: 110px;
    overflow-y: auto;
    flex-shrink: 0;
  }
  .ced-feature-list-item {
    display: flex;
    align-items: center;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 13px;
    border-left: 3px solid transparent;
    transition: background 0.12s;
  }
  .ced-feature-list-item:hover { background: var(--ref-palette-neutral-100, #f4f4f4); }
  .ced-feature-list-item.active {
    border-left-color: var(--sys-color-primary-main, #0079c1);
    background: var(--ref-palette-primary-100, #e8f3fb);
    font-weight: 600;
  }
  .ced-feature-list-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Nav bar ──────────────────────────────────────── */
  .ced-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: var(--ref-palette-neutral-100, #f5f5f5);
    border-bottom: 1px solid var(--ref-palette-neutral-300, #e0e0e0);
    flex-shrink: 0;
  }
  .ced-nav-label { font-size: 12px; color: var(--ref-palette-neutral-700, #555); }
  .ced-nav-btns { display: flex; gap: 4px; }

  /* ── Form area ────────────────────────────────────── */
  .ced-form {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px 8px;
  }
  .ced-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    font-size: 13px;
    color: var(--ref-palette-neutral-700, #666);
  }
  /* Container where ArcGIS FeatureForm mounts */
  .ced-esri-form { min-height: 40px; }

  /* Fallback attribute form */
  .ced-field-list { display: flex; flex-direction: column; gap: 14px; }
  .ced-field { display: flex; flex-direction: column; gap: 4px; }
  .ced-field-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ref-palette-neutral-800, #444);
  }
  .ced-field-input {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 10px;
    border: 1px solid var(--ref-palette-neutral-400, #bbb);
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    color: var(--ref-palette-neutral-1100, #1a1a1a);
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
  }
  .ced-field-input:focus {
    outline: none;
    border-color: var(--sys-color-primary-main, #0079c1);
    box-shadow: 0 0 0 2px rgba(0,121,193,0.15);
  }
  .ced-field-input:disabled { background: var(--ref-palette-neutral-100, #f5f5f5); color: #888; }
  .ced-no-fields { text-align: center; color: #888; font-size: 13px; padding: 24px 0; }

  /* ── Confirm delete ───────────────────────────────── */
  .ced-confirm-delete {
    margin: 0 14px 10px;
    padding: 10px 12px;
    background: var(--ref-palette-red-100, #fff0f0);
    border: 1px solid var(--ref-palette-red-300, #f5c0c0);
    border-radius: 4px;
    font-size: 13px;
  }
  .ced-confirm-delete p { margin: 0 0 8px; font-weight: 500; }
  .ced-confirm-btns { display: flex; gap: 8px; }

  /* ── Feedback alert ───────────────────────────────── */
  .ced-alert { padding: 0 14px 10px; flex-shrink: 0; }

  /* ── Actions bar ──────────────────────────────────── */
  .ced-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--ref-palette-neutral-300, #e0e0e0);
    flex-shrink: 0;
    background: var(--sys-color-surface-paper, #fff);
  }
  .ced-spacer { flex: 1; }
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecordLabel (record: DataRecord, index: number): string {
  try {
    const data = record.getData() ?? {}
    for (const key of ['name', 'Name', 'NAME', 'label', 'Label', 'title', 'Title', 'OBJECTID', 'FID']) {
      if (data[key] != null) return String(data[key])
    }
    return `Feature ${index + 1}`
  } catch { return `Feature ${index + 1}` }
}

function getFeature (record: DataRecord): any {
  return (record as any)?.feature ?? null
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { id: widgetId, config, stateProps, mutableStateProps, useDataSources } = props

  // ── Record sources ──────────────────────────────────────────────────────
  // Data action delivers live DataRecord[] via MutableStoreManager
  const liveRecords: DataRecord[] = useMemo(
    () => (mutableStateProps as any)?.selectedRecords ?? [],
    [mutableStateProps]
  )
  // Message action delivers serializable snapshots via Redux widgetState
  const snapshots: RecordSnapshot[] = useMemo(
    () => (stateProps as any)?.selectedRecordSnapshots ?? [],
    [stateProps]
  )

  // Prefer live records (data action path); fall back to snapshot count for display
  const hasLiveRecords = liveRecords.length > 0
  const totalCount = hasLiveRecords ? liveRecords.length : snapshots.length

  // ── State ───────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const [fields, setFields] = useState<Array<{
    name: string; alias: string; type: string
    nullable: boolean; domain?: any; length?: number
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [useEsriForm, setUseEsriForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const esriFormRef = useRef<HTMLDivElement>(null)
  const featureFormRef = useRef<any>(null)

  const currentRecord: DataRecord | null = hasLiveRecords
    ? liveRecords[currentIndex] ?? liveRecords[0]
    : null

  const hasRecords = totalCount > 0
  const canUpdate = config?.enableUpdate !== false
  const canDelete = config?.enableDelete !== false
  const showList = (config?.showFeatureList ?? false) && liveRecords.length > 1

  // ── Reset on new selection ───────────────────────────────────────────────
  useEffect(() => {
    setCurrentIndex(0)
    setFeedback(null)
    setConfirmDelete(false)
  }, [totalCount])

  // ── Load / mount FeatureForm when current record changes ─────────────────
  useEffect(() => {
    if (!currentRecord) {
      destroyEsriForm()
      setFields([])
      setEditedValues({})
      setUseEsriForm(false)
      return
    }

    const feature = getFeature(currentRecord)
    if (!feature) {
      // No graphic — render a simple key/value fallback from getData()
      setEditedValues({ ...currentRecord.getData() })
      setFields([])
      setUseEsriForm(false)
      return
    }

    // Populate the fallback form fields from the layer definition
    const layer = feature.layer
    if (layer?.fields) {
      const skip = new Set(['globalid', 'objectid', 'objectid_1', 'shape', 'shape__area', 'shape__length'])
      const hidden = new Set((config?.hiddenFields ?? []).map((f: string) => f.toLowerCase()))
      setFields(
        layer.fields
          .filter((f: any) => f.editable && !skip.has(f.name.toLowerCase()) && !hidden.has(f.name.toLowerCase()))
          .map((f: any) => ({
            name: f.name,
            alias: f.alias || f.name,
            type: f.type,
            nullable: f.nullable,
            domain: f.domain ?? null,
            length: f.length
          }))
      )
    }
    setEditedValues({ ...feature.attributes })

    // Attempt to mount ArcGIS FeatureForm
    mountEsriForm(feature)

    return () => { destroyEsriForm() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRecord?.getId()])

  // ── ArcGIS FeatureForm lifecycle ─────────────────────────────────────────

  const destroyEsriForm = () => {
    if (featureFormRef.current) {
      try { featureFormRef.current.destroy() } catch { /* ignore */ }
      featureFormRef.current = null
    }
    if (esriFormRef.current) esriFormRef.current.innerHTML = ''
  }

  const mountEsriForm = async (feature: any) => {
    if (!esriFormRef.current) return
    setIsLoading(true)
    setUseEsriForm(false)
    destroyEsriForm()

    let cancelled = false

    try {
      // loadArcGISJSAPIModules is the correct ExB API — requires "dependency": "jimu-arcgis" in manifest.json
      const [FeatureForm] = await loadArcGISJSAPIModules(['esri/widgets/FeatureForm'])
      if (cancelled || !esriFormRef.current) return

      // Resolve the layer; prefer the live reference on the graphic
      const dsId = useDataSources?.[0]?.dataSourceId
      const ds = dsId ? DataSourceManager.getInstance().getDataSource(dsId) as FeatureLayerDataSource : null
      const layer = feature.layer ?? ds?.layer ?? null

      const formEl = document.createElement('div')
      esriFormRef.current.appendChild(formEl)

      const form = new FeatureForm({
        container: formEl,
        feature,
        layer
      })

      featureFormRef.current = form
      setUseEsriForm(true)
    } catch (err) {
      if (!cancelled) {
        // JSAPI unavailable in this environment — the fallback form will render
        console.warn('[custom-edit] FeatureForm unavailable, using fallback form.', err)
        setUseEsriForm(false)
      }
    } finally {
      if (!cancelled) setIsLoading(false)
    }

    return () => { cancelled = true }
  }

  // ── Field change (fallback form) ─────────────────────────────────────────

  const handleFieldChange = useCallback((name: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [name]: value }))
    setFeedback(null)
  }, [])

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentRecord || isSaving) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const feature = getFeature(currentRecord)

      if (featureFormRef.current) {
        // Trigger FeatureForm validation + attribute write, then applyEdits
        featureFormRef.current.submit()
        const updatedFeature = featureFormRef.current.feature ?? feature
        const layer = updatedFeature?.layer
        if (!layer) throw new Error('Feature layer not available.')

        const result = await layer.applyEdits({ updateFeatures: [updatedFeature] })
        const applyErr = result?.updateFeatureResults?.[0]?.error
        if (applyErr) throw new Error(applyErr.description ?? applyErr.message ?? 'Apply edits failed.')

      } else if (feature?.layer) {
        // Fallback: write manually-edited values into graphic attributes
        Object.assign(feature.attributes, editedValues)
        const result = await feature.layer.applyEdits({ updateFeatures: [feature] })
        const applyErr = result?.updateFeatureResults?.[0]?.error
        if (applyErr) throw new Error(applyErr.description ?? applyErr.message ?? 'Apply edits failed.')

      } else {
        throw new Error('No editable feature layer available. Ensure the layer has editing enabled.')
      }

      setFeedback({ kind: 'success', text: 'Changes saved successfully.' })
    } catch (err: any) {
      setFeedback({ kind: 'error', text: `Save failed: ${err?.message ?? 'Unknown error'}` })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteClick = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    performDelete()
  }

  const performDelete = async () => {
    if (!currentRecord || isDeleting) return
    setIsDeleting(true)
    setFeedback(null)

    try {
      const feature = getFeature(currentRecord)
      if (!feature?.layer) throw new Error('No feature layer available for deletion.')

      const result = await feature.layer.applyEdits({ deleteFeatures: [feature] })
      const applyErr = result?.deleteFeatureResults?.[0]?.error
      if (applyErr) throw new Error(applyErr.description ?? applyErr.message ?? 'Delete failed.')

      setFeedback({ kind: 'success', text: 'Feature deleted successfully.' })
      setConfirmDelete(false)

      // Remove the deleted record from mutable store
      const remaining = liveRecords.filter((_, i) => i !== currentIndex)
      MutableStoreManager.getInstance().updateStateValue(widgetId, 'selectedRecords', remaining)
      setCurrentIndex(i => Math.min(i, Math.max(0, remaining.length - 1)))
    } catch (err: any) {
      setFeedback({ kind: 'error', text: `Delete failed: ${err?.message ?? 'Unknown error'}` })
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    const feature = getFeature(currentRecord)
    if (feature) {
      setEditedValues({ ...feature.attributes })
      if (featureFormRef.current) mountEsriForm(feature)
    }
    setFeedback(null)
    setConfirmDelete(false)
  }

  // ── Fallback field rendering ─────────────────────────────────────────────

  const renderInput = (field: typeof fields[0]) => {
    const value = editedValues[field.name] ?? ''
    const disabled = !canUpdate

    if (field.domain?.type === 'coded-value' || field.domain?.type === 'codedValue') {
      return (
        <select className="ced-field-input" value={value ?? ''} disabled={disabled}
          onChange={e => handleFieldChange(field.name, e.target.value)}>
          {field.nullable && <option value="">— Select —</option>}
          {(field.domain.codedValues ?? []).map((cv: any) => (
            <option key={cv.code} value={cv.code}>{cv.name}</option>
          ))}
        </select>
      )
    }

    switch (field.type) {
      case 'integer':
      case 'small-integer':
      case 'big-integer':
        return (
          <input type="number" step="1" className="ced-field-input" value={value ?? ''} disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value === '' ? null : parseInt(e.target.value, 10))} />
        )
      case 'double':
      case 'single':
        return (
          <input type="number" step="any" className="ced-field-input" value={value ?? ''} disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value === '' ? null : parseFloat(e.target.value))} />
        )
      case 'date':
        return (
          <input type="datetime-local" className="ced-field-input"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''} disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value ? new Date(e.target.value).getTime() : null)} />
        )
      default:
        return (
          <input type="text" className="ced-field-input" value={value ?? ''} maxLength={field.length} disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value || null)} />
        )
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div css={getStyle()} className="ced-root">

      {/* Header */}
      <div className="ced-header">
        <span className="ced-header-title">{config?.customTitle || 'Custom Edit'}</span>
        {hasRecords && <span className="ced-header-badge">{totalCount}</span>}
      </div>

      {/* Empty state */}
      {!hasRecords && (
        <div className="ced-empty">
          <div className="ced-empty-icon">✏️</div>
          <div className="ced-empty-title">No features selected</div>
          <div className="ced-empty-hint">
            Select features on a map to edit them here, or use the "Edit" action in a Table or List widget.
            Connect a Map widget via <em>Message Settings</em> → "Data record selection change" → "Edit selected records".
          </div>
        </div>
      )}

      {/* Content */}
      {hasRecords && (
        <>
          {/* Optional feature list */}
          {showList && (
            <div className="ced-feature-list">
              {liveRecords.map((rec, i) => (
                <div key={rec.getId()} className={`ced-feature-list-item${i === currentIndex ? ' active' : ''}`}
                  onClick={() => { setCurrentIndex(i); setFeedback(null); setConfirmDelete(false) }}>
                  <span className="ced-feature-list-label">{getRecordLabel(rec, i)}</span>
                  {i === currentIndex && <span aria-hidden>›</span>}
                </div>
              ))}
            </div>
          )}

          {/* Nav bar */}
          {liveRecords.length > 1 && !showList && (
            <div className="ced-nav">
              <span className="ced-nav-label">Feature {currentIndex + 1} of {liveRecords.length}</span>
              <div className="ced-nav-btns">
                <Button size="sm" disabled={currentIndex === 0}
                  onClick={() => { setCurrentIndex(i => i - 1); setFeedback(null); setConfirmDelete(false) }}>
                  ‹ Prev
                </Button>
                <Button size="sm" disabled={currentIndex === liveRecords.length - 1}
                  onClick={() => { setCurrentIndex(i => i + 1); setFeedback(null); setConfirmDelete(false) }}>
                  Next ›
                </Button>
              </div>
            </div>
          )}

          {/* Form area */}
          <div className="ced-form">
            {isLoading && (
              <div className="ced-loading">
                <Loading type="donut" />
                <span>Loading editor…</span>
              </div>
            )}

            {!isLoading && (
              <>
                {/* ArcGIS FeatureForm mount point */}
                <div ref={esriFormRef} className="ced-esri-form"
                  style={{ display: useEsriForm ? 'block' : 'none' }} />

                {/* Fallback form when JSAPI FeatureForm is not available */}
                {!useEsriForm && (
                  <div className="ced-field-list">
                    {fields.length === 0 && (
                      <div className="ced-no-fields">No editable fields found for this feature.</div>
                    )}
                    {fields.map(field => (
                      <div key={field.name} className="ced-field">
                        <label className="ced-field-label">{field.alias}</label>
                        {renderInput(field)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Feedback alert */}
          {feedback && (
            <div className="ced-alert">
              <Alert type={feedback.kind === 'success' ? 'success' : 'error'}
                text={feedback.text} closable onClose={() => setFeedback(null)} />
            </div>
          )}

          {/* Confirm delete */}
          {confirmDelete && !isDeleting && (
            <div className="ced-confirm-delete">
              <p>Are you sure you want to delete this feature? This cannot be undone.</p>
              <div className="ced-confirm-btns">
                <Button size="sm" type="danger" onClick={performDelete}>Yes, delete</Button>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Actions bar */}
          <div className="ced-actions">
            {canDelete && (
              <Button type="default" size="sm" disabled={isSaving || isDeleting}
                onClick={handleDeleteClick}>
                {isDeleting ? 'Deleting…' : confirmDelete ? 'Confirm?' : 'Delete'}
              </Button>
            )}
            <div className="ced-spacer" />
            <Button type="default" size="sm" disabled={isSaving || isDeleting} onClick={handleReset}>
              Reset
            </Button>
            {canUpdate && (
              <Button type="primary" size="sm" disabled={isSaving || isDeleting} onClick={handleSave}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Widget
