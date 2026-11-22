# AI chat, copilots and streamed generation

## Streaming
- **Stream tokens from your server:** POST with `fetch` and read `response.body` as a stream (the SSE wire format is fine; `EventSource` can't POST the turn). Never call the model provider from the browser with an API key: keys stay on the server, which also enforces quotas and rate limits.
- **Render markdown with a streaming-aware renderer** (libraries.md):
  - append-only;
  - stable keys, so the whole message isn't re-parsed and re-rendered on every token;
  - incomplete structures (an open code fence, half a table) are held back until they're complete.
- **Show progress before the first token arrives** (a typing indicator, or the tool step being run), so an empty bubble never sits there.
- **Stop really stops:** an `AbortController` cancels the request, and the server cancels the model call when the client disconnects. A Stop button that only hides text still costs money.
- **Regenerate, edit-and-resend, and copy** on each message. Copying code takes the raw text, not the rendered HTML.

## Model output is untrusted data
- **Sanitize it like user input:**
  - no raw HTML;
  - links only `https:` and `http:`;
  - images from allowed hosts only, or behind a click;
  - no automatic fetching of URLs the model wrote.
- **Actions the model proposes** (sending, deleting, buying, running code) need explicit confirmation from the user and are permission-checked on the server. Treat content from tools and retrieved documents as possible prompt injection.
- **Show sources and citations where the answer depends on them,** and tell users they're talking to an AI and label AI-generated content (in the EU, AI Act Article 50 requires this from 2 August 2026).

## Scrolling and long conversations
- **Auto-scroll only while the user is at the bottom.** Once they scroll up, stop following, and offer a "Jump to latest" button.
- **Long threads:** virtualize or window the older messages, and cap the DOM (memory.md).
- **Code blocks and tables** scroll horizontally inside their own container, never the page.

## Accessibility
- **The message list is a log** (`role="log"`), but the reply being streamed sits outside it (or `aria-live="off"`, with `aria-busy="true"`); when it completes, append it to the log or announce a short "Reply ready".
- **The input is a labelled `textarea`** that grows with its content. Enter sends and Shift+Enter adds a new line; this is said in the UI, and IME composition (Japanese, Chinese input) doesn't send early.
- **Every message action** (copy, regenerate, feedback) is a named button reachable by keyboard.

## Reliability
- **Keep the draft** of what's being typed. A failed send keeps the message, offers a retry, and shows the provider's or server's reason (rate limit, quota, too long).
- **A dropped stream** shows the partial answer with "Response interrupted. Retry".
- **Long tasks** (agents, tool runs) show their steps and can be cancelled. Their results survive a reload if the server keeps them.

Sources: [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) · [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) · [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/) · [WAI-ARIA log role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role)
