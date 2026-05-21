export const GLOBAL_SELECTION_EVENT = '__global_selection__'

export type GlobalSelectionDetail = {
  uid: string
  scope?: string
  next?: { seriesIndex: number; dataIndex: number } | null
  kind?: 'echart' | 'card' | 'dashboard'
}

export function broadcastGlobalSelection(detail: GlobalSelectionDetail) {
  try {
    window.dispatchEvent(new CustomEvent(GLOBAL_SELECTION_EVENT, { detail }))
  } catch {}
}

