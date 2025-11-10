# 🧩 Ticket #1235 – Inconsistent Average Revenue & CTR Reports (Medium Priority)

## 🧭 Summary

Analytics team reported inconsistent data returned by the endpoints `/reports/avg-revenue` and `/reports/ctr` compared to internal calculations.

**Symptoms:**

- _FoodDaily_ missing from `/reports/avg-revenue`.
- Averages higher than expected for _TechMedia_.
- CTR values for _FoodDaily_ significantly lower than expected.

---

## 🔍 Investigation — Reproduce → Observe → Diagnose

### 1️⃣ Reproduction

- Environment started with `docker compose up -d`.
- Queried both endpoints:
  ```bash
  curl http://localhost:3000/reports/avg-revenue
  curl http://localhost:3000/reports/ctr
  ```
- Observed differences between API responses and database aggregates.

**Before (`/reports/avg-revenue`):**

```json
[
  { "publisher_id": 3, "name": "TravelNow", "avg_revenue": "200.00" },
  { "publisher_id": 1, "name": "TechMedia", "avg_revenue": "130.58" }
]
```

**After fix:**

```json
[
  { "publisher_id": 3, "name": "TravelNow", "avg_revenue": "200.00" },
  { "publisher_id": 1, "name": "TechMedia", "avg_revenue": "135.63" },
  { "publisher_id": 2, "name": "FoodDaily", "avg_revenue": "41.38" }
]
```

---

### 2️⃣ Diagnosis

| Endpoint               | Root Cause                                                                                                       | Effect                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `/reports/avg-revenue` | Query filtered out low-revenue publishers using `HAVING AVG(r.revenue) > 100`; duplicated rows inflated results. | _FoodDaily_ missing, _TechMedia_ inflated averages.         |
| `/reports/ctr`         | Used simple average of row CTRs instead of weighted CTR `SUM(clicks)/SUM(impressions)`.                          | Underestimated CTR for smaller publishers like _FoodDaily_. |

---

## 🧠 Fix Implementation

### ✅ `/reports/avg-revenue`

**Fix:**

- Removed restrictive `HAVING` clause.
- Grouped by `date` to calculate daily means.
- Used `AVG(DISTINCT revenue)` to avoid duplicates.

**Corrected Query:**

```sql
SELECT
  p.id AS publisher_id,
  p.name,
  ROUND(AVG(sub.daily_avg)::numeric, 2) AS avg_revenue
FROM publishers p
JOIN (
  SELECT publisher_id, date, AVG(DISTINCT revenue) AS daily_avg
  FROM reports
  GROUP BY publisher_id, date
) sub ON sub.publisher_id = p.id
GROUP BY p.id, p.name
ORDER BY avg_revenue DESC;
```

---

### ✅ `/reports/ctr`

**Fix:**

- Replaced biased `AVG(row_ctr)` with weighted CTR.
- Used `NULLIF` to prevent division by zero and `COALESCE` for safety.
- Switched to `LEFT JOIN` to include publishers with no impressions.

**Corrected Query:**

```sql
SELECT
  p.id AS publisher_id,
  p.name,
  COALESCE(
    ROUND(100 * (SUM(r.clicks)::numeric / NULLIF(SUM(r.impressions), 0)), 2),
    0
  ) AS avg_ctr
FROM publishers p
LEFT JOIN reports r
  ON r.publisher_id = p.id
GROUP BY p.id, p.name
ORDER BY avg_ctr DESC;
```

**CTR Before → After:**

- _FoodDaily:_ 1.51 → **2.26%**
- _TechMedia_ and _TravelNow:_ consistent, unchanged.

---

## ✅ Validation and Verification

### Automated Integration Tests

After the fix, two new Vitest-based integration suites were introduced to prevent regression:

| File                                   | Endpoint Tested        | Purpose                                                           |
| -------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `api/tests/report-avg-revenue.spec.ts` | `/reports/avg-revenue` | Ensures all publishers appear and averages are accurate.          |
| `api/tests/report-ctr.spec.ts`         | `/reports/ctr`         | Confirms CTRs are weighted correctly and handle zero impressions. |

**Execution:**

```bash
npm run test:api
# or
npm run test --workspace api
```

**All tests passing:**

```
 PASS  tests/report-avg-revenue.spec.ts
 PASS  tests/report-ctr.spec.ts
```

---

### Manual Validation

| Check                   | Expected Result                         | Status |
| ----------------------- | --------------------------------------- | ------ |
| All publishers returned | _FoodDaily_ included                    | ✅     |
| CTR formula accuracy    | Weighted (Σclicks / Σimpressions) × 100 | ✅     |
| Revenue averages        | Match database daily means              | ✅     |
| Division by zero        | Prevented with `NULLIF`                 | ✅     |
| Regression tests        | Pass across multiple runs               | ✅     |

---

## 🛡 Prevention and Observability

- **Regression coverage**: Added automated Vitest tests for both report endpoints.
- **Data consistency**: Suggested `UNIQUE(publisher_id, date)` constraint in `reports` table.
- **Performance**: Recommended index `ix_reports_publisher` to optimize aggregations.
- **Continuous validation**: Integrated test scripts under monorepo orchestration (`test:api`, `test:frontend`, `test:all`).

---

## 🏁 Final Outcome

✅ **Status:** Fixed and Validated  
🏷️ **Version:** `v1.0.2`  
📅 **Ticket:** #1235 – _FoodDaily Analytics Team_  
🧪 **Regression Tests:** Implemented and passing  
🚀 **Impact:** Restored analytics accuracy, improved query reliability, and ensured automated prevention of future regressions.
