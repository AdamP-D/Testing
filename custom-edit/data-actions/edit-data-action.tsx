import {
  AbstractDataAction,
  type DataRecordSet,
  type DataLevel,
  MutableStoreManager,
  DataSourceTypes
} from 'jimu-core'

/**
 * Data action that surfaces an "Edit" option in the action menus of widgets
 * that support data actions (Table, List, Feature Info, etc.).
 *
 * When triggered it delivers the live DataRecord instances to the edit widget
 * via MutableStoreManager — the correct channel for non-serializable class
 * objects that cannot enter the Redux store.
 *
 * The edit widget reads these from props.mutableStateProps.selectedRecords.
 */
export default class EditDataAction extends AbstractDataAction {
  async isSupported (
    dataSets: DataRecordSet[],
    _dataLevel: DataLevel
  ): Promise<boolean> {
    if (!dataSets?.length) return false
    const { records, dataSource } = dataSets[0]
    // Only offer the action for FeatureLayer-backed data sets with records
    if (dataSource?.type !== DataSourceTypes.FeatureLayer) return false
    return (records?.length ?? 0) > 0
  }

  async onExecute (
    dataSets: DataRecordSet[],
    _dataLevel: DataLevel
  ): Promise<boolean> {
    const { records } = dataSets[0]

    // MutableStoreManager handles class instances (DataRecord, Graphic, etc.)
    // that cannot be JSON-serialized into Redux.
    MutableStoreManager.getInstance().updateStateValue(
      this.widgetId,
      'selectedRecords',
      records ?? []
    )

    return true
  }
}
