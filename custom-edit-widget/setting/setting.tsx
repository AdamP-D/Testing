/** @jsx jsx */
import { React, jsx, css, Immutable } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector, AllDataSourceTypes } from 'jimu-ui/advanced/data-source-selector'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Switch, Label, TextInput } from 'jimu-ui'
import type { IMConfig, Config } from '../config'

type Props = AllWidgetSettingProps<IMConfig>

const getStyle = () => css`
  .ced-setting {
    font-size: 13px;
  }
  .ced-hint {
    font-size: 11px;
    color: var(--ref-palette-neutral-700, #666);
    line-height: 1.5;
    margin-top: 4px;
  }
  .ced-switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  .ced-info-box {
    padding: 10px 12px;
    background: var(--ref-palette-primary-100, #e8f3fb);
    border: 1px solid var(--ref-palette-primary-200, #c0ddf5);
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
  }
  .ced-info-box ol { margin: 6px 0 0; padding-left: 18px; }
  .ced-info-box li { margin-bottom: 3px; }
`

const Setting = (props: Props) => {
  const { id, config, useDataSources, onSettingChange } = props

  const set = <K extends keyof Config>(key: K, value: Config[K]) => {
    onSettingChange({ id, config: config.set(key, value) })
  }

  return (
    <div css={getStyle()} className="ced-setting">

      {/* ── Display ──────────────────────────────────────── */}
      <SettingSection title="Display">
        <SettingRow label="Widget title">
          <TextInput
            value={config?.customTitle ?? ''}
            size="sm"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              set('customTitle', e.target.value)
            }
            placeholder="Custom Edit"
          />
        </SettingRow>
        <SettingRow>
          <div className="ced-switch-row">
            <Label>Show feature list when multiple selected</Label>
            <Switch
              checked={config?.showFeatureList === true}
              onChange={(_e: any, checked: boolean) => set('showFeatureList', checked)}
            />
          </div>
        </SettingRow>
      </SettingSection>

      {/* ── Data source ──────────────────────────────────── */}
      <SettingSection title="Data source (optional)">
        <SettingRow>
          <DataSourceSelector
            types={Immutable([AllDataSourceTypes.FeatureLayer])}
            useDataSources={useDataSources}
            onChange={newDs => onSettingChange({ id, useDataSources: newDs })}
            widgetId={id}
          />
        </SettingRow>
        <p className="ced-hint">
          Connect a feature layer for standalone use. The widget also receives
          selections from Map, Table, and List widgets without a data source here.
        </p>
      </SettingSection>

      {/* ── Editing permissions ───────────────────────────── */}
      <SettingSection title="Editing permissions">
        <SettingRow>
          <div className="ced-switch-row">
            <Label>Allow editing features</Label>
            <Switch
              checked={config?.enableUpdate !== false}
              onChange={(_e: any, checked: boolean) => set('enableUpdate', checked)}
            />
          </div>
        </SettingRow>
        <SettingRow>
          <div className="ced-switch-row">
            <Label>Allow deleting features</Label>
            <Switch
              checked={config?.enableDelete === true}
              onChange={(_e: any, checked: boolean) => set('enableDelete', checked)}
            />
          </div>
        </SettingRow>
        <SettingRow>
          <div className="ced-switch-row">
            <Label>Allow creating new features</Label>
            <Switch
              checked={config?.enableCreate === true}
              onChange={(_e: any, checked: boolean) => set('enableCreate', checked)}
            />
          </div>
        </SettingRow>
      </SettingSection>

      {/* ── Setup guide ──────────────────────────────────── */}
      <SettingSection title="Setup guide">
        <SettingRow>
          <div className="ced-info-box">
            <strong>Receiving selections from a Map widget:</strong>
            <ol>
              <li>Add a <strong>Map</strong> widget with an editable feature layer.</li>
              <li>Open the Map widget's <strong>Message Settings</strong>.</li>
              <li>
                Add: <em>"Data record selection change"</em> →
                <em> Custom Edit</em> → <em>"Edit selected records"</em>
              </li>
              <li>Select features on the map — they appear here for editing.</li>
            </ol>
            <div style={{ marginTop: 6 }}>
              The widget also appears as an <strong>"Edit"</strong> option in the
              data action menus of Table and List widgets.
            </div>
          </div>
        </SettingRow>
      </SettingSection>

    </div>
  )
}

export default Setting
