import {
  AbstractMessageAction,
  MessageType,
  type Message,
  type MessageDescription,
  type DataRecordsSelectionChangeMessage,
  MutableStoreManager
} from 'jimu-core'

/**
 * Receives DataRecordsSelectionChangeMessage from other widgets (e.g. a Map
 * widget when features are selected) and forwards the live DataRecord
 * instances to the edit widget via MutableStoreManager — the same channel
 * used by the "Edit" data action — so the widget always has a real Graphic
 * to read field metadata from and to applyEdits() against.
 *
 * DataRecord instances are class objects and cannot be placed in the Redux
 * store (appActions.widgetStatePropChange requires serializable data), so
 * MutableStoreManager is the correct mechanism here, not Redux.
 *
 * Wiring in Experience Builder:
 *   Map widget → "Data record selection change"
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

  // Return null to skip the per-connection settings panel
  getSettingComponentUri (_messageType: MessageType): string {
    return null
  }

  onExecute (message: Message, _actionConfig?: any): Promise<boolean> | boolean {
    const msg = message as DataRecordsSelectionChangeMessage
    const records = msg.records ?? []

    MutableStoreManager.getInstance().updateStateValue(
      this.widgetId,
      'selectedRecords',
      records
    )

    return true
  }
}
