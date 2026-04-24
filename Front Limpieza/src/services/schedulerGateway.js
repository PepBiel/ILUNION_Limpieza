const schedulerApiBase = (import.meta.env.VITE_SCHEDULER_API_URL || "/api").trim();

export class SchedulerGatewayError extends Error {
  constructor(message, code = "scheduler_gateway_error") {
    super(message);
    this.name = "SchedulerGatewayError";
    this.code = code;
  }
}

export function getSchedulerStatus() {
  return "connected";
}

export async function requestScheduleGeneration(payload) {
  const response = await fetch(`${schedulerApiBase}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "La API del generador devolvio un error.";
    try {
      const errorPayload = await response.json();
      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch (_error) {
      // noop
    }
    throw new SchedulerGatewayError(
      message,
      "scheduler_request_failed",
    );
  }

  return response.json();
}
