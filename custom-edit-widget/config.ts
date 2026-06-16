import { ImmutableObject } from 'jimu-core'

export interface Config {
  /** Custom title shown in the widget header */
  customTitle: string
  /** Allow creating new features */
  enableCreate: boolean
  /** Allow updating existing features */
  enableUpdate: boolean
  /** Allow deleting features */
  enableDelete: boolean
  /** Show a list of all selected records above the form */
  showFeatureList: boolean
  /** Field names to hide from the form (empty = show all editable fields) */
  hiddenFields: string[]
}

export type IMConfig = ImmutableObject<Config>
