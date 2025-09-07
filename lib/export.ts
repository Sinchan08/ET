export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return
  const headers = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach((k) => set.add(k))
      return set
    }, new Set())
  )
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printElementAsPDF(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  const win = window.open("", "PRINT", "height=800,width=1200")
  if (!win) return
  win.document.write("<html><head><title>Export</title>")
  win.document.write("</head><body>")
  win.document.write(el.outerHTML)
  win.document.write("</body></html>")
  win.document.close()
  win.focus()
  win.print()
  win.close()
}
