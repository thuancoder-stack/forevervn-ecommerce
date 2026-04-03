export const adminAntdTheme = {
  token: {
    colorPrimary: '#ec4899',
    colorInfo: '#ec4899',
    borderRadius: 16,
    colorBorderSecondary: '#f1f5f9',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  components: {
    Card: {
      bodyPadding: 18,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#64748b',
      headerBorderRadius: 14,
      rowHoverBg: '#fbfdff',
      borderColor: '#f1f5f9',
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
      cellFontSize: 13,
    },
    Modal: {
      borderRadiusLG: 22,
    },
    Input: {
      paddingBlock: 8,
    },
    InputNumber: {
      controlHeightLG: 40,
    },
    Select: {
      controlHeightLG: 40,
      optionHeight: 36,
    },
    Button: {
      controlHeightLG: 40,
    },
    Segmented: {
      trackPadding: 3,
    },
  },
}

export const pageShellClass = 'w-full px-4 py-5 md:px-6'
export const compactStatsRowClass = 'mb-5 flex gap-3 overflow-x-auto pb-1'
export const compactStatCardClass = 'min-w-[190px] flex-1 shadow-sm'
export const sectionGridGapClass = 'grid gap-5'

export const getSelectPopupContainer = (triggerNode) => triggerNode?.parentElement || document.body

export const compactTableProps = {
  size: 'middle',
  pagination: { pageSize: 6, showSizeChanger: false, size: 'small' },
}

export const nativeSelectClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-slate-50'
