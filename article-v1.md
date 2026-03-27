# From “I Want Side Income” to a Live Paid AI Service in 3 Days

I started with a simple question: how do I build something that makes money without just creating more work for myself? 

I teach applied AI in a visual communication design program. I’ve been teaching design since 2008: typography, drawing, digital foundations, design systems, packaging, lighting, emergent design, applied AI. I can build in code. I had some capital, a specific skill set, and no clear target.

The first suggestions were predictable: workshops, cohort courses, digital products. All valid. All things I had already considered. All things that still mostly trade time for money. That was not what I wanted.

So I pushed toward something more computational. Something with more leverage. Something that could become an asset.

## The dead ends helped

The first serious idea was a Canvas MCP server. That made sense. I’m in Canvas all the time. A good MCP for Canvas could pull submissions, check rubric completion, list enrollments, draft announcements, flag missing grades. For teaching, that’s actually useful. 

Then the FERPA problem showed up.

If student names, grades, and submission content are being routed through Anthropic’s API, that becomes a third-party processing issue. Unless EWU has a signed data processing agreement with Anthropic, that is a hard no. A quick check suggested there was no DPA in place. So that path was dead for now. 

It may still be viable through Gemini because EWU’s Google Workspace for Education agreement changes the data handling picture. The server itself is model-agnostic. That matters. But it was still a detour.

I’m still interested in that route. FERPA is real. Gemini is not Claude Code. Those are not small differences.

The second idea was a Signal Desk MCP built on top of a news aggregation tool I already had running. That one was cleaner. It had a smaller tool surface, no FERPA issue, and a faster path to working code. I’ll probably still build it because it would be useful to me and because I want to see what an MCP on top of that system actually feels like in practice. 

But while I was scoping it, the real issue got clearer. I was still new to MCP. I didn’t just want a product idea. I wanted to understand what MCP actually is, how skills work, and how these systems are built and used. I teach this stuff. I needed to understand it at the level where you build one yourself. That’s usually how you learn anything for real. 

## What MCP is

MCP stands for Model Context Protocol. It’s a standard that lets an AI model call external tools during a conversation. Without MCP, a model can answer from what it knows. With MCP, it can do something: query a database, read a file, hit an API, return structured results, and use those results in the response. 

A tool is not mysterious. It has a name, a plain-English description so the model knows when to use it, and a schema that defines the inputs it accepts. You write the logic. The model decides when to call it.

The pattern is straightforward. You run an MCP server. You connect it to a client like Claude Desktop, Gemini, or Cursor. The user asks something. The model picks a tool, calls your server, and uses the result.

That’s the mechanism. The harder part is building tools worth calling.

## The business question had to change

At that point I had been circling a handful of ideas: synthetic design training data, computational aesthetics evaluation, generative brand systems, design for machine readers, spatial UI grammar. Some were more interesting than others. None had fully clicked. 

One useful response from DeepSeek stuck with me: explainability is the product, not the score. A single number is not very useful to a designer. Diagnostic feedback is where the value is.

That got close, but it still wasn’t the real question.

I wanted something more like a title company in real estate. They stay relevant no matter what the market does because they sit in a structural position. Money moves through them because the transaction needs them. I wanted something with that kind of durability in the digital world. 

That narrowed the field fast.

What in design is structurally necessary?

Accessibility compliance.

## Accessibility is structural

WCAG compliance is not a trend. The EU Accessibility Act is in force. ADA litigation around websites keeps increasing. Accessibility is becoming less optional, not more. Every design system, every interface, every AI-generated asset, every update to a site or product is moving into a world where accessibility has to be accounted for. 

Automated scanners help, but they do not solve the whole problem. Tools like axe, Lighthouse, and WAVE catch some issues. They do not catch all the ones that matter in practice.

They can check a contrast threshold. They usually cannot tell you that a thin 14px body text technically passes while still being a bad reading experience. They can verify that headings exist. They cannot reliably judge whether the hierarchy is visually clear enough to communicate structure. They do not meaningfully evaluate line length, extended all-caps, overuse of italics, weak spacing, or the typographic choices that make text harder to read even when it passes minimum compliance. 

That is where my actual expertise lives.

Not just in knowing WCAG. In knowing why a particular combination of choices fails the person trying to read it.

It started when Signal Desk surfaced a DEV post called “How to build a paid MCP tool that AI agents pay to use.” That was the first time the MCP + x402 path felt concrete instead of theoretical.

## The rubric is the product

That was the point where the project stopped being abstract.

The thing with value was not “an AI accessibility tool.” It was not “crypto payments.” It was not “an MCP server.”

It was the rubric. 

The typography accessibility rubric is the hard part. The checks that go beyond what automated scanners catch. The judgment encoded in those checks took years to develop through teaching typography, critique, and design fundamentals. Wrapping that rubric in an MCP server with x402 payments is delivery infrastructure. Useful infrastructure, yes. But still infrastructure.

The rubric evaluates things like:

- contrast failures on thin-weight fonts
- body text below a readable base size
- line height that is too tight
- line length outside a comfortable reading range
- extended all-caps and italics
- spacing choices that impair word recognition
- text on gradients or image backgrounds that needs human judgment
- heading hierarchies that technically exist but do not communicate structure well
- typographic craft issues that go beyond bare-minimum WCAG compliance 

The output is not just a score. It returns a verdict, specific issues, severity levels, WCAG references, and recommendations that a human designer or an AI agent can actually use. 

