import {
  AbstractMessageAction,
  MessageType,
  type Message,
  type MessageDescription,
  type DataRecordsSelectionChangeMessage,
  getAppStore,
  appActions
} from 'jimu-core'

/**
 * Receives DataRecordsSelectionChangeMessage from other widgets (e.g. Map widget
 * when features are selected) and stores a serializable snapshot of the record
 * IDs + raw attribute data into the widget's Redux state.
 *
 * Why serialize? DataRecord instances are class objects that cannot be placed
 * directly into the Redux store. The widget's mutable-state channel (via the
 * data action) carries the live instances; this channel carries the metadata
 * so the widget can still react to map selections.
 *
 * Wiring in Experience Builder:
 *   Map widget → "Data record selection change"
 *     → Custom Edit → "Edit selected records"
 */
export default class SelectDataAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    // messageDescription.messageType (not .type) is the correct property
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

    // Store only plain, serializable data — not the class instances
    const serialized = records.map(r => ({
      id: r.getId(),
      data: r.getData() ?? {}
    }))

    // Also stash the count so the widget can show a badge even before the
    // mutable-state channel resolves live records
    getAppStore().dispatch(
      appActions.widgetStatePropChange(this.widgetId, 'selectedRecordSnapshots', serialized)
    )
    getAppStore().dispatch(
      appActions.widgetStatePropChange(this.widgetId, 'selectedCount', records.length)
    )

    return true
  }
}
