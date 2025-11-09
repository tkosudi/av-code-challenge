# Technical Challenge — Support Engineer (Fastify + TypeScript + Docker + Postgres)

## Main Objective
You've received two support tickets from different clients reporting issues with the ad platform. Your task is to investigate, diagnose, and fix all reported issues.

## Support Tickets

### Ticket #1234 — TechMedia Publisher
**Priority:** High  
**Submitted:** 2025-01-15  
**Contact:** publisher@techmedia.com

> Hi support team,
> 
> We've integrated your ad platform on our website, but the ads are not loading at all. When users visit our site, they see an error message instead of the ad creative. This is affecting our revenue significantly.
> 
> We've checked our integration and everything looks correct on our end. The ad slot is properly placed and we're making the API calls as documented.
> 
> Please investigate and resolve this issue urgently.

### Ticket #1235 — FoodDaily Analytics Team
**Priority:** Medium  
**Submitted:** 2025-01-16  
**Contact:** analytics@fooddaily.com

> Hello,
> 
> We've noticed some discrepancies in our revenue reports and click tracking data. When we query the average revenue and CTR reports through the API, the numbers don't match what we're seeing in our internal analytics.
> 
> Specifically:
> - Some publishers are showing incorrect average revenue calculations
> - The data appears to be inflated in some cases
> 
> We need this resolved so we can provide accurate reports to our stakeholders.
> 
> Thanks!

## How to run
1. Build & up:
   ```bash
   docker-compose up --build
   ```
2. Frontend: http://localhost:8080 (Client's website)
   API: http://localhost:3000
3. Available endpoints:
   - GET /api/ad
   - GET /health
   - GET /reports/avg-revenue
   - GET /reports/ctr

## Additional Scenario: Investigating 503 Errors

**Scenario:** You receive reports that API requests to `/api/ad` and `/reports/*` endpoints are intermittently returning HTTP 503 (Service Unavailable) errors. This is affecting multiple clients and causing ad serving failures.

**Task:** Document the step-by-step investigation process you would follow to diagnose and resolve this issue. Include:

1. **Initial investigation steps**: What would you check first? 
2. **Diagnostic tools and commands**: What specific tools, commands, or queries would you use to gather information?
3. **Potential root causes**: What are the most likely causes of 503 errors in this architecture? 
4. **Resolution approach**: How would you verify the root cause and implement a fix?
5. **Prevention strategies**: What measures would you recommend to prevent similar issues in the future?

*Note: This is a theoretical scenario for assessment purposes. You don't need to implement this issue or fix it - only document your investigation methodology.*

## Deliverables
Please document your findings and the fixes you implement for both support tickets. Include:
- A summary of the issues you discovered for each ticket
- Your approach to diagnosing each issue and tools used/implemented
- The fixes you implemented
- Responses to both clients explaining the issues and resolutions
- Your investigation process for the 503 error scenario (see section above)
- Any recommendations for preventing similar issues in the future
- Extra recommendations of potential issues the current implementation could offer
- Overall improvements for the application 


Good luck!
