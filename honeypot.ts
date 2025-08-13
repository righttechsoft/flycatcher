// Honeypot application - monitors common ports and sends webhook alerts
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL");
const HOST_NAME = Deno.env.get("HOST_NAME") || Deno.hostname();

if (!WEBHOOK_URL) {
  console.error("WEBHOOK_URL environment variable is required");
  Deno.exit(1);
}

// Common ports to monitor
const COMMON_PORTS = [
  21, // FTP
  22, // SSH
  23, // Telnet
  25, // SMTP
  53, // DNS
  80, // HTTP
  110, // POP3
  143, // IMAP
  443, // HTTPS
  993, // IMAPS
  995, // POP3S
  1433, // SQL Server
  1521, // Oracle
  3306, // MySQL
  3389, // RDP
  5432, // PostgreSQL
  5900, // VNC
  6379, // Redis
  8080, // HTTP Alt
  8443, // HTTPS Alt
];

interface ConnectionAttempt {
  timestamp: string;
  sourceIP: string;
  targetPort: number;
  protocol: string;
}

interface WebhookPayload {
  type: "connection_attempt" | "health_check";
  timestamp: string;
  host_name: string;
  data?: ConnectionAttempt | string;
}

// Send webhook notification
function sendWebhook(payload: WebhookPayload) {
  fetch(WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error("Failed to send webhook:", error);
  });
}

// Handle incoming connections
function handleConnection(conn: Deno.Conn, port: number) {
  const remoteAddr = conn.remoteAddr as Deno.NetAddr;

  const attempt: ConnectionAttempt = {
    timestamp: new Date().toISOString(),
    sourceIP: remoteAddr.hostname,
    targetPort: port,
    protocol: "TCP",
  };

  console.log(
    `Connection attempt detected: ${attempt.sourceIP}:${attempt.targetPort}`,
  );

  // Send webhook notification
  sendWebhook({
    type: "connection_attempt",
    timestamp: attempt.timestamp,
    host_name: HOST_NAME,
    data: attempt,
  });

  // Close connection immediately
  conn.close();
}

// Start listening on a specific port
function startListener(port: number) {
  try {
    const listener = Deno.listen({ hostname: "0.0.0.0", port });

    console.log(`Listening on port ${port}`);

    // Handle connections asynchronously
    (async () => {
      for await (const conn of listener) {
        handleConnection(conn, port);
      }
    })();

    return listener;
  } catch (error) {
    console.error(`Failed to start listener on port ${port}:`, error);
    return null;
  }
}

// Send health check every hour
function startHealthCheck() {
  setInterval(() => {
    console.log("Sending health check");
    sendWebhook({
      type: "health_check",
      timestamp: new Date().toISOString(),
      host_name: HOST_NAME,
      data: "still alive",
    });
  }, 60 * 60 * 1000); // 1 hour
}

// Main function
function main() {
  console.log("Starting honeypot on ports:", COMMON_PORTS.join(", "));
  console.log("Webhook URL:", WEBHOOK_URL);
  console.log("Host Name:", HOST_NAME);

  const listeners: (Deno.Listener | null)[] = [];

  // Start listeners for all common ports
  for (const port of COMMON_PORTS) {
    const listener = startListener(port);
    if (listener) {
      listeners.push(listener);
    }
  }

  if (listeners.length === 0) {
    console.error("No listeners could be started. Exiting.");
    Deno.exit(1);
  }

  console.log(`Successfully started ${listeners.length} listeners`);

  // Start health check
  startHealthCheck();

  // Send initial health check
  sendWebhook({
    type: "health_check",
    timestamp: new Date().toISOString(),
    host_name: HOST_NAME,
    data: "honeypot started",
  });

  // Keep the process running
  console.log("Honeypot is running. Press Ctrl+C to stop.");
}

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", () => {
  console.log("\nShutting down honeypot...");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", () => {
  console.log("\nShutting down honeypot...");
  Deno.exit(0);
});

// Start the application
main();
