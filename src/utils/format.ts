export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', options).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