That was the business.

## The early technical problems were ordinary

Before any payment infrastructure worked, I had to get the environment running.

The first issue was esbuild compiled for the wrong platform. `tsx` would not start. The fix was boring: delete `node_modules` and reinstall on the current machine.

The second issue was a stale Node process holding port 3000. `EADDRINUSE`. Again, boring. Kill the process.

Neither problem was interesting, but both mattered. This is worth stating plainly because it is easy to assume your architecture is broken when the problem is actually some dumb local setup issue upstream. 

## x402 made it billable

The first version used a custom payment header and a stubbed verification function. That proved the concept but did not create something a real x402 buyer could use.

The official x402 flow is cleaner. The seller returns `402 Payment Required` with a payment challenge. The buyer signs the payment and retries with proof attached. The seller verifies with a facilitator and processes the request if the payment checks out. 

I replaced the custom middleware with `@x402/express`, registered the EVM scheme, and protected only the paid tool.

That distinction mattered. I did not want to gate the whole app. I wanted one free tool people or agents could use to discover what the server does, and one paid tool where the actual value lives. 

Once that was in place, `curl` could confirm that the payment challenge looked right. But that only proves half the system. I still needed a real buyer wallet to complete the loop.

## Wallet setup was the worst part

This was the most annoying part of the project, and it had almost nothing to do with code.

There were two wallets with different roles. The seller address was a Coinbase receive address. The buyer wallet was a MetaMask self-custody account because it needed the private key for signing. That distinction matters because Coinbase gives you a receive address, not a raw key. 

Then there was the network problem. Base Sepolia had to be configured in MetaMask. The buyer wallet needed Base Sepolia ETH for gas and Base Sepolia USDC for payment. The token had to be imported manually using the correct contract address. None of this was hard in theory. All of it was irritating in practice. 

When the first settlement finally went through, the tool returned a real result: success, Base Sepolia, failed verdict, score 60. It flagged a contrast problem and a body text issue on the test element. The product worked end to end. 

## Mainnet was close, but not painless

The public x402 facilitator supports testnets. Base mainnet required the Coinbase CDP facilitator and a free API key from Coinbase.

The code change itself was minor. The annoying part was key formatting.

The CDP SDK validates private keys strictly. PEM EC keys need real newlines. When the secret was set through the command line, the newlines got stripped and the server crashed with `Invalid key format`. The fix was to load the secret with `jq -r` so the newlines stayed intact. That cost about 45 minutes. Not because it was conceptually hard. Because it was easy to miss. 

## Fly.io was the right deployment choice

I used Fly.io instead of Railway because Fly’s free tier supports always-on machines. x402 payments are time-sensitive. A cold start during the retry could break settlement. Railway’s free tier has cold starts. Fly’s doesn’t, at least in the configuration I needed. 

The first deploy failed because `package-lock.json` was out of sync with `package.json`. Installing `@coinbase/x402` added packages that the lock file had not yet recorded. Docker was using `npm ci`, which requires exact sync. Switching to `npm install` fixed it.

After setting the required secrets, the server came up. Health check passed. Payment gate returned `402`. That was the infrastructure in place. 

## The real payment mattered

To test mainnet, I bought $1 of USDC on Coinbase and sent it to MetaMask on Base. One practical note: ACH deposits can have hold periods that block withdrawals. A debit card purchase clears immediately. That looks like a crypto issue when it happens, but it is really a banking issue. 

Then the real payment went through.

Real USDC. Real transaction on Base mainnet. The evaluation report flagged the contrast failure and the 14px body text. Score 60. Verdict: fail.

That was the point where it stopped being a prototype. 

## A live server still has to be found

A working server that nobody can discover is not much of a product.

So I published it to Smithery, added it to mcp.so, set it up so Glama could index it from GitHub, added an `llms.txt` file at `/llms.txt`, and tagged the repo so discovery tools crawling GitHub could identify it as an MCP server. 

That work is not glamorous, but it matters. Distribution matters.

## What the week actually looked like

Tuesday started with “I want side income.” Then Canvas MCP. Then FERPA killed that route.

Wednesday was Signal Desk MCP and the bigger question of what MCP actually is.

Thursday was the aesthetics and rubric work, then the business realization: accessibility compliance is structural, and the rubric is the product.

Friday and Saturday were local setup, x402 migration, wallet setup, and the first successful settlement on Base Sepolia.

Sunday was mainnet, CDP, deployment, and a real USDC payment on Base. 

Three days if you count only the build. About a week if you count the whole thinking process.

## What I learned

The payment layer is not the moat. The expertise is.

The buyer loop matters more than the seller demo.

Wallet setup is still the most fragile, annoying part of the stack.

The dead ends were not wasted time. They narrowed the field.

The best question was not “what can I sell?” It was “what remains necessary no matter what?” 

Accessibility has that property.

## Where it stands

Axcess can now:

- expose a free MCP discovery tool
- expose a paid typography accessibility evaluation tool
- accept USDC on Base mainnet through x402
- complete a paid request from a real buyer wallet
- return structured accessibility findings with WCAG references, severity levels, and recommendations
- be discovered through its `llms.txt`
- connect directly through Claude.ai integrations 

The next step is broader accessibility evaluation: typography, color, and interaction checks together in a fuller audit.

The larger direction is clear enough now. This is about turning design judgment into something a generative system can call while it works. That is the actual position. The MCP server and the payment rail are just how it gets delivered. 

------
