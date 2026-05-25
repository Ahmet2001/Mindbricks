

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 5 - MCP BFF Integration**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project's backend.

This document provides comprehensive instructions for integrating the **MCP BFF** (Model Context Protocol - Backend for Frontend) service into the frontend application. The MCP BFF is the central gateway between the frontend AI chat and all backend services.

---

## MCP BFF Architecture Overview

The Solvio application uses an **MCP BFF** service that aggregates multiple backend MCP servers into a single frontend-facing API. Instead of the frontend connecting to each service's MCP endpoint directly, it communicates exclusively through the MCP BFF.

```
┌────────────┐     ┌───────────┐     ┌─────────────────┐
│  Frontend   │────▶│  MCP BFF  │────▶│  Auth Service    │
│  (Chat UI)  │     │  :3005    │────▶│  Business Svc 1  │
│             │◀────│           │────▶│  Business Svc N  │
└────────────┘ SSE └───────────┘     └─────────────────┘
```

### Key Responsibilities

- **Tool Aggregation**: Discovers and registers tools from all connected MCP services
- **Session Forwarding**: Injects the user's `accessToken` into every MCP tool call
- **AI Orchestration**: Routes user messages to the AI model, which decides which tools to call
- **SSE Streaming**: Streams chat responses, tool executions, and results to the frontend in real-time
- **Elasticsearch**: Provides direct search/aggregation endpoints across all project indices
- **Logging**: Provides log viewing and real-time console streaming endpoints

## MCP BFF Service URLs

For the MCP BFF service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/mcpbff-api`
* **Staging:** `https://solvio-stage.mindbricks.co/mcpbff-api`
* **Production:** `https://solvio.mindbricks.co/mcpbff-api`

All endpoints below are relative to the MCP BFF base URL.

---

## Authentication

All MCP BFF endpoints require authentication. The user's access token (obtained from the Auth service login) must be included in every request:

```js
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
};
```

For multi-tenant access, include the tenant codename header:

```js
headers['mbx-school-codename'] = schoolCodename;
```

Resolve `schoolCodename` from frontend routing context (URL prefix in preview/test, subdomain in production) and forward it in all MCP BFF calls.
Frontend URL/subdomain is only for tenant selection; backend tenant targeting must always be done with this header.

---

## Chat API (AI Interaction)

The chat API is the primary interface for AI-powered conversations. It supports both regular HTTP responses and **SSE streaming** for real-time output.

### POST /api/chat — Regular Chat

Send a message and receive the complete AI response.

```js
const response = await fetch(`${mcpBffUrl}/api/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Show me all orders from last week",
    conversationId: "optional-conversation-id",  // for conversation context
    context: {}  // additional context
  }),
});
```

### POST /api/chat/stream — SSE Streaming Chat (Recommended)

Stream the AI response in real-time. This is the recommended approach for chat UIs as it provides immediate feedback.

```js
const response = await fetch(`${mcpBffUrl}/api/chat/stream`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Create a new product called Widget",
    conversationId: conversationId,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      const eventType = line.slice(7).trim();
      // Handle event type
    }
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // Handle event data
    }
  }
}
```

### SSE Event Types

The streaming endpoint emits the following event types:

| Event | Description | Data |
|-------|-------------|------|
| `start` | Stream started | `{ conversationId }` |
| `text` | AI text chunk | `{ text: "partial response..." }` |
| `tool_start` | AI is calling a tool | `{ toolName, toolArgs }` |
| `tool_executing` | Tool is being executed | `{ toolName }` |
| `tool_result` | Tool execution completed | `{ toolName, result }` — **check for `__frontendAction`** |
| `error` | Error occurred | `{ error: "message" }` |
| `done` | Stream completed | `{ conversationId, fullResponse }` |

### Handling `__frontendAction` in Tool Results

When the AI calls certain tools (e.g., payment, secret reveal), the tool result may contain a `__frontendAction` object. This signals the frontend to render a special UI component instead of displaying raw tool output.

```js
// In your SSE handler for 'tool_result' events:
function handleToolResult(data) {
  const action = extractFrontendAction(data.result);
  if (action) {
    // Render ActionCard component with this action
    renderActionCard(action);
  } else {
    // Display raw tool result as JSON or formatted text
    displayToolResult(data);
  }
}

