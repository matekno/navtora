# Verdad conocida por set

- `shannon.json`: layout estándar; `offset` relaciona número de archivo con número de columna.
- Para sets con layout no estándar (kokhav, makhonot, bl1462) se genera `columns` con el pipeline en modo
  confident y revisión manual de 20 columnas por set. Hasta entonces el eval de esos sets informa sólo
  el estado (confident/ambiguous/insufficient) y la posición predicha, sin marcar acierto.
