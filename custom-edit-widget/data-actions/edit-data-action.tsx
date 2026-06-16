import {
  AbstractDataAction,
  DataRecordSet,
  DataLevel,
  getAppStore,
  appActions,
  DataRecord
} from 'jimu-core'

/**
 * Data action that allows other widgets to push records into this edit widget
 * via the standard ExB data-action menu (the "..." or right-click action panel).
 *
 * When enabled, an "Edit" option appears in any widget that supports data actions
 * (e.g., List, Table, Feature Info), allowing users to send those records to
 * this widget for editing without a map selection.
 */
export default class EditDataAction extends AbstractDataAction {
  async isSupported (
    dataRecordSet: DataRecordSet,
    dataLevel: DataLevel
  ): Promise<boolean> {
    // Only surface the action when there are actual records to edit
    return (dataRecordSet?.records?.length ?? 0) > 0
  }

  async onExecute (
    dataRecordSet: DataRecordSet,
    _dataLevel: DataLevel
  ): Promise<boolean> {
    const records: DataRecord[] = dataRecordSet.records ?? []

    getAppStore().dispatch(
      appActions.widgetStatePropChange(this.widgetId, 'selectedRecords', records)
    )

    return true
  }
}
