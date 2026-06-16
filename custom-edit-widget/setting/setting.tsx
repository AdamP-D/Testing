/** @jsx jsx */
import {
  React,
  jsx,
  css,
  Immutable
} from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import {
  DataSourceSelector,
  AllDataSourceTypes
} from 'jimu-ui/advanced/data-source-selector'
import {
  Switch,
  Label,
  TextInput,
  Checkbox,
  CollapsablePanel,
  Tooltip
} from 'jimu-ui'
import type { IMConfig, Config } from '../config'

const { useState } = React

type SettingProps = AllWidgetSettingProps<IMConfig>

const getStyle = () => css`
  .ced-setting {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-size: 13px;
  }

  .ced-section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--ref-palette-neutral-700, #555);
    margin-bottom: 8px;
  }

  .ced-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ced-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ref-palette-neutral-800, #444);
  }

  .ced-hint {
    font-size: 11px;
    color: var(--ref-palette-neutral-600, #777);
    line-height: 1.4;
    margin-top: 2px;
  }

  .ced-switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--ref-palette-neutral-200, #eee);
  }

  .ced-switch-row:last-child {
    border-bottom: none;
  }

  .ced-switch-label {
    font-size: 13px;
    color: var(--ref-palette-neutral-900, #333);
  }

  .ced-info-box {
    padding: 12px;
    background: var(--ref-palette-primary-100, #e8f3fb);
    border: 1px solid var(--ref-palette-primary-200, #b8d8f0);
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ref-palette-neutral-900, #333);
  }

  .ced-info-box ol {
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .ced-info-box li {
    margin-bottom: 4px;
  }

  .ced-info-title {
    font-weight: 700;
    margin-bottom: 4px;
  }
`

const Setting = (props: SettingProps) => {
  const { config, id, useDataSources, onSettingChange } = props

  const set = <K extends keyof Config>(key: K, value: Config[K]) => {
    onSettingChange({ id, config: config.set(key, value) })
  }

  return (
    <div css={getStyle()} className="ced-setting">

      {/* ── Widget title ──────────────────────────────── */}
      <div className="ced-row">
        <span className="ced-section-title">Display</span>
        <label className="ced-label">Widget title</label>
        <TextInput
          value={config?.customTitle ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            set('customTitle', e.target.value)
          }
          placeholder="Custom Edit"
          size="sm"
        />
      </div>

      {/* ── Data source ───────────────────────────────── */}
      <div className="ced-row">
        <span className="ced-section-title">Data</span>
        <label className="ced-label">Feature layer (optional)</label>
        <DataSourceSelector
          types={Immutable([AllDataSourceTypes.FeatureLayer])}
          useDataSources={useDataSources}
          onChange={newUseDataSources =>
            onSettingChange({ id, useDataSources: newUseDataSources })
          }
          widgetId={id}
        />
        <p className="ced-hint">
          Optionally connect a feature layer for standalone use. The widget can also
          receive selections from a Map widget without a data source configured here.
        </p>
      </div>

      {/* ── Editing permissions ───────────────────────── */}
      <div>
        <span className="ced-section-title">Editing permissions</span>

        <div className="ced-switch-row">
          <span className="ced-switch-label">Allow editing features</span>
          <Switch
            checked={config?.enableUpdate !== false}
            onChange={(_e: any, checked: boolean) => set('enableUpdate', checked)}
          />
        </div>

        <div className="ced-switch-row">
          <span className="ced-switch-label">Allow deleting features</span>
          <Switch
            checked={config?.enableDelete !== false}
            onChange={(_e: any, checked: boolean) => set('enableDelete', checked)}
          />
        </div>

        <div className="ced-switch-row">
          <span className="ced-switch-label">Allow creating features</span>
          <Switch
            checked={config?.enableCreate === true}
            onChange={(_e: any, checked: boolean) => set('enableCreate', checked)}
          />
        </div>
      </div>

      {/* ── UI options ────────────────────────────────── */}
      <div>
        <span className="ced-section-title">UI options</span>
        <div className="ced-switch-row">
          <span className="ced-switch-label">Show selected feature list</span>
          <Switch
            checked={config?.showFeatureList === true}
            onChange={(_e: any, checked: boolean) => set('showFeatureList', checked)}
          />
        </div>
        <p className="ced-hint">
          When multiple features are selected, show a scrollable list at the top of the
          widget to quickly jump between records.
        </p>
      </div>

      {/* ── Setup instructions ────────────────────────── */}
      <div className="ced-info-box">
        <div className="ced-info-title">How to connect to a Map widget</div>
        <ol>
          <li>Add both this widget and a <strong>Map</strong> widget to your app.</li>
          <li>
            Open <strong>Message Settings</strong> on the Map widget and add an action:
            <br/>
            <em>"Data record selection change"</em> → <em>Custom Edit</em> → <em>"Edit selected records"</em>
          </li>
          <li>Publish the app (or preview it) and select features on the map.</li>
          <li>
            The selected features will appear in this widget, ready to edit and save.
          </li>
        </ol>
        <div style={{ marginTop: 8 }}>
          This widget also appears as an <strong>"Edit"</strong> option in the data action
          menu of Table, List, and other data-aware widgets.
        </div>
      </div>

    </div>
  )
}

export default Setting
