/** @jsx jsx */
import {
  React,
  AllWidgetProps,
  jsx,
  css,
  DataRecord,
  DataSourceManager,
  FeatureLayerDataSource,
  QueriableDataSource,
  getAppStore,
  appActions,
  MessageManager,
  MessageType,
  DataRecordsSelectionChangeMessage
} from 'jimu-core'
import { Button, Alert, Loading } from 'jimu-ui'
import type { IMConfig } from './config'

const { useState, useEffect, useRef, useCallback } = React

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditableField {
  name: string
  alias: string
  type: string
  editable: boolean
  nullable: boolean
  domain?: { type: string; codedValues?: Array<{ code: any; name: string }> }
  length?: number
}

type FeedbackMsg = { kind: 'success' | 'error'; text: string }

// ---------------------------------------------------------------------------
// Styles (Emotion CSS-in-JS — standard ExB pattern)
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
    color: var(--ref-palette-neutral-700, #555);
  }
  .ced-empty-icon {
    font-size: 40px;
    opacity: 0.35;
  }
  .ced-empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ref-palette-neutral-900, #333);
  }
  .ced-empty-hint {
    font-size: 12px;
    line-height: 1.5;
    max-width: 280px;
    color: var(--ref-palette-neutral-600, #777);
  }

  /* ── Feature list (multi-select summary) ─────────── */
  .ced-feature-list {
    border-bottom: 1px solid var(--ref-palette-neutral-300, #e0e0e0);
    max-height: 120px;
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
    transition: background 0.15s;
  }
  .ced-feature-list-item:hover {
    background: var(--ref-palette-neutral-100, #f5f5f5);
  }
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
  .ced-nav-label {
    font-size: 12px;
    color: var(--ref-palette-neutral-700, #555);
  }
  .ced-nav-btns {
    display: flex;
    gap: 4px;
  }
  .ced-nav-btn {
    padding: 2px 10px;
    min-width: 0;
    font-size: 16px;
    line-height: 1.2;
  }

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
    color: var(--ref-palette-neutral-600, #777);
    font-size: 13px;
  }
  /* Container where ArcGIS FeatureForm mounts */
  .ced-esri-form-container {
    min-height: 40px;
  }
  /* Fallback custom form */
  .ced-field-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ced-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ced-field-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
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
    background: #fff;
    color: var(--ref-palette-neutral-900, #222);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ced-field-input:focus {
    outline: none;
    border-color: var(--sys-color-primary-main, #0079c1);
    box-shadow: 0 0 0 2px rgba(0,121,193,0.15);
  }
  .ced-field-input:disabled {
    background: var(--ref-palette-neutral-100, #f5f5f5);
    color: var(--ref-palette-neutral-600, #888);
  }
  .ced-no-fields {
    text-align: center;
    color: var(--ref-palette-neutral-600, #888);
    font-size: 13px;
    padding: 24px 0;
  }

  /* ── Confirm delete banner ────────────────────────── */
  .ced-confirm-delete {
    margin: 0 14px 10px;
    padding: 10px 12px;
    background: var(--ref-palette-red-100, #fff0f0);
    border: 1px solid var(--ref-palette-red-300, #f5c0c0);
    border-radius: 4px;
    font-size: 13px;
  }
  .ced-confirm-delete p {
    margin: 0 0 8px;
    font-weight: 500;
  }
  .ced-confirm-btns {
    display: flex;
    gap: 8px;
  }

  /* ── Feedback alert wrapper ───────────────────────── */
  .ced-alert {
    padding: 0 14px 10px;
    flex-shrink: 0;
  }

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
  .ced-actions-spacer { flex: 1; }
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a human-readable label for a record (uses display field or OID). */
function getRecordLabel (record: DataRecord, index: number): string {
  try {
    const data = record.getData()
    // Try common display field names
    for (const key of ['name', 'Name', 'NAME', 'label', 'Label', 'title', 'Title', 'OBJECTID', 'objectid', 'OID', 'oid', 'FID']) {
      if (data?.[key] != null) return String(data[key])
    }
    return `Feature ${index + 1}`
  } catch {
    return `Feature ${index + 1}`
  }
}

/** Extracts ESRI Graphic from a DataRecord (FeatureLayer records carry .feature). */
function getFeature (record: DataRecord): any {
  return (record as any)?.feature ?? null
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { id: widgetId, config, widgetState, useDataSources, intl } = props

  // Records injected by message action or data action
  const selectedRecords: DataRecord[] = (widgetState as any)?.selectedRecords ?? []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const [fields, setFields] = useState<EditableField[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [useEsriForm, setUseEsriForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const esriFormContainerRef = useRef<HTMLDivElement>(null)
  const featureFormRef = useRef<any>(null)

  const hasRecords = selectedRecords.length > 0
  const currentRecord = hasRecords ? selectedRecords[currentIndex] ?? selectedRecords[0] : null
  const showList = (config?.showFeatureList ?? false) && selectedRecords.length > 1
  const canUpdate = config?.enableUpdate !== false
  const canDelete = config?.enableDelete !== false

  // Reset index when selection count changes
  useEffect(() => {
    setCurrentIndex(prev => (prev >= selectedRecords.length ? 0 : prev))
    setFeedback(null)
    setConfirmDelete(false)
  }, [selectedRecords.length])

  // Load field metadata + init form when the current record changes
  useEffect(() => {
    if (!currentRecord) {
      setFields([])
      setEditedValues({})
      setUseEsriForm(false)
      return
    }

    const feature = getFeature(currentRecord)

    if (feature) {
      // Extract editable fields from the layer definition
      const layer = feature.layer
      if (layer?.fields) {
        const skipNames = new Set(['globalid', 'objectid', 'objectid_1', 'shape', 'shape__area', 'shape__length'])
        const hiddenSet = new Set((config?.hiddenFields ?? []).map((f: string) => f.toLowerCase()))
        const editableFields: EditableField[] = layer.fields
          .filter((f: any) =>
            f.editable &&
            !skipNames.has(f.name.toLowerCase()) &&
            !hiddenSet.has(f.name.toLowerCase())
          )
          .map((f: any) => ({
            name: f.name,
            alias: f.alias || f.name,
            type: f.type,
            editable: f.editable,
            nullable: f.nullable,
            domain: f.domain ?? null,
            length: f.length
          }))
        setFields(editableFields)
      }
      // Seed edited values from current attributes
      setEditedValues({ ...feature.attributes })
      // Mount ArcGIS FeatureForm
      mountEsriForm(feature)
    } else {
      // No ESRI graphic — use plain record data
      const data = currentRecord.getData() ?? {}
      setEditedValues({ ...data })
      setFields([])
      setUseEsriForm(false)
    }

    return () => {
      destroyEsriForm()
    }
  }, [currentRecord?.getId()])

  // ---------------------------------------------------------------------------
  // ArcGIS FeatureForm lifecycle
  // ---------------------------------------------------------------------------

  const destroyEsriForm = () => {
    if (featureFormRef.current) {
      try { featureFormRef.current.destroy() } catch { /* ignore */ }
      featureFormRef.current = null
    }
  }

  const mountEsriForm = async (feature: any) => {
    if (!esriFormContainerRef.current) return
    setIsLoading(true)
    setUseEsriForm(false)
    destroyEsriForm()

    try {
      const { default: FeatureForm } = await import('esri/widgets/FeatureForm')

      // Clear any lingering DOM
      esriFormContainerRef.current.innerHTML = ''
      const formEl = document.createElement('div')
      esriFormContainerRef.current.appendChild(formEl)

      const form = new FeatureForm({
        container: formEl,
        feature,
        layer: feature.layer
      })

      featureFormRef.current = form
      setUseEsriForm(true)
    } catch (err) {
      // ArcGIS JS API not available in this context — fall back to custom form
      console.warn('[custom-edit] FeatureForm unavailable, using fallback form.', err)
      setUseEsriForm(false)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Field change (fallback form only)
  // ---------------------------------------------------------------------------

  const handleFieldChange = useCallback((name: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [name]: value }))
    setFeedback(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!currentRecord || isSaving) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const feature = getFeature(currentRecord)

      if (featureFormRef.current) {
        // Let FeatureForm write values to the feature
        featureFormRef.current.submit()
        const updatedFeature = featureFormRef.current.feature ?? feature

        const result = await updatedFeature.layer.applyEdits({ updateFeatures: [updatedFeature] })
        const err = result?.updateFeatureResults?.[0]?.error
        if (err) throw new Error(err.description ?? err.message ?? 'Unknown error')

      } else if (feature) {
        // Fallback: manually apply values
        Object.assign(feature.attributes, editedValues)
        const result = await feature.layer.applyEdits({ updateFeatures: [feature] })
        const err = result?.updateFeatureResults?.[0]?.error
        if (err) throw new Error(err.description ?? err.message ?? 'Unknown error')

      } else {
        // Pure DataSource path (no ESRI graphic)
        const dsId = useDataSources?.[0]?.dataSourceId
        if (dsId) {
          const ds = DataSourceManager.getInstance().getDataSource(dsId) as FeatureLayerDataSource
          if (typeof (ds as any).updateRecord === 'function') {
            await (ds as any).updateRecord({ record: currentRecord, attributes: editedValues })
          } else {
            throw new Error('Data source does not support record updates.')
          }
        } else {
          throw new Error('No feature layer available for saving.')
        }
      }

      setFeedback({ kind: 'success', text: 'Changes saved successfully.' })

      // Publish a message so other widgets can react to the save
      MessageManager.getInstance().publishMessage(
        new DataRecordsSelectionChangeMessage(widgetId, [currentRecord])
      )
    } catch (err: any) {
      setFeedback({ kind: 'error', text: `Save failed: ${err?.message ?? 'Unknown error'}` })
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
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
      const err = result?.deleteFeatureResults?.[0]?.error
      if (err) throw new Error(err.description ?? err.message ?? 'Unknown error')

      setFeedback({ kind: 'success', text: 'Feature deleted successfully.' })
      setConfirmDelete(false)

      // Remove the deleted record from widget state
      const remaining = selectedRecords.filter((_, i) => i !== currentIndex)
      getAppStore().dispatch(appActions.widgetStatePropChange(widgetId, 'selectedRecords', remaining))
      setCurrentIndex(i => Math.min(i, Math.max(0, remaining.length - 1)))
    } catch (err: any) {
      setFeedback({ kind: 'error', text: `Delete failed: ${err?.message ?? 'Unknown error'}` })
    } finally {
      setIsDeleting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const handleReset = () => {
    const feature = getFeature(currentRecord)
    if (feature) {
      setEditedValues({ ...feature.attributes })
      if (featureFormRef.current) {
        // Re-mount the form to discard pending changes
        mountEsriForm(feature)
      }
    }
    setFeedback(null)
    setConfirmDelete(false)
  }

  // ---------------------------------------------------------------------------
  // Fallback field rendering
  // ---------------------------------------------------------------------------

  const renderInput = (field: EditableField) => {
    const value = editedValues[field.name] ?? ''
    const disabled = !canUpdate

    if (field.domain?.type === 'coded-value' || field.domain?.type === 'codedValue') {
      return (
        <select
          className="ced-field-input"
          value={value ?? ''}
          disabled={disabled}
          onChange={e => handleFieldChange(field.name, e.target.value)}
        >
          {field.nullable && <option value="">— Select —</option>}
          {(field.domain.codedValues ?? []).map(cv => (
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
          <input
            type="number"
            step="1"
            className="ced-field-input"
            value={value ?? ''}
            disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value === '' ? null : parseInt(e.target.value, 10))}
          />
        )
      case 'double':
      case 'single':
        return (
          <input
            type="number"
            step="any"
            className="ced-field-input"
            value={value ?? ''}
            disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value === '' ? null : parseFloat(e.target.value))}
          />
        )
      case 'date':
        return (
          <input
            type="datetime-local"
            className="ced-field-input"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value ? new Date(e.target.value).getTime() : null)}
          />
        )
      default:
        return (
          <input
            type="text"
            className="ced-field-input"
            value={value ?? ''}
            maxLength={field.length}
            disabled={disabled}
            onChange={e => handleFieldChange(field.name, e.target.value || null)}
          />
        )
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div css={getStyle()} className="ced-root">
      {/* ── Header ───────────────────────────────────── */}
      <div className="ced-header">
        <span className="ced-header-title">
          {config?.customTitle || 'Custom Edit'}
        </span>
        {hasRecords && (
          <span className="ced-header-badge">{selectedRecords.length}</span>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────── */}
      {!hasRecords && (
        <div className="ced-empty">
          <div className="ced-empty-icon">✏️</div>
          <div className="ced-empty-title">No features selected</div>
          <div className="ced-empty-hint">
            Select features on a map to edit them here.
            Connect a Map widget via <em>Message Settings</em> → "Data record selection change" → "Edit selected records".
          </div>
        </div>
      )}

      {/* ── Content when records are present ──────────── */}
      {hasRecords && (
        <>
          {/* Optional: feature list summary */}
          {showList && (
            <div className="ced-feature-list">
              {selectedRecords.map((rec, i) => (
                <div
                  key={rec.getId()}
                  className={`ced-feature-list-item${i === currentIndex ? ' active' : ''}`}
                  onClick={() => {
                    setCurrentIndex(i)
                    setFeedback(null)
                    setConfirmDelete(false)
                  }}
                >
                  <span className="ced-feature-list-label">
                    {getRecordLabel(rec, i)}
                  </span>
                  {i === currentIndex && <span>›</span>}
                </div>
              ))}
            </div>
          )}

          {/* Navigation bar (always shown when multiple records) */}
          {selectedRecords.length > 1 && !showList && (
            <div className="ced-nav">
              <span className="ced-nav-label">
                Feature {currentIndex + 1} of {selectedRecords.length}
              </span>
              <div className="ced-nav-btns">
                <Button
                  className="ced-nav-btn"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex(i => i - 1)
                    setFeedback(null)
                    setConfirmDelete(false)
                  }}
                  title="Previous"
                >
                  ‹
                </Button>
                <Button
                  className="ced-nav-btn"
                  size="sm"
                  disabled={currentIndex === selectedRecords.length - 1}
                  onClick={() => {
                    setCurrentIndex(i => i + 1)
                    setFeedback(null)
                    setConfirmDelete(false)
                  }}
                  title="Next"
                >
                  ›
                </Button>
              </div>
            </div>
          )}

          {/* ── Form area ──────────────────────────────── */}
          <div className="ced-form">
            {isLoading && (
              <div className="ced-loading">
                <Loading type="donut" />
                <span>Loading editor…</span>
              </div>
            )}

            {!isLoading && (
              <>
                {/* ArcGIS FeatureForm mounts here */}
                <div
                  ref={esriFormContainerRef}
                  className="ced-esri-form-container"
                  style={{ display: useEsriForm ? 'block' : 'none' }}
                />

                {/* Fallback form — shown when FeatureForm is not available */}
                {!useEsriForm && (
                  <div className="ced-field-list">
                    {fields.length === 0 && (
                      <div className="ced-no-fields">
                        No editable fields found for this feature.
                      </div>
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

          {/* ── Feedback alert ──────────────────────────── */}
          {feedback && (
            <div className="ced-alert">
              <Alert
                type={feedback.kind === 'success' ? 'success' : 'error'}
                text={feedback.text}
                closable
                onClose={() => setFeedback(null)}
              />
            </div>
          )}

          {/* ── Confirm delete banner ─────────────────── */}
          {confirmDelete && !isDeleting && (
            <div className="ced-confirm-delete">
              <p>Are you sure you want to delete this feature? This cannot be undone.</p>
              <div className="ced-confirm-btns">
                <Button size="sm" type="danger" onClick={performDelete}>
                  Yes, delete
                </Button>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Actions bar ─────────────────────────────── */}
          <div className="ced-actions">
            {canDelete && (
              <Button
                type="default"
                size="sm"
                disabled={isSaving || isDeleting}
                onClick={handleDeleteClick}
              >
                {isDeleting ? 'Deleting…' : confirmDelete ? 'Confirm?' : 'Delete'}
              </Button>
            )}

            <div className="ced-actions-spacer" />

            <Button
              type="default"
              size="sm"
              disabled={isSaving || isDeleting}
              onClick={handleReset}
            >
              Reset
            </Button>

            {canUpdate && (
              <Button
                type="primary"
                size="sm"
                disabled={isSaving || isDeleting}
                onClick={handleSave}
              >
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
