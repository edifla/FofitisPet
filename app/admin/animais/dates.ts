// Datas dos campos <input type="date"> do cadastro de animais, no formato AAAA-MM-DD.

export function todayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Datas sem hora vêm do banco à meia-noite UTC.
export function toDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}
