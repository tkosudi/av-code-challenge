# 🧠 Incident Report — HTTP 503 Investigation (Theoretical Scenario)

**Scenario:**  
Intermittent `HTTP 503 (Service Unavailable)` errors were reported on the `/api/ad` and `/reports/*` endpoints.  
This status usually means the server is **temporarily unable to handle requests**, often due to resource saturation, dependency failure, or infrastructure instability.

---

### 1️⃣ Possible Symptoms

During the initial investigation, we could observe situations such as:

- Some requests returning 503 responses, sometimes with higher latency.
- Application logs showing timeout or database connection errors (**level: code / application**).
- Containers restarting or marked as _unhealthy_, suggesting failed healthchecks (**level: infrastructure**).
- Increased error rate or resource usage visible on monitoring tools (Grafana, Datadog, or similar).

---

### 2️⃣ Initial Hypotheses

1. Database connection pool saturation (**level: code / application**).
2. Long-running or locked queries in Postgres (**level: database**).
3. Automatic restarts triggered by failing healthchecks (**level: infrastructure**).
4. Blocking or CPU-heavy operations affecting the Node.js event loop (**level: code / application**).

---

### 3️⃣ Investigation Process

- **Monitoring:** check metrics such as error rate, latency, and resource usage on the observability platform to identify correlations.
- **Database:** inspect active sessions with:
  ```sql
  SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
  ```
  Finding connections in _idle in transaction_ state could mean sessions were not released properly (**level: database**).
- **Infrastructure:** check container health status:
  ```bash
  docker inspect api | grep -A3 Health
  ```
  Containers marked as _unhealthy_ would point to readiness or liveness issues (**level: infrastructure**).
- **Load Testing:** use a load testing tool (for example, `autocannon`) to reproduce the issue under high concurrency.

---

### 4️⃣ Most Likely Root Cause

A common root cause for this scenario would be **exhausted database connections**, caused by transactions not being closed or long queries holding locks.  
This situation could prevent new connections and lead to 503 responses (**level: code / application**).

---

### 5️⃣ Recommended Corrective Actions

- Ensure every connection is properly released in the code (`finally { client.release() }`).
- Apply timeout policies for queries and transactions:
  ```sql
  SET statement_timeout = '5s';
  SET idle_in_transaction_session_timeout = '30s';
  ```
- Implement a `/ready` endpoint to check real dependency health.
- Validate improvements using load tests and continuous monitoring.

---

### 6️⃣ Prevention Strategies

| Area           | Preventive Action                                             | Level    |
| -------------- | ------------------------------------------------------------- | -------- |
| Observability  | Dashboards and alerts for error rate and DB pool usage        | Infra    |
| Database       | Use PgBouncer and automatic timeouts                          | Database |
| Application    | Circuit breaker and retry with backoff for transient failures | Code     |
| Infrastructure | Reliable healthchecks and container auto-restart              | Infra    |

---

### 💬 How I Would Explain It in an Interview

> “If I received 503 errors in production, I’d start by checking logs and metrics to see if the issue comes from the app, the database, or the infrastructure.  
> Usually, it’s related to database pool exhaustion or a failing healthcheck.  
> I’d confirm my hypotheses with diagnostic commands, apply proper timeouts, and make sure resources are released correctly.  
> Finally, I’d set up monitoring and alerts to prevent it from happening again.”