// Extract __frontendAction from various response formats
function extractFrontendAction(result) {
  if (!result) return null;
  if (result.__frontendAction) return result.__frontendAction;
  
  // Unwrap MCP wrapper format
  let data = result;
  if (result?.result?.content) data = result.result;
  
  if (data?.content && Array.isArray(data.content)) {
    const textContent = data.content.find(c => c.type === 'text');
    if (textContent?.text) {
      try {
        const parsed = JSON.parse(textContent.text);
        if (parsed?.__frontendAction) return parsed.__frontendAction;
      } catch { /* not JSON */ }
    }
  }
  return null;
}
```

### Frontend Action Types

| Action Type | Component | Description |
|-------------|-----------|-------------|
| `payment` | `PaymentActionCard` | "Pay Now" button that opens Stripe checkout modal |

#### Payment Action (`type: "payment"`)

Triggered by the `initiatePayment` MCP tool. Renders a payment card with amount and a "Pay Now" button.

```json
{
  "__frontendAction": {
    "type": "payment",
    "orderId": "uuid",
    "orderType": "order",
    "serviceName": "commerce",
    "amount": 99.99,
    "currency": "USD",
    "description": "Order #abc123"
  }
}
```


### Conversation Management

```js
// List user's conversations
GET /api/chat/conversations

// Get conversation history
GET /api/chat/conversations/:conversationId

// Delete a conversation
DELETE /api/chat/conversations/:conversationId
```

---

## MCP Tool Discovery & Direct Invocation

The MCP BFF exposes endpoints for discovering and directly calling MCP tools (useful for debugging or building custom UIs).

### GET /api/tools — List All Tools

```js
const response = await fetch(`${mcpBffUrl}/api/tools`, { headers });
const { tools, count } = await response.json();
// tools: [{ name, description, inputSchema, service }, ...]
```

### GET /api/tools/service/:serviceName — List Service Tools

```js
const response = await fetch(`${mcpBffUrl}/api/tools/service/commerce`, { headers });
const { tools } = await response.json();
```

### POST /api/tools/call — Call a Tool Directly

```js
const response = await fetch(`${mcpBffUrl}/api/tools/call`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    toolName: "listProducts",
    args: { page: 1, limit: 10 },
  }),
});
const result = await response.json();
```

### GET /api/tools/status — Connection Status

```js
const status = await fetch(`${mcpBffUrl}/api/tools/status`, { headers });
// Returns health of each MCP service connection
```

### POST /api/tools/refresh — Reconnect Services

```js
await fetch(`${mcpBffUrl}/api/tools/refresh`, { method: 'POST', headers });
// Reconnects to all MCP services and refreshes the tool registry
```

---

## Elasticsearch API

The MCP BFF provides direct access to Elasticsearch for searching, filtering, and aggregating data across all project indices.

All Elasticsearch endpoints are under `/api/elastic`.

### GET /api/elastic/allIndices — List Project Indices

Returns all Elasticsearch indices belonging to this project (prefixed with `solvio_`).

```js
const indices = await fetch(`${mcpBffUrl}/api/elastic/allIndices`, { headers });
// ["solvio_products", "solvio_orders", ...]
```

### POST /api/elastic/:indexName/rawsearch — Raw Elasticsearch Query

Execute a raw Elasticsearch query on a specific index.

```js
const response = await fetch(`${mcpBffUrl}/api/elastic/products/rawsearch`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    query: {
      bool: {
        must: [
          { match: { status: "active" } },
          { range: { price: { gte: 10, lte: 100 } } }
        ]
      }
    },
    size: 20,
    from: 0,
    sort: [{ createdAt: "desc" }]
  }),
});
const { total, hits, aggregations, took } = await response.json();
// hits: [{ _id, _index, _score, _source: { ...document... } }, ...]
```

Note: The index name is automatically prefixed with `solvio_` if not already prefixed.

### POST /api/elastic/:indexName/search — Simplified Search

A higher-level search API with built-in support for filters, sorting, and pagination.

```js
const response = await fetch(`${mcpBffUrl}/api/elastic/products/search`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    search: "wireless headphones",           // Full-text search
    filters: { status: "active" },           // Field filters
    sort: { field: "createdAt", order: "desc" },
    page: 1,
    limit: 25,
  }),
});
```

### POST /api/elastic/:indexName/aggregate — Aggregations

Run aggregation queries for analytics and dashboards.

```js
const response = await fetch(`${mcpBffUrl}/api/elastic/orders/aggregate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    aggs: {
      status_counts: { terms: { field: "status.keyword" } },
      total_revenue: { sum: { field: "amount" } },
      monthly_orders: {
        date_histogram: { field: "createdAt", calendar_interval: "month" }
      }
    },
    query: { range: { createdAt: { gte: "now-1y" } } }
  }),
});
```

### GET /api/elastic/:indexName/mapping — Index Mapping

Get the field mapping for an index (useful for building dynamic filter UIs).

```js
const mapping = await fetch(`${mcpBffUrl}/api/elastic/products/mapping`, { headers });
```

### POST /api/elastic/:indexName/ai-search — AI-Assisted Search

Uses the configured AI model to convert a natural-language query into an Elasticsearch query.

```js
const response = await fetch(`${mcpBffUrl}/api/elastic/orders/ai-search`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    query: "orders over $100 from last month that are still pending",
  }),
});
// Returns: { total, hits, generatedQuery, ... }
```

---

## Log API

The MCP BFF provides log viewing endpoints for monitoring application behavior.

### GET /api/logs — Query Logs

```js
const response = await fetch(`${mcpBffUrl}/api/logs?page=1&limit=50&logType=2&service=commerce&search=payment`, {
  headers,
});
```

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 50)
- `logType` — 0=INFO, 1=WARNING, 2=ERROR
- `service` — Filter by service name
- `search` — Search in subject and message
- `from` / `to` — Date range (ISO strings)
- `requestId` — Filter by request ID

