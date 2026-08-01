package pages

// Code generated from shadcn/ui apps/v4/app/(app)/(typeset)/lib/fixtures/*.ts
// (the typeset preview content fixtures), HTML extracted verbatim. The chat
// question is page chrome rendered outside the typeset container (chat.ts
// CHAT_QUESTION).

// chat.ts CHAT_QUESTION.
const typesetChatQuestion = "My Next.js dev server takes forever to start. How do I figure out what's actually slow?"

// lib/fixtures/index.ts FIXTURES.
var typesetFixtures = map[string]string{
	"docs": `
<h1>Building a Streaming Chatbot</h1>
<p>The <code>useChat</code> hook makes it effortless to create a conversational user interface for your chatbot application. It enables the streaming of chat messages from your AI provider, manages the chat state, and updates the UI automatically as new messages arrive.</p>
<p>To summarize, the <code>useChat</code> hook provides the following features:</p>
<ul>
<li><strong>Message Streaming</strong>: All the messages from the AI provider are streamed to the chat UI in real-time.</li>
<li><strong>Managed States</strong>: The hook manages the states for input, messages, status, error and more for you.</li>
<li><strong>Seamless Integration</strong>: Easily integrate your chat AI into any design or layout with minimal effort.</li>
</ul>
<p>In this guide, you will learn how to use the <code>useChat</code> hook to create a chatbot application with real-time message streaming. Check out our <a href="/docs/ai-sdk-ui/chatbot-tool-usage">chatbot with tools guide</a> to learn how to use tools in your chatbot.</p>
<h2>Example</h2>
<p>The request flow works like this:</p>
<ol>
<li>The user submits a message and <code>sendMessage</code> posts it to your API route.</li>
<li>Your route calls the provider and returns a UI message stream.</li>
<li>The hook appends chunks to the last message as they arrive, re-rendering as it goes.</li>
</ol>
<pre><code>'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, sendMessage, status } = useChat();

  return (
    &lt;&gt;
      {messages.map(message =&gt; (
        &lt;Message key={message.id} message={message} /&gt;
      ))}
      &lt;ChatInput
        onSubmit={text =&gt; sendMessage({ text })}
        disabled={status !== 'ready'}
      /&gt;
    &lt;/&gt;
  );
}</code></pre>
<pre><code>import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}</code></pre>
<blockquote><p>The UI messages have a new <code>parts</code> property that contains the message parts. We recommend rendering the messages using the <code>parts</code> property instead of the <code>content</code> property. The parts property supports different message types, including text, tool invocation, and tool result, and allows for more flexible and complex chat UIs.</p></blockquote>
<p>In the <code>Page</code> component, the <code>useChat</code> hook will request to your AI provider endpoint whenever the user sends a message using <code>sendMessage</code>. The messages are then streamed back in real-time and displayed in the chat UI.</p>
<h2>Customized UI</h2>
<p><code>useChat</code> also provides ways to manage the chat message states via code, show status, and update messages without being triggered by user interactions.</p>
<h3>Status</h3>
<p>The <code>useChat</code> hook returns a <code>status</code>. It has the following possible values:</p>
<ul>
<li><code>submitted</code>: The message has been sent to the API and we're awaiting the start of the response stream.</li>
<li><code>streaming</code>: The response is actively streaming in from the API, receiving chunks of data.</li>
<li><code>ready</code>: The full response has been received and processed; a new user message can be submitted.</li>
<li><code>error</code>: An error occurred during the API request, preventing successful completion.</li>
</ul>
<pre><code>const { messages, sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

// ...

{(status === 'submitted' || status === 'streaming') &amp;&amp; (
  &lt;div&gt;
    {status === 'submitted' &amp;&amp; &lt;Spinner /&gt;}
    &lt;button type="button" onClick={() =&gt; stop()}&gt;
      Stop
    &lt;/button&gt;
  &lt;/div&gt;
)}</code></pre>
<h3>Error State</h3>
<p>Similarly, the <code>error</code> state reflects the error object thrown during the fetch request. It can be used to display an error message, disable the submit button, or show a retry button:</p>
<blockquote><p>We recommend showing a generic error message to the user, such as "Something went wrong." This is a good practice to avoid leaking information from the server.</p></blockquote>
<pre><code>const { messages, sendMessage, error, regenerate } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

// ...

{error &amp;&amp; (
  &lt;&gt;
    &lt;div&gt;An error occurred.&lt;/div&gt;
    &lt;button type="button" onClick={() =&gt; regenerate()}&gt;
      Retry
    &lt;/button&gt;
  &lt;/&gt;
)}</code></pre>
<h3>Cancellation and regeneration</h3>
<p>It's also a common use case to abort the response message while it's still streaming back from the AI provider. You can do this by calling the <code>stop</code> function returned by the <code>useChat</code> hook.</p>
<pre><code>const { stop, status } = useChat();

&lt;button
  onClick={stop}
  disabled={!(status === 'streaming' || status === 'submitted')}
&gt;
  Stop
&lt;/button&gt;</code></pre>
<hr>
<h2>API reference</h2>
<h3>useChat(options)</h3>
<p>Creates a chat helper. All options are optional; the defaults talk to <code>/api/chat</code> and render at native stream speed.</p>
<table>
  <thead>
    <tr><th>Prop</th><th>Type</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><code>transport</code></td><td><code>ChatTransport&lt;UIMessage&gt;</code></td><td>How messages reach your API route</td></tr>
    <tr><td><code>messages</code></td><td><code>UIMessage[]</code></td><td>Initial messages to seed the conversation</td></tr>
    <tr><td><code>onFinish</code></td><td><code>(event: FinishEvent) =&gt; void</code></td><td>Runs when the assistant response completes</td></tr>
    <tr><td><code>onError</code></td><td><code>(error: Error) =&gt; void</code></td><td>Runs when the fetch request fails</td></tr>
    <tr><td><code>throttle</code></td><td><code>number</code></td><td>Milliseconds between UI updates while streaming</td></tr>
  </tbody>
</table>
<h2>Event Callbacks</h2>
<p><code>useChat</code> provides optional event callbacks that you can use to handle different stages of the chatbot lifecycle:</p>
<ul>
<li><code>onFinish</code>: Called when the assistant response is completed. The event includes the response message, all messages, and flags for abort, disconnect, and errors.</li>
<li><code>onError</code>: Called when an error occurs during the fetch request.</li>
<li><code>onData</code>: Called whenever a data part is received.</li>
</ul>
<p>These callbacks can be used to trigger additional actions, such as logging, analytics, or custom UI updates.</p>
<pre><code>const { messages } = useChat({
  onFinish: ({ message }) =&gt; saveToHistory(message),
  onError: error =&gt; console.error(error),
});</code></pre>
<hr>
<h2>Math</h2>
<p>Display math sits in the flow rhythm and scrolls when it runs long. Inline math like <math><msup><mi>e</mi><mrow><mi>i</mi><mi>π</mi></mrow></msup><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></math> rides the line without stretching it.</p>
<h3>Display</h3>
<p>The quadratic formula, as a block:</p>
<math display="block">
  <mi>x</mi><mo>=</mo>
  <mfrac>
    <mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><mrow><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></mrow></msqrt></mrow>
    <mrow><mn>2</mn><mi>a</mi></mrow>
  </mfrac>
</math>
<p>Prose continues after the block at the normal distance, so equations read as part of the argument, not decoration.</p>
<h3>Overflow</h3>
<p>A long expansion scrolls inside its own box instead of breaking the column:</p>
<math display="block">
  <msup><mrow><mo>(</mo><mi>a</mi><mo>+</mo><mi>b</mi><mo>)</mo></mrow><mn>4</mn></msup><mo>=</mo>
  <msup><mi>a</mi><mn>4</mn></msup><mo>+</mo>
  <mn>4</mn><msup><mi>a</mi><mn>3</mn></msup><mi>b</mi><mo>+</mo>
  <mn>6</mn><msup><mi>a</mi><mn>2</mn></msup><msup><mi>b</mi><mn>2</mn></msup><mo>+</mo>
  <mn>4</mn><mi>a</mi><msup><mi>b</mi><mn>3</mn></msup><mo>+</mo>
  <msup><mi>b</mi><mn>4</mn></msup>
</math>
`,
	"chat": `
<p>Slow dev startup in Next.js almost always comes down to one of three things: module count, heavy config work at boot, or something outside the compiler entirely. Here's how to narrow it down fast.</p>
<h3>1. Get a baseline</h3>
<p>Start the server with profiling on and note the two numbers it prints:</p>
<pre><code>NEXT_TURBOPACK_TRACING=1 next dev</code></pre>
<ul>
<li><strong>Startup time</strong>: everything before "Ready". Config loading, env files, plugins.</li>
<li><strong>First compile</strong>: the time after you hit a route. Module graph size lives here.</li>
</ul>
<h3>2. Check the usual suspects</h3>
<table>
<thead>
<tr><th>Symptom</th><th>Likely cause</th></tr>
</thead>
<tbody>
<tr><td>Slow before "Ready"</td><td>Heavy <code>next.config</code>, sync I/O in config, large <code>.env</code> cascade</td></tr>
<tr><td>Slow first page</td><td>Barrel files pulling in whole icon or UI libraries</td></tr>
<tr><td>Slow every save</td><td>Type checking or lint running in the dev loop</td></tr>
</tbody>
</table>
<p>The barrel-file one is the classic. A single <code>import { Check } from "lucide-react"</code> through a barrel can pull thousands of modules into the graph. Fix it with:</p>
<pre><code>// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@acme/ui"],
  },
}</code></pre>
<h3>3. Measure, don't guess</h3>
<p>If neither jumps out, generate a trace and look at the actual spans:</p>
<pre><code>next dev
# reproduce the slow start, then:
next internal trace .next/trace</code></pre>
<blockquote><p>Compare against a bare <code>create-next-app</code> on the same machine first. If that's also slow, the problem is your machine or antivirus scanning <code>node_modules</code>, not your app.</p></blockquote>
<p>Want to paste the first few lines of your trace output? I can point at the exact span that's eating the time.</p>
`,
	"article": `
<h1>A Morning at the Letterpress Museum</h1>
<p>The first thing you notice is the smell: machine oil, paper dust, and a century of ink that never fully dries. The second thing is the sound. A working letterpress shop is not quiet, and the museum on Greer Street keeps three presses working, because, as the docent told me within a minute of my arrival, <em>a silent press is just furniture</em>.</p>
<p>I went because I write software that arranges text on screens, and I had started to suspect that everything hard about my job had been solved a hundred years ago by people with steel tools and no undo. I left four hours later with ink on my sleeve and a notebook full of confirmations.</p>
<figure>
  <img class="grayscale dark:brightness-50" src="https://images.unsplash.com/photo-1629968417841-d87296c4205b?q=80&amp;w=1200&amp;h=675&amp;fit=crop" alt="Textured surface, worn by use." width="1200" height="675">
  <figcaption>Ink before it becomes language.</figcaption>
</figure>
<h2>The composing room</h2>
<p>Type lives in shallow wooden drawers called cases, and the layout of a case is itself a piece of interface design: the letters you reach for most sit nearest your hand, in the biggest compartments. Nobody alphabetized them. The arrangement was settled by frequency, argued over for a generation, and then never changed again, which is roughly the story of every good default I have ever shipped.</p>
<p>A compositor working at full speed sets about two thousand characters an hour, reading the manuscript with one eye while the other confirms each pick. The docent, a retired compositor named <strong>Ruth Okafor</strong>, demonstrated without looking down once. When I asked how long that took to learn she said, "The hands take a year. Knowing when a line is wrong takes ten."</p>
<blockquote>
  <p>Every em of space in this room is a physical object. You want more air between two lines, you go get the lead and you carry it back. It keeps your opinions about spacing very honest.</p>
</blockquote>
<p>That line rearranged something in my head. The strips of lead that printers wedged between lines of type are why we still say <a href="#">leading</a>. On my screen, spacing is a number I can change in a keystroke, and so I change it constantly, carelessly. Ruth's shop had exactly four widths of lead, and the whole trade agreed on them, and a hundred years of books came out beautiful anyway. Constraint was not the obstacle to the craft. It was the craft.</p>
<h2>What the metal knows</h2>
<figure>
  <img class="grayscale dark:brightness-50" src="https://images.unsplash.com/photo-1637325258040-d2f09636ecf6?q=80&amp;w=900&amp;h=1200&amp;fit=crop" alt="Recycled paper, up close." width="900" height="1200">
  <figcaption>Space is material.</figcaption>
</figure>
<p>Three things the metal insists on, which screens let us forget:</p>
<ul>
  <li><strong>Space is material.</strong> Word spaces, line leads, and margins are objects with widths. Nothing is "auto." Someone chose everything.</li>
  <li><strong>Hierarchy is expensive.</strong> Changing size means walking to a different case. Printers built emphasis from weight and space first because size was the costly move, and their pages read better for it.</li>
  <li><strong>The page is finished before it is printed.</strong> A locked-up chase either holds together or it doesn't. There is a satisfying finality to it that no deploy has ever given me.</li>
</ul>
<p>None of this is nostalgia, or not only. The constraints were real costs, and digital type was right to remove them. But removal has a second-order effect: when nothing is expensive, nothing forces a decision, and unforced decisions drift. The printers' defaults survived because changing them was work. Ours have to survive on discipline, which is a weaker material.</p>
<hr>
<h2>Field notes</h2>
<p>Practical things I wrote down, in the order I wrote them:</p>
<ol>
  <li>Ruth sets solid (no leading) only for lines shorter than the alphabet. Anything longer gets air. Our line-length rules agree, which pleased me more than it should have.</li>
  <li>The shop's "house style" fits on an index card taped inside a cabinet door. Four leads, two faces, three sizes. An entire design system, physically enumerable.</li>
  <li>Apprentices learn distribution (putting type away) before composition. You learn a system by returning things to it.</li>
</ol>
<p>The museum runs open studio on the first Saturday of every month, and they will let you set your own name if you ask. Mine came out crooked. Ruth looked at it for a moment and said it was a common beginner's error: I had been so careful choosing the letters that I forgot to check the spaces. I have been thinking about that all week.</p>
<p><em>The Greer Street Press Museum is open Thursday through Sunday. If you go, bring a jacket; the composing room is kept cold for the metal.</em></p>
`,
	"changelog": `
<h1>Changelog</h1>
<h2>v2.4.0</h2>
<p><em>June 18, 2026</em></p>
<ul>
  <li><strong>Added:</strong> <code>store.batch(fn)</code> groups multiple writes into a single notification. Listeners observe only the final state.</li>
  <li><strong>Added:</strong> a <code>name</code> option for devtools traces; anonymous stores now display as <code>store#3</code> instead of <code>undefined</code>.</li>
  <li><strong>Changed:</strong> selectors are memoized per subscriber, cutting re-render counts roughly in half on wide stores.</li>
  <li><strong>Fixed:</strong> subscribing during a notification no longer skips the next update.</li>
  <li><strong>Fixed:</strong> <code>equals</code> is respected for the initial <code>useStore</code> read, matching the documented behavior.</li>
</ul>
<h3>Breaking changes</h3>
<p>The deprecated <code>store.update()</code> alias is removed. Replace it with <code>store.set()</code>; the signature is identical:</p>
<pre><code>- store.update((s) =&gt; ({ count: s.count + 1 }))
+ store.set((s) =&gt; ({ count: s.count + 1 }))</code></pre>
<h2>v2.3.1</h2>
<p><em>May 30, 2026</em></p>
<ul>
  <li><strong>Fixed:</strong> a race where two synchronous writes in the same tick could notify in reverse order under React’s concurrent rendering.</li>
  <li><strong>Docs:</strong> clarified that stores must be hoisted out of components, with a lint rule to catch it.</li>
</ul>
<h2>v2.3.0</h2>
<p><em>May 12, 2026</em></p>
<ul>
  <li><strong>Added:</strong> React Native support; <code>useStore</code> no longer touches <code>window</code>.</li>
  <li><strong>Deprecated:</strong> <code>store.update()</code>, removed in v2.4.0. A console warning links to the migration note.</li>
  <li><strong>Performance:</strong> subscription bookkeeping moved from an array to a Set; unsubscribe is now O(1).</li>
</ul>
`,
	"notes": `
<h1>Platform sync: week 27</h1>
<p><em>July 3, 2026 · 25 min · recording available</em></p>
<h2>Decisions</h2>
<ul>
  <li>Ship the streaming endpoint behind a flag on Tuesday; full rollout gated on the p95 latency holding under 800ms for 48 hours.</li>
  <li>Adopt cursor pagination for the activity feed. Offset stays on the admin tables only, capped at page 500.</li>
  <li>Postpone the queue migration to Q3. Nobody could name a current failure it fixes.</li>
</ul>
<h2>Action items</h2>
<ul class="contains-task-list">
  <li class="task-list-item"><input type="checkbox" checked disabled> <strong>Mia:</strong> flag config + kill switch for the streaming endpoint</li>
  <li class="task-list-item"><input type="checkbox" disabled> <strong>Devon:</strong> latency dashboard with the 800ms line drawn on it</li>
  <li class="task-list-item"><input type="checkbox" disabled> <strong>Sam:</strong> write the cursor encoding RFC, one page max</li>
  <li class="task-list-item"><input type="checkbox" disabled> <strong>Priya:</strong> close out the three stale runbook pages before Friday</li>
</ul>
<h2>Discussion</h2>
<ul>
  <li>Streaming rollout
    <ul>
      <li>Retry behavior on disconnect is still client-defined; server sends <code>retry-after</code> but nobody reads it.</li>
      <li>Agreement: the SDK should honor it, apps that hand-roll fetch are on their own.
        <ul>
          <li>Devon volunteered to add it to the SDK changelog as a “behavior change” callout.</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>On-call load
    <ul>
      <li>Pages are down 40% since the alert dedup work. Two of the remaining alerts are known-noisy and owned by nobody.</li>
      <li>Priya takes both; if they can’t be fixed in an hour each, they get deleted.</li>
    </ul>
  </li>
</ul>
<blockquote>
  <p>“If an alert has fired twelve times and been actioned zero times, it isn’t an alert, it’s a screensaver.”</p>
</blockquote>
`,
	"recipe": `
<h1>Overnight focaccia</h1>
<p>This is the low-effort, high-reward version: no mixer, no kneading, one bowl, and most of the work happens while you sleep. The dough is wet by bread standards, around 80% hydration, which is exactly what produces the open crumb and the crackly, olive-oil-fried bottom.</p>
<h2>Ingredients</h2>
<ul>
  <li>500g bread flour</li>
  <li>400g lukewarm water</li>
  <li>10g fine sea salt</li>
  <li>4g instant yeast (about 1¼ teaspoons)</li>
  <li>40g olive oil, plus more for the pan, your hands, and your conscience</li>
  <li>Flaky salt and two sprigs of rosemary, to finish</li>
</ul>
<h2>Method</h2>
<ol>
  <li>
    <p>Whisk the yeast into the water. Add the flour and fine salt and stir with a spatula until no dry flour remains, about two minutes. It will look shaggy and wrong. It is neither.</p>
  </li>
  <li>
    <p>Cover the bowl and leave it on the counter for 30 minutes, then perform one set of folds: wet your hand, grab the far edge of the dough, stretch it up, and press it into the middle. Rotate the bowl a quarter turn and repeat four times.</p>
  </li>
  <li>
    <p>Cover and refrigerate overnight, 12 to 18 hours. The cold ferment is where the flavor comes from; do not rush this step with a warm rise unless you enjoy bland bread.</p>
  </li>
  <li>
    <p>Pour 2 tablespoons of olive oil into a 9×13 metal pan. Fold the dough onto itself twice in the bowl, then transfer it seam-side down into the pan. Turn it once to coat, cover, and let it relax for 3 to 4 hours at room temperature, until it fills the pan and jiggles.</p>
  </li>
  <li>
    <p>Heat the oven to 230°C (450°F). Oil your fingers and dimple the dough firmly, all the way to the bottom of the pan. Scatter the rosemary and flaky salt. Bake 22 to 26 minutes until deeply golden.</p>
  </li>
  <li>
    <p>Lift it out of the pan onto a rack within five minutes, or the fried bottom you worked for will steam itself soft.</p>
  </li>
</ol>
<blockquote>
  <p>The dimpling is not decorative. It redistributes the gas so the crumb bakes even; skip it and the middle domes like a loaf that has something to prove.</p>
</blockquote>
<h3>Variations</h3>
<ul>
  <li>Halved cherry tomatoes, pressed in cut-side up before baking</li>
  <li>Thinly sliced potato and thyme, shingled like roof tiles</li>
  <li>A whole head of roasted garlic, smashed and dotted across the top</li>
</ul>
`,
	"elements": `
<h1>Streaming markdown to a million sessions</h1>
<p>Six months ago we rewrote how assistant messages render, and this is the retrospective we wish we could have read first. The short version: the parser was never the problem, the <em>typography</em> was, and the fixes that mattered were <strong>boring, measurable, and CSS-shaped</strong>. We <del>estimated two weeks</del> spent six, and the difference was all edge cases.</p>
<p>Everything below comes from production traffic against our completions endpoint (<a href="#">https://api.example.com/v1/organizations/org_2f8a91c/deployments/dep_09xkq/streaming-completions?include_usage=true&amp;format=sse</a>), rendered by the same stylesheet you’re reading now.<sup><a href="#fn1" id="ref1">1</a></sup></p>
<h2>The setup</h2>
<p>Messages arrive as <abbr title="Server-Sent Events">SSE</abbr> and render token by token. The renderer repairs unterminated markdown; the stylesheet’s only job is to keep already-painted content perfectly still while new content arrives below it. The whole contract fits in one handler:</p>
<pre><code>export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({ model, messages })
  return result.toDataStreamResponse()
}</code></pre>
<p>Every block above the insertion point must keep its computed styles byte-for-byte identical across appends. We test exactly that, and press <kbd>⌘</kbd> <kbd>K</kbd> in the playground to replay any captured stream against the assertion.</p>
<h2>What the data said</h2>
<p>We captured 40,000 assistant replies and counted what models actually emit. The distribution surprised us; <mark>deep headings and tables are not rare events</mark>, they’re Tuesday.</p>
<table>
  <thead>
    <tr>
      <th>Element</th>
      <th align="right">Percentage</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Lists</th>
      <td align="right">78.4</td>
      <td>Nesting to three levels is common</td>
    </tr>
    <tr>
      <th scope="row">Code blocks</th>
      <td align="right">41.2</td>
      <td>Half specify no language tag at all</td>
    </tr>
    <tr>
      <th scope="row">Tables</th>
      <td align="right">17.9</td>
      <td>Comparison questions produce 40-column monsters</td>
    </tr>
    <tr>
      <th scope="row">Headings</th>
      <td align="right">12.6</td>
      <td>Models outline far deeper than humans do</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Any block element</th>
      <td align="right">94.1</td>
      <td>Plain-paragraph-only replies are the rare case</td>
    </tr>
  </tfoot>
</table>
<p>That last row is why the bottom of the heading scale exists at all.<sup><a href="#fn2" id="ref2">2</a></sup> Nobody designs h6 for people; you design it for machines that never learned restraint.</p>
<figure>
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='%23EAEAEA' rx='6'/%3E%3Cpath d='M80 470 L280 380 L480 420 L680 260 L880 300 L1120 160' stroke='%23BDBDBD' stroke-width='8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" alt="Latency dashboard the morning after rollout" width="1200" height="630">
  <figcaption>Figure 1. The morning after rollout: style recalculation cost per token, before and after the append-stable rules landed.</figcaption>
</figure>
<h2>Three mistakes we made</h2>
<h3>We trusted margin collapsing</h3>
<p>Our first spacing model used symmetric margins and let the browser deduplicate them. Then a designer wrapped messages in a flex column and every paragraph gap silently doubled. Single-direction margins fixed it everywhere at once:</p>
<ol>
  <li>Space belongs above blocks, and only above.</li>
  <li>Headings own the gap beneath them, so following content never negotiates.</li>
  <li>Nothing, anywhere, sets a bottom margin.</li>
</ol>
<h3>We styled the last row</h3>
<p>Tables drew their border under the final row, which meant every streamed row restyled the previous one on arrival. Users reported it as “the table flickers while it types.” The fix was embarrassingly small:</p>
<ul>
  <li>Borders go <em>between</em> rows (<code>tr + tr</code>), never after the last one
    <ul>
      <li>The same rule saved us again on blockquote citations and list dividers</li>
    </ul>
  </li>
  <li>Selectors may look backward at earlier siblings, never forward</li>
</ul>
<h3>We ignored the quiet feedback</h3>
<blockquote>
  <p>The new answers feel calmer, and I can’t tell you why. I just stopped noticing the formatting.</p>
  <p>That was the entire review. It’s still the best QA signal we’ve ever received, because typography you notice is typography that failed.</p>
</blockquote>
<h2>The checklist we run now</h2>
<p>Before any typography change ships, a release candidate has to clear the same four gates, in order:</p>
<ul class="contains-task-list">
  <li class="task-list-item"><input type="checkbox" checked disabled> Append-stability suite passes on all captured streams</li>
  <li class="task-list-item"><input type="checkbox" checked disabled> Reads correctly at <code>text-sm</code> inside a bubble and at 16px full width</li>
  <li class="task-list-item"><input type="checkbox" checked disabled> Squint test shows even gray, no hotspots</li>
  <li class="task-list-item"><input type="checkbox" disabled> Sixty seconds of sustained reading by someone who didn’t write it</li>
</ul>
<details>
  <summary>How we capture the streams for the suite</summary>
  <p>Every failed render in production writes its raw token sequence to a bucket. The suite replays each capture twice, once all at once and once token by token, and diffs the computed styles of everything that was on screen before the last token arrived.</p>
  <pre><code>replay: captures
	bun run suite --replay captures/ --diff computed

captures:
	bun run capture --since yesterday --failures-only</code></pre>
</details>
<hr>
<h2>Appendix</h2>
<h4>Glossary</h4>
<dl>
  <dt>flow</dt>
  <dd>The rhythm unit: one em-based value that spaces every block from the one before it.</dd>
  <dt>measure</dt>
  <dd>Line length in average characters. Not the CSS <code>ch</code> unit, which overcounts by roughly a third.</dd>
</dl>
<h4>Reference notes</h4>
<h5>On the numbers in this post</h5>
<p>Percentages are per-reply presence, not token share. A reply containing one table and one list counts once in each row.</p>
<h6>Revision history</h6>
<p>Corrected the p95 code-block count<sup><a href="#fn3" id="ref3">3</a></sup> and added the flex-column incident after two readers asked whether “boring, measurable, and CSS-shaped” was a typo. It wasn’t.</p>
<section data-footnotes class="footnotes">
  <ol>
    <li id="fn1"><p>Endpoint anonymized. The path structure is real; the org is not. <a href="#ref1">↩</a></p></li>
    <li id="fn2"><p>Specifically the reply that contained fourteen h6 elements and zero h1–h3. <a href="#ref2">↩</a></p></li>
    <li id="fn3"><p>The original draft said nine; the correct p95 is seven. <a href="#ref3">↩</a></p></li>
  </ol>
</section>
`,
	"tailwind": `
<h1>Tailwind Typography</h1>
<p>By default, Tailwind removes all of the default browser styling from paragraphs, headings, lists and more. This ends up being really useful for building application UIs because you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style some content that came from a rich-text editor in a CMS or a markdown file, it can be surprising and unintuitive.</p>
<p>We get lots of complaints about it actually, with people regularly asking us things like:</p>
<blockquote>
  <p>Why is Tailwind removing the default styles on my <code>h1</code> elements? How do I disable this? What do you mean I lose all the other base styles too?</p>
</blockquote>
<p>We hear you, but we're not convinced that simply disabling our base styles is what you really want. You don't want to have to remove annoying margins every time you use a <code>p</code> element in a piece of your dashboard UI. And I doubt you really want your blog posts to use the user-agent styles either — you want them to look <em>awesome</em>, not awful.</p>
<p>The <code>@tailwindcss/typography</code> plugin is our attempt to give you what you <em>actually</em> want, without any of the downsides of doing something stupid like disabling our base styles.</p>
<p>It adds a new <code>prose</code> class that you can slap on any block of vanilla HTML content and turn it into a beautiful, well-formatted document:</p>
<pre><code class="language-html">&lt;article class="prose"&gt;
  &lt;h1&gt;Garlic bread with cheese: What the science tells us&lt;/h1&gt;
  &lt;p&gt;
    For years parents have espoused the health benefits of eating garlic bread with cheese to their
    children, with the food earning such an iconic status in our culture that kids will often dress
    up as warm, cheesy loaf for Halloween.
  &lt;/p&gt;
  &lt;p&gt;
    But a recent study shows that the celebrated appetizer may be linked to a series of rabies cases
    springing up around the country.
  &lt;/p&gt;
  &lt;!-- ... --&gt;
&lt;/article&gt;
</code></pre>
<p>For more information about how to use the plugin and the features it includes, <a href="https://github.com/tailwindcss/typography/blob/main/README.md">read the documentation</a>.</p>
<hr>
<h2 id="what-to-expect-from-here-on-out">What to expect from here on out</h2>
<p>What follows from here is just a bunch of absolute nonsense I've written to dogfood the plugin itself. It includes every sensible typographic element I could think of, like <strong>bold text</strong>, unordered lists, ordered lists, code blocks, block quotes, <em>and even italics</em>.</p>
<p>It's important to cover all of these use cases for a few reasons:</p>
<ol>
  <li>We want everything to look good out of the box.</li>
  <li>Really just the first reason, that's the whole point of the plugin.</li>
  <li>Here's a third pretend reason though a list with three items looks more realistic than a list with two items.</li>
</ol>
<p>Now we're going to try out another header style.</p>
<h3 id="typography-should-be-easy">Typography should be easy</h3>
<p>So that's a header for you — with any luck if we've done our job correctly that will look pretty reasonable.</p>
<p>Something a wise person once told me about typography is:</p>
<blockquote>
  <p>Typography is pretty important if you don't want your stuff to look like trash. Make it good then it won't be bad.</p>
</blockquote>
<p>It's probably important that images look okay here by default as well:</p>
<figure>
  <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=1000&amp;q=80" alt="">
  <figcaption>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.</figcaption>
</figure>
<p>Now I'm going to show you an example of an unordered list to make sure that looks good, too:</p>
<ul>
  <li>So here is the first item in this list.</li>
  <li>In this example we're keeping the items short.</li>
  <li>Later, we'll use longer, more complex list items.</li>
</ul>
<p>And that's the end of this section.</p>
<h2 id="what-if-we-stack-headings">What if we stack headings?</h2>
<h3 id="we-should-make-sure-that-looks-good-too">We should make sure that looks good, too.</h3>
<p>Sometimes you have headings directly underneath each other. In those cases you often have to undo the top margin on the second heading because it usually looks better for the headings to be closer together than a paragraph followed by a heading should be.</p>
<h3 id="when-a-heading-comes-after-a-paragraph">When a heading comes after a paragraph …</h3>
<p>When a heading comes after a paragraph, we need a bit more space, like I already mentioned above. Now let's see what a more complex list would look like.</p>
<ul>
  <li>
    <p><strong>I often do this thing where list items have headings.</strong></p>
    <p>For some reason I think this looks cool which is unfortunate because it's pretty annoying to get the styles right.</p>
    <p>I often have two or three paragraphs in these list items, too, so the hard part is getting the spacing between the paragraphs, list item heading, and separate list items to all make sense. Pretty tough honestly, you could make a strong argument that you just shouldn't write this way.</p>
  </li>
  <li>
    <p><strong>Since this is a list, I need at least two items.</strong></p>
    <p>I explained what I'm doing already in the previous list item, but a list wouldn't be a list if it only had one item, and we really want this to look realistic. That's why I've added this second list item so I actually have something to look at when writing the styles.</p>
  </li>
  <li>
    <p><strong>It's not a bad idea to add a third item either.</strong></p>
    <p>I think it probably would've been fine to just use two items but three is definitely not worse, and since I seem to be having no trouble making up arbitrary things to type, I might as well include it. I'm going to press <kbd>Enter</kbd> now.</p>
  </li>
</ul>
<p>After this sort of list I usually have a closing statement or paragraph, because it kinda looks weird jumping right to a heading.</p>
<h2 id="code-should-look-okay-by-default">Code should look okay by default.</h2>
<p>I think most people are going to use <a href="https://highlightjs.org/">highlight.js</a> or <a href="https://prismjs.com/">Prism</a> or something if they want to style their code blocks but it wouldn't hurt to make them look <em>okay</em> out of the box, even with no syntax highlighting.</p>
<p>Here's what a default <code>tailwind.config.js</code> file looks like at the time of writing:</p>
<pre><code class="language-js">module.exports = {
  purge: [],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
}
</code></pre>
<p>Hopefully that looks good enough to you.</p>
<h3 id="what-about-nested-lists">What about nested lists?</h3>
<p>Nested lists basically always look bad which is why editors like Medium don't even let you do it, but I guess since some of you goofballs are going to do it we have to carry the burden of at least making it work.</p>
<ol>
  <li>
    <strong>Nested lists are rarely a good idea.</strong>
    <ul>
      <li>You might feel like you are being really "organized" or something but you are just creating a gross shape on the screen that is hard to read.</li>
      <li>Nested navigation in UIs is a bad idea too, keep things as flat as possible.</li>
      <li>Nesting tons of folders in your source code is also not helpful.</li>
    </ul>
  </li>
  <li>
    <strong>Since we need to have more items, here's another one.</strong>
    <ul>
      <li>I'm not sure if we'll bother styling more than two levels deep.</li>
      <li>Two is already too much, three is guaranteed to be a bad idea.</li>
      <li>If you nest four levels deep you belong in prison.</li>
    </ul>
  </li>
  <li>
    <strong>Two items isn't really a list, three is good though.</strong>
    <ul>
      <li>Again please don't nest lists if you want people to actually read your content.</li>
      <li>Nobody wants to look at this.</li>
      <li>I'm upset that we even have to bother styling this.</li>
    </ul>
  </li>
</ol>
<p>The most annoying thing about lists in Markdown is that <code>&lt;li&gt;</code> elements aren't given a child <code>&lt;p&gt;</code> tag unless there are multiple paragraphs in the list item. That means I have to worry about styling that annoying situation too.</p>
<ul>
  <li>
    <p><strong>For example, here's another nested list.</strong></p>
    <p>But this time with a second paragraph.</p>
    <ul>
      <li>These list items won't have <code>&lt;p&gt;</code> tags</li>
      <li>Because they are only one line each</li>
    </ul>
  </li>
  <li>
    <p><strong>But in this second top-level list item, they will.</strong></p>
    <p>This is especially annoying because of the spacing on this paragraph.</p>
    <ul>
      <li>
        <p>As you can see here, because I've added a second line, this list item now has a <code>&lt;p&gt;</code> tag.</p>
        <p>This is the second line I'm talking about by the way.</p>
      </li>
      <li>
        <p>Finally here's another list item so it's more like a list.</p>
      </li>
    </ul>
  </li>
  <li>
    <p>A closing list item, but with no nested list, because why not?</p>
  </li>
</ul>
<p>And finally a sentence to close off this section.</p>
<h2 id="we-didnt-forget-about-description-lists">We didn't forget about description lists</h2>
<p>Well, that's not exactly true, we first released this plugin back in 2020 and it took three years before we added description lists. But they're here now, so let's just be happy about that…okay? They can be great for things like FAQs.</p>
<dl>
  <dt>Why do you never see elephants hiding in trees?</dt>
  <dd>Because they're so good at it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.</dd>
  <dt>What do you call someone with no body and no nose?</dt>
  <dd>Nobody knows. Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, voluptas ipsa quia excepturi, quibusdam natus exercitationem sapiente tempore labore voluptatem.</dd>
  <dt>Why can't you hear a pterodactyl go to the bathroom?</dt>
  <dd>Because the pee is silent. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsam, quas voluptatibus ex culpa ipsum, aspernatur blanditiis fugiat ullam magnam suscipit deserunt illum natus facilis atque vero consequatur! Quisquam, debitis error.</dd>
</dl>
<h2 id="there-are-other-elements-we-need-to-style">There are other elements we need to style</h2>
<p>I almost forgot to mention links, like <a href="https://tailwindcss.com">this link to the Tailwind CSS website</a>. We almost made them blue but that's so yesterday, so we went with dark gray, feels edgier.</p>
<p>We even included table styles, check it out:</p>
<table>
  <thead>
    <tr>
      <th>Wrestler</th>
      <th>Origin</th>
      <th>Finisher</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bret "The Hitman" Hart</td>
      <td>Calgary, AB</td>
      <td>Sharpshooter</td>
    </tr>
    <tr>
      <td>Stone Cold Steve Austin</td>
      <td>Austin, TX</td>
      <td>Stone Cold Stunner</td>
    </tr>
    <tr>
      <td>Randy Savage</td>
      <td>Sarasota, FL</td>
      <td>Elbow Drop</td>
    </tr>
    <tr>
      <td>Vader</td>
      <td>Boulder, CO</td>
      <td>Vader Bomb</td>
    </tr>
    <tr>
      <td>Razor Ramon</td>
      <td>Chuluota, FL</td>
      <td>Razor's Edge</td>
    </tr>
  </tbody>
</table>
<p>We also need to make sure inline code looks good, like if I wanted to talk about <code>&lt;span&gt;</code> elements or tell you the good news about <code>@tailwindcss/typography</code>.</p>
<h3 id="sometimes-i-even-use-code-in-headings">Sometimes I even use <code>code</code> in headings</h3>
<p>Even though it's probably a bad idea, and historically I've had a hard time making it look good. This <em>"wrap the code blocks in backticks"</em> trick works pretty well though really.</p>
<p>Another thing I've done in the past is put a <code>code</code> tag inside of a link, like if I wanted to tell you about the <a href="https://github.com/tailwindcss/docs"><code>tailwindcss/docs</code></a> repository. I don't love that there is an underline below the backticks but it is absolutely not worth the madness it would require to avoid it.</p>
<h4 id="we-havent-used-an-h4-yet">We haven't used an <code>h4</code> yet</h4>
<p>But now we have. Please don't use <code>h5</code> or <code>h6</code> in your content, Medium only supports two heading levels for a reason, you animals. I honestly considered using a <code>before</code> pseudo-element to scream at you if you use an <code>h5</code> or <code>h6</code>.</p>
<p>We don't style them at all out of the box because <code>h4</code> elements are already so small that they are the same size as the body copy. What are we supposed to do with an <code>h5</code>, make it <em>smaller</em> than the body copy? No thanks.</p>
<h3 id="we-still-need-to-think-about-stacked-headings-though">We still need to think about stacked headings though.</h3>
<h4 id="lets-make-sure-we-dont-screw-that-up-with-h4-elements-either">Let's make sure we don't screw that up with <code>h4</code> elements, either.</h4>
<p>Phew, with any luck we have styled the headings above this text and they look pretty good.</p>
<p>Let's add a closing paragraph here so things end with a decently sized block of text. I can't explain why I want things to end that way but I have to assume it's because I think things will look weird or unbalanced if there is a heading too close to the end of the document.</p>
<p>What I've written here is probably long enough, but adding this final sentence can't hurt.</p>
`,
}
