/**
 * Structured logging helper (component 10, §5.10).
 *
 * Thin wrapper — no new infra. Default sink emits one JSON object per line to
 * console.log (Cloudflare Workers captures these into Logs). Sink is injectable
 * so tests can capture without touching stdout.
 *
 * Design notes:
 * - JSON-lines, not pretty-printed: Workers log viewers parse structured lines
 *   better than multi-line text.
 * - Each log line carries: timestamp (ISO), level, event name, and any
 *   structured fields. Default fields set at Logger construction are merged
 *   into every line (business_id, environment, etc.) — use .child() to extend.
 * - The agent's toolCalls/toolResults trace (component 5) can be attached as
 *   structured fields — that's the per-question observability signal §5.10
 *   wants without adding Sentry-style infrastructure.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export interface LogSink {
  log(level: LogLevel, event: string, fields: LogFields): void;
}

export class ConsoleJsonLogSink implements LogSink {
  log(level: LogLevel, event: string, fields: LogFields): void {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
    // Workers captures both console.log and .error into Logs; route warn/error
    // through .error so they're surfaced in the dashboard error view too.
    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}

export class Logger {
  private readonly sink: LogSink;
  private readonly defaults: LogFields;

  constructor(opts: { sink?: LogSink; defaults?: LogFields } = {}) {
    this.sink = opts.sink ?? new ConsoleJsonLogSink();
    this.defaults = opts.defaults ?? {};
  }

  /** Returns a new Logger whose defaults are merged with the given fields. */
  child(fields: LogFields): Logger {
    return new Logger({
      sink: this.sink,
      defaults: { ...this.defaults, ...fields },
    });
  }

  debug(event: string, fields: LogFields = {}): void {
    this.sink.log("debug", event, { ...this.defaults, ...fields });
  }

  info(event: string, fields: LogFields = {}): void {
    this.sink.log("info", event, { ...this.defaults, ...fields });
  }

  warn(event: string, fields: LogFields = {}): void {
    this.sink.log("warn", event, { ...this.defaults, ...fields });
  }

  error(event: string, fields: LogFields = {}): void {
    this.sink.log("error", event, { ...this.defaults, ...fields });
  }
}

/**
 * Convenience: a module-level default logger. Components without explicit
 * construction can use this. Tests should construct their own Logger with a
 * capturing sink rather than poking the global.
 */
export const logger = new Logger();
