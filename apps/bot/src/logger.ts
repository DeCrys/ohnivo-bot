type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  if (meta === undefined) {
    console[level === "debug" ? "log" : level](line);
    return;
  }
  console[level === "debug" ? "log" : level](line, meta);
}

export const logger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
