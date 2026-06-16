import {
  AbstractMessageAction,
  MessageType,
  Message,
  DataRecordsSelectionChangeMessage,
  MessageDescription,
  getAppStore,
  appActions,
  DataRecord
} from 'jimu-core'

/**
 * Message action that receives DataRecordsSelectionChangeMessage from other widgets
 * (e.g., a Map widget when the user selects features) and forwards the records
 * to this widget's state so the editor can display them.
 *
 * Wiring in Experience Builder:
 *   Map widget → "Data record selection change" → Custom Edit → "Edit selected records"
 */
export default class SelectDataAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    return messageDescription.type === MessageType.DataRecordsSelectionChange
  }

  filterMessage (message: Message): boolean {
    return message.type === MessageType.DataRecordsSelectionChange
  }

  getDefaultMessageType (): MessageType {
    return MessageType.DataRecordsSelectionChange
  }

  onExecute (message: Message, _actionConfig?: any): Promise<boolean> | boolean {
    const msg = message as DataRecordsSelectionChangeMessage
    const records: DataRecord[] = msg.records ?? []

    // Push selected records into this widget's widgetState so widget.tsx can read them
    getAppStore().dispatch(
      appActions.widgetStatePropChange(this.widgetId, 'selectedRecords', records)
    )

    return true
  }
}
