import {
  AbstractMessageAction,
  MessageType,
  type Message,
  type MessageDescription,
  type DataRecordsSelectionChangeMessage,
  MutableStoreManager,
  getAppStore,
  appActions
} from 'jimu-core'

/**
 * Receives DataRecordsSelectionChangeMessage from other widgets (e.g. Map,
 * List, Table) and forwards the live DataRecord instances to the edit widget.
 *
 * Two-channel approach:
 *  - MutableStoreManager   → live DataRecord[] (class instances, not Redux-safe)
 *  - Redux widgetStateProp → selectionVersion counter (plain number, reliable
 *                            re-render trigger even when the same object
 *                            reference is reused by ExB's mutableStateProps)
 *
 * Wiring in Experience Builder:
 *   Any widget → "Data record selection change"
 *     → Custom Edit → "Edit selected records"
 */
export default class SelectDataAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    return messageDescription.messageType === MessageType.DataRecordsSelectionChange
  }

  filterMessage (message: Message): boolean {
    return message.type === MessageType.DataRecordsSelectionChange
  }

  getDefaultMessageType (): MessageType {
    return MessageType.DataRecordsSelectionChange
  }

  getSettingComponentUri (_messageType: MessageType): string {
    return null
  }

  onExecute (message: Message, _actionConfig?: any): Promise<boolean> | boolean {
    const msg = message as DataRecordsSelectionChangeMessage
    const records = msg.records ?? []

    // Live records → mutable store (DataRecord instances aren't Redux-safe)
    MutableStoreManager.getInstance().updateStateValue(
      this.widgetId,
      'selectedRecords',
      records
    )

    // Version counter → Redux (guarantees a component re-render even when
    // mutableStateProps object identity doesn't change between selections)
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
