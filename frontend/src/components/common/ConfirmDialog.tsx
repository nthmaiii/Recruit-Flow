interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDanger ? 'bg-red-100' : 'bg-orange-100'
              }`}
            >
              <svg
                className={`w-5 h-5 ${isDanger ? 'text-red-600' : 'text-orange-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 justify-end">
          <button onClick={onCancel} disabled={isPending} className="btn-secondary">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`btn ${
              isDanger
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400'
            }`}
          >
            {isPending ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
