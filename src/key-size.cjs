/** 键位尺寸换算：node src/key-size.cjs（只打印，供人工核对） */
for (const width of [280, 340, 420, 520, 640, 720, 860]) {
  const inner = width - 24
  const gap = Math.max(3, Math.round(inner * 0.01))
  const keyW = Math.max(26, Math.min(150, (inner - 9 * gap) / 10))
  const keyH = Math.round(keyW * 0.76)
  const kb = keyH * 3 + gap * 2
  const need = 34 + 22 + kb + 46
  console.log(
    '面板 ' + String(width).padStart(3) + 'px' +
    ' → 键宽 ' + keyW.toFixed(0).padStart(3) +
    ' 键高 ' + String(keyH).padStart(3) +
    ' 键盘 ' + String(kb).padStart(3) +
    ' 键位页需 ' + String(need).padStart(3) + 'px',
  )
}
