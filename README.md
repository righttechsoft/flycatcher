# flycatcher
FlyCatcher - Deno TypeScript honeypot in Docker. Monitors 20+ common ports (SSH, HTTP, databases), sends real-time webhook notifications on intrusion attempts + hourly health checks.

## Features

- Monitors 20+ common ports (SSH, HTTP, HTTPS, FTP, databases, etc.)
- Sends immediate webhook notifications on connection attempts
- Hourly health check notifications
- Minimalistic Docker image using Alpine Linux
- Security hardened container configuration
- Resource-constrained for minimal system impact

## Quick Start

1. **Build and run with Docker Compose:**
   ```bash
   # Update webhook URL in docker-compose.yml
   docker-compose up --build -d
   ```

2. **Or build and run manually:**
   ```bash
   # Build image
   docker build -t honeypot .
   
   # Run container
   docker run -d \
     --name honeypot \
     -e WEBHOOK_URL="https://your-webhook-endpoint.com/alert" \
     -p 22:22 -p 80:80 -p 443:443 \
     honeypot
   ```

## Configuration

### Environment Variables

- `WEBHOOK_URL` (required): Your webhook endpoint URL

### Monitored Ports

The honeypot monitors these common ports:
- **21** - FTP
- **22** - SSH  
- **23** - Telnet
- **25** - SMTP
- **53** - DNS
- **80** - HTTP
- **110** - POP3
- **143** - IMAP
- **443** - HTTPS
- **993** - IMAPS
- **995** - POP3S
- **1433** - SQL Server
- **1521** - Oracle
- **3306** - MySQL
- **3389** - RDP
- **5432** - PostgreSQL
- **5900** - VNC
- **6379** - Redis
- **8080** - HTTP Alternative
- **8443** - HTTPS Alternative

## Webhook Payloads

### Connection Attempt
```json
{
  "type": "connection_attempt",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "data": {
    "timestamp": "2025-01-15T10:30:45.123Z",
    "sourceIP": "192.168.1.100",
    "targetPort": 22,
    "protocol": "TCP"
  }
}
```

### Health Check
```json
{
  "type": "health_check",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "data": "still alive"
}
```

## Security Features

- Runs as non-root user
- Read-only filesystem
- No new privileges
- Resource limits (64MB RAM, 0.1 CPU)
- Isolated network namespace
- Minimal attack surface

## Deployment Considerations

- **Port Conflicts**: Ensure the ports you want to monitor aren't used by other services
- **Firewall Rules**: Configure your firewall to direct suspicious traffic to the honeypot
- **Monitoring**: Set up alerts based on webhook notifications
- **Logging**: Container logs provide additional debugging information

## Example Webhook Handler

Simple webhook receiver example:
```javascript
// Express.js webhook handler
app.post('/alert', (req, res) => {
  const { type, timestamp, data } = req.body;
  
  if (type === 'connection_attempt') {
    console.log(`🚨 Connection attempt from ${data.sourceIP} to port ${data.targetPort}`);
    // Send alert to security team
  } else if (type === 'health_check') {
    console.log('✅ Honeypot health check received');
  }
  
  res.status(200).send('OK');
});
```

## Troubleshooting

- **Permission Errors**: Ensure Docker has permission to bind to privileged ports (< 1024)
- **Port Conflicts**: Check for existing services using `netstat -tuln`
- **Webhook Issues**: Verify WEBHOOK_URL is accessible and responds with 2xx status
- **Container Health**: Check logs with `docker logs honeypot`
