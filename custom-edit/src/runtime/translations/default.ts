export default {
  _widgetLabel: 'Custom Edit',

  // Empty state
  noSelectionTitle: 'No features selected',
  noSelectionHint: 'Select features on a map to edit them here. Connect a Map widget via Message Settings → "Data record selection change" → "Edit selected records".',

  // Navigation
  recordNavigation: 'Feature {current} of {total}',
  previous: 'Previous',
  next: 'Next',

  // Actions
  save: 'Save',
  saving: 'Saving…',
  reset: 'Reset',
  delete: 'Delete',
  deleting: 'Deleting…',
  addNew: 'Add New',
  cancel: 'Cancel',

  // Feedback
  saveSuccess: 'Changes saved successfully.',
  saveFailed: 'Save failed: {error}',
  deleteSuccess: 'Feature deleted successfully.',
  deleteFailed: 'Delete failed: {error}',
  confirmDeletePrompt: 'Are you sure you want to delete this feature? This cannot be undone.',
  confirmYes: 'Yes, delete',

  // Editor states
  loadingEditor: 'Loading editor…',
  editorError: 'Could not load the editor. The feature layer may not be editable.',
  noEditableFields: 'No editable fields found for this feature.',

  // Settings panel
  settingsTitle: 'Custom Edit Settings',
  widgetTitleLabel: 'Widget title',
  widgetTitlePlaceholder: 'Custom Edit',
  dataSourceLabel: 'Feature layer (optional)',
  dataSourceHint: 'Optional standalone data source. The widget can also receive selections from a Map widget.',
  enableCreateLabel: 'Allow creating new features',
  enableUpdateLabel: 'Allow editing features',
  enableDeleteLabel: 'Allow deleting features',
  showFeatureListLabel: 'Show selected feature list',
  setupInstructions: 'Setup instructions',
  setupStep1: 'Add this widget and a Map widget to your app.',
  setupStep2: 'In Message Settings, link the Map widget\'s "Data record selection change" message to this widget\'s "Edit selected records" action.',
  setupStep3: 'Select features on the map — they will appear here for editing.'
}
