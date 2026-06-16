/** @jsx jsx */
import {
  React,
  jsx,
  css,
  type AllWidgetProps,
  type IMState,
  type DataRecord,
  DataSourceManager,
  type FeatureLayerDataSource,
  MutableStoreManager
} from 'jimu-core'
import { loadArcGISJSAPIModules } from 'jimu-arcgis'
import { Button, Alert, Loading } from 'jimu-ui'
import type { IMConfig } from '../config'

const { useState, useEffect, useRef } = React

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackMsg = { kind: 'success' | 'error'; text: string }

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyle = () => css`
  .ced-root {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
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
  .ced-dirty-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ref-palette-orange-500, #f6a800);
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
  }
  .ced-header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: rgba(255,255,255,0.15);
    color: #fff;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .ced-header-btn:hover { background: rgba(255,255,255,0.35); }

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
  .ced-empty-icon { font-size: 38px; opacity: 0.3; }
  .ced-empty-title { font-size: 14px; font-weight: 600; color: var(--ref-palette-neutral-900, #333); }
  .ced-empty-hint {
    font-size: 12px;
    line-height: 1.6;
    max-width: 280px;
    color: var(--ref-palette-neutral-700, #666);
  }

  /* ── Nav bar ──────────────────────────────────────── */
  .ced-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--ref-palette-neutral-100, #f5f5f5);
    border-bottom: 1px solid var(--ref-palette-neutral-300, #e0e0e0);
    flex-shrink: 0;
  }
  .ced-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--ref-palette-neutral-400, #c0c0c0);
    border-radius: 4px;
    background: #fff;
    color: var(--ref-palette-neutral-900, #333);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .ced-nav-btn:hover:not(:disabled) {
    background: var(--ref-palette-primary-100, #e8f3fb);
    border-color: var(--sys-color-primary-main, #0079c1);
  }
  .ced-nav-btn:disabled { opacity: 0.4; cursor: default; }
  .ced-nav-select {
    flex: 1;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--ref-palette-neutral-400, #c0c0c0);
    border-radius: 4px;
    background: #fff;
    color: var(--ref-palette-neutral-900, #333);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    text-overflow: ellipsis;
  }
  .ced-nav-count {
    flex: 1;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--ref-palette-neutral-800, #444);
  }

  /* ── Form area ────────────────────────────────────── */
  .ced-form {
    flex: 1;
    min-height: 0;   /* required: lets the flex child shrink so overflow-y works */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 14px 8px;
  }
  .ced-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    padding: 32px 0;
    font-size: 13px;
    color: var(--ref-palette-neutral-700, #666);
  }
  /* FeatureForm mount point: must not have its own scroll or fixed height so
     the parent .ced-form is the single scroll container. */
  .ced-esri-form { width: 100%; }
  /* Override ArcGIS FeatureForm widget internal styles that create a second
     scroll container inside .ced-form, clipping or hijacking the scroll. */
  .ced-esri-form .esri-widget,
  .ced-esri-form .esri-feature-form {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  .ced-esri-form .esri-feature-form__body,
  .ced-esri-form .esri-feature-form__fields-content {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  .ced-form-error {
    text-align: center;
    color: var(--ref-palette-red-600, #c00);
    font-size: 13px;
    padding: 24px 0;
  }

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

  /* ── Unsaved-changes confirm ──────────────────────── */
  .ced-confirm-unsaved {
    margin: 0 14px 10px;
    padding: 10px 12px;
    background: var(--ref-palette-orange-100, #fff7e6);
    border: 1px solid var(--ref-palette-orange-300, #ffd591);
    border-radius: 4px;
    font-size: 13px;
  }
  .ced-confirm-unsaved p { margin: 0 0 8px; font-weight: 500; }

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
  const { id: widgetId, config, mutableStateProps, useDataSources } = props

  // selectionVersion from Redux — incremented by both message action and data
  // action every time a new selection arrives. Guarantees a re-render even
  // when ExB reuses the same mutableStateProps object reference.
  const selectionVersion: number = (props as any).stateProps?.selectionVersion ?? 0

  // Live DataRecord instances come via MutableStoreManager (not Redux-safe).
  // Read on every render; fresh values are present whenever selectionVersion
  // triggers a re-render because MutableStoreManager is updated first.
  const liveRecords: DataRecord[] = (mutableStateProps as any)?.selectedRecords ?? []
  const totalCount = liveRecords.length

  // ── State ───────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    { type: 'nav'; index: number } | { type: 'exit' } | null
  >(null)

  const esriFormRef = useRef<HTMLDivElement>(null)
  const featureFormRef = useRef<any>(null)
  // Each mountEsriForm call gets its own token; async callbacks close over it
  // so cancellation is race-free even when two mounts overlap.
  const mountTokenRef = useRef<{ cancelled: boolean } | null>(null)

  const currentRecord: DataRecord | null = liveRecords[currentIndex] ?? liveRecords[0] ?? null
  const hasRecords = totalCount > 0
  const canUpdate = config?.enableUpdate !== false
  const canDelete = config?.enableDelete !== false
  const showList = (config?.showFeatureList ?? false) && liveRecords.length > 1

  // ── ArcGIS FeatureForm helpers ───────────────────────────────────────────

  const destroyEsriForm = () => {
    if (featureFormRef.current) {
      try { featureFormRef.current.destroy() } catch { /* ignore */ }
      featureFormRef.current = null
    }
    if (esriFormRef.current) esriFormRef.current.innerHTML = ''
  }

  const mountEsriForm = (feature: any) => {
    // Cancel any in-flight mount
    if (mountTokenRef.current) mountTokenRef.current.cancelled = true
    const token = { cancelled: false }
    mountTokenRef.current = token

    if (!esriFormRef.current) return

    setIsLoading(true)
    setFormError(null)
    destroyEsriForm()

    const doMount = async () => {
      try {
        const [FeatureForm] = await loadArcGISJSAPIModules(['esri/widgets/FeatureForm'])
        if (token.cancelled || !esriFormRef.current) return

        const dsId = useDataSources?.[0]?.dataSourceId
        const ds = dsId
          ? DataSourceManager.getInstance().getDataSource(dsId) as FeatureLayerDataSource
          : null
        const layer = feature.layer ?? ds?.layer ?? null

        const formEl = document.createElement('div')
        esriFormRef.current.appendChild(formEl)

        const form = new FeatureForm({ container: formEl, feature, layer })
        form.on('value-change', () => { setIsDirty(true) })
        featureFormRef.current = form
      } catch (err) {
        if (!token.cancelled) {
          setFormError('Could not load the attribute editor. Ensure the feature has a valid editable layer.')
          console.error('[custom-edit] FeatureForm load failed', err)
        }
      } finally {
        if (!token.cancelled) setIsLoading(false)
      }
    }

    doMount()
  }

  // ── Reset on new selection ───────────────────────────────────────────────
  useEffect(() => {
    setCurrentIndex(0)
    setFeedback(null)
    setConfirmDelete(false)
    setPendingAction(null)
    setIsDirty(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionVersion])

  // ── Load / mount FeatureForm when selection or nav index changes ─────────
  useEffect(() => {
    setIsDirty(false)

    if (!currentRecord) {
      destroyEsriForm()
      setFormError(null)
      return
    }

    const feature = getFeature(currentRecord)
    if (!feature) {
      destroyEsriForm()
      setFormError('This record does not have a live feature reference. Ensure it comes from a FeatureLayer data source.')
      return
    }

    mountEsriForm(feature)

    return () => {
      if (mountTokenRef.current) mountTokenRef.current.cancelled = true
      destroyEsriForm()
    }
  // selectionVersion and currentIndex are the semantically meaningful deps;
  // mountEsriForm / destroyEsriForm are stable per-render closures.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionVersion, currentIndex])

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentRecord || isSaving) return
    setIsSaving(true)
    setFeedback(null)

    try {
      if (!featureFormRef.current) throw new Error('Form not ready. Please wait for the editor to load.')
      featureFormRef.current.submit()
      const updatedFeature = featureFormRef.current.feature ?? getFeature(currentRecord)
      const layer = updatedFeature?.layer
      if (!layer) throw new Error('Feature layer not available.')

      const result = await layer.applyEdits({ updateFeatures: [updatedFeature] })
      const applyErr = result?.updateFeatureResults?.[0]?.error
      if (applyErr) throw new Error(applyErr.description ?? applyErr.message ?? 'Apply edits failed.')

      setFeedback({ kind: 'success', text: 'Changes saved successfully.' })
      setIsDirty(false)
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

      const remaining = liveRecords.filter((_, i) => i !== currentIndex)
      MutableStoreManager.getInstance().updateStateValue(widgetId, 'selectedRecords', remaining)
      setCurrentIndex(i => Math.min(i, Math.max(0, remaining.length - 1)))
    } catch (err: any) {
      setFeedback({ kind: 'error', text: `Delete failed: ${err?.message ?? 'Unknown error'}` })
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Discard edits (re-mount FeatureForm to reset field values) ───────────

  const handleDiscard = () => {
    const feature = getFeature(currentRecord)
    if (feature) mountEsriForm(feature)
    setFeedback(null)
    setConfirmDelete(false)
    setIsDirty(false)
  }

  // ── Navigation (guarded against unsaved edits) ───────────────────────────

  const goToIndex = (index: number) => {
    if (index < 0 || index >= liveRecords.length || index === currentIndex) return
    if (isDirty) { setPendingAction({ type: 'nav', index }); return }
    setCurrentIndex(index)
    setFeedback(null)
    setConfirmDelete(false)
  }

  // ── Exit (clear widget, guarded against unsaved edits) ───────────────────

  const clearWidget = () => {
    MutableStoreManager.getInstance().updateStateValue(widgetId, 'selectedRecords', [])
    setCurrentIndex(0)
    setFeedback(null)
    setConfirmDelete(false)
    setIsDirty(false)
    setPendingAction(null)
  }

  const handleExit = () => {
    if (isDirty) { setPendingAction({ type: 'exit' }); return }
    clearWidget()
  }

  // ── Resolve pending action after user confirms discarding edits ───────────

  const confirmPendingAction = () => {
    const action = pendingAction
    setPendingAction(null)
    setIsDirty(false)
    if (!action) return
    if (action.type === 'exit') {
      clearWidget()
    } else {
      setCurrentIndex(action.index)
      setFeedback(null)
      setConfirmDelete(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div css={getStyle()} className="ced-root">

      {/* Header */}
      <div className="ced-header">
        <span className="ced-header-title">{config?.customTitle || 'Custom Edit'}</span>
        {isDirty && <span className="ced-dirty-dot" title="Unsaved changes" />}
        {hasRecords && <span className="ced-header-badge">{totalCount}</span>}
        {hasRecords && (
          <button
            className="ced-header-btn"
            title="Close editor"
            aria-label="Close editor"
            onClick={handleExit}
          >
            ✕
          </button>
        )}
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
          {/* Navigation bar — shown whenever more than one feature is selected */}
          {liveRecords.length > 1 && (
            <div className="ced-nav">
              <button className="ced-nav-btn" title="First feature" aria-label="First feature"
                disabled={currentIndex === 0} onClick={() => goToIndex(0)}>
                «
              </button>
              <button className="ced-nav-btn" title="Previous feature" aria-label="Previous feature"
                disabled={currentIndex === 0} onClick={() => goToIndex(currentIndex - 1)}>
                ‹
              </button>

              {showList
                ? (
                  <select className="ced-nav-select" value={currentIndex}
                    onChange={e => goToIndex(parseInt(e.target.value, 10))}>
                    {liveRecords.map((rec, i) => (
                      <option key={rec.getId()} value={i}>
                        {i + 1} / {liveRecords.length} — {getRecordLabel(rec, i)}
                      </option>
                    ))}
                  </select>
                  )
                : (
                  <span className="ced-nav-count">{currentIndex + 1} of {liveRecords.length}</span>
                  )}

              <button className="ced-nav-btn" title="Next feature" aria-label="Next feature"
                disabled={currentIndex === liveRecords.length - 1} onClick={() => goToIndex(currentIndex + 1)}>
                ›
              </button>
              <button className="ced-nav-btn" title="Last feature" aria-label="Last feature"
                disabled={currentIndex === liveRecords.length - 1} onClick={() => goToIndex(liveRecords.length - 1)}>
                »
              </button>
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

            {/* Always kept in the DOM so esriFormRef stays valid through the
                async loadArcGISJSAPIModules call. Hidden via CSS while loading. */}
            <div
              ref={esriFormRef}
              className="ced-esri-form"
              style={{ display: isLoading ? 'none' : 'block' }}
            />

            {formError && !isLoading && (
              <div className="ced-form-error">{formError}</div>
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

          {/* Confirm discard of unsaved edits (navigation / exit) */}
          {pendingAction && (
            <div className="ced-confirm-unsaved">
              <p>You have unsaved changes. Discard them and continue?</p>
              <div className="ced-confirm-btns">
                <Button size="sm" type="danger" onClick={confirmPendingAction}>Discard changes</Button>
                <Button size="sm" onClick={() => setPendingAction(null)}>Keep editing</Button>
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
            <Button type="tertiary" size="sm" disabled={isSaving || isDeleting} onClick={handleExit}>
              Exit
            </Button>
            <Button type="default" size="sm" disabled={isSaving || isDeleting || !isDirty} onClick={handleDiscard}>
              Discard
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

// Expose selectionVersion (a plain number) from the Redux widget state so that
// the component re-renders whenever a new selection arrives, independent of
// whether mutableStateProps object identity changed.
export const mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>) => ({
  selectionVersion: (state.widgetsState?.[ownProps.id]?.selectionVersion as number) ?? 0
})

export default Widget
