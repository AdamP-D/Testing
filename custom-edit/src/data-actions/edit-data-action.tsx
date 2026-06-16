import {
  AbstractDataAction,
  type DataRecordSet,
  type DataLevel,
  MutableStoreManager,
  DataSourceTypes,
  getAppStore,
  appActions
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

    MutableStoreManager.getInstance().updateStateValue(
      this.widgetId,
      'selectedRecords',
      records ?? []
    )

    const current = getAppStore().getState()
      .widgetsState?.[this.widgetId]?.selectionVersion ?? 0
    getAppStore().dispatch(
      appActions.widgetStatePropChange(
        this.widgetId,
        'selectionVersion',
        (current as number) + 1
      )
    )

    return true
  }
}