### GET /api/logs/stream — Real-time Console Stream (SSE)

Streams real-time console output from all services via Server-Sent Events.

```js
const eventSource = new EventSource(`${mcpBffUrl}/api/logs/stream?services=commerce,auth`, {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

eventSource.addEventListener('log', (event) => {
  const logEntry = JSON.parse(event.data);
  // { service, timestamp, level, message, ... }
});
```

---


## Available Services

The MCP BFF connects to the following backend services:

| Service | Description |
|---------|-------------|
| `auth` | Authentication, user management, sessions |
| `aiAgent` | Manages multimodal agent sessions, wake word, command parsing, and action orchestration for Solvio. Logs all agent interactions and command tool usage for analytics and reference. |
| `classAssignment` | Manages digital classrooms, student enrollments, and assignment distribution within tenant schools for Solvio. Supports invitation-based and independent study models. Allows teachers to orchestrate class rosters, groupings, and targeted assignments across all skill areas. |
| `languageProfile` | Handles user CEFR proficiency detection, historical tracking, and analytics-ready storage of language level progression for Solvio. Syncs level updates from all skill labs and provides a secure, audit-compliant language profile and history per user. Enables dashboards, recommendations, and class/tenant-level analytics. |
| `listeningLab` | Handles dynamic creation, assignment, and evaluation of listening exercises (including comprehension quizzes) for Solvio. Supports AI-based generation of multi-speaker audio, quiz management, auto-scoring, and feedback for class/assignment and independent practice use cases. |
| `personalVocabulary` | Handles per-user vocabulary lists, contextual word lookups (definitions/examples), tracks vocabulary review stats, and supports teacher/agent word recommendations. Multi-tenant, fully isolated; integrates with language labs and agent modules. |
| `readingLab` | Provides access to a CEFR-leveled reading passage library, enables AI-based custom reading text generation, manages reading assignments and open-ended answers, and stores scoring/feedback for each user. Integrates with classroom, assignment, and multi-tenant structures. |
| `speakingLab` | Handles initiation and management of real-time speaking practice sessions, AI analysis/feedback on spoken English, and stores detailed analytics for review. Supports scenario-based practice, AI-driven scoring and feedback (including model audio), with integration to assignment and classroom modules. |
| `writingLab` | Handles student writing submissions, AI evaluations/feedback, and teacher feedback for written assignments, with support for image/OCR, multilingual feedback, and analytics. Accepts both digital text and handwriting (via image+OCR), stores detailed feedback and scoring, and enables teacher review and comments, with full tenant and user data isolation. |

Each service exposes MCP tools that the AI can call through the BFF. Use `GET /api/tools` to discover all available tools at runtime, or `GET /api/tools/service/:serviceName` to list tools for a specific service.

---

**After this prompt, the user may give you new instructions to update the output of this prompt or provide subsequent prompts about the project.**
