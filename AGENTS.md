🤖 AGENTS.md — AI Agent Operating Rules
🎯 Objective
You are an autonomous AI software engineer.Your goal is to design, build, debug, and improve this project with clean, production-ready code.
Always prioritize:
* Correctness
* Simplicity
* Maintainability
* Performance

🧠 Core Behavior Rules
1. Think Before Acting
* Always analyze the task before writing code
* Break problems into smaller steps
* Avoid unnecessary complexity

2. Code Quality Standards
* Write clean, readable, and modular code
* Use meaningful variable and function names
* Follow consistent formatting
* Avoid duplication (DRY principle)

3. Project Awareness
Before making changes:
* Read existing files
* Understand project structure
* Respect current architecture
DO NOT:
* Rewrite entire codebases unnecessarily
* Introduce breaking changes without reason

4. File Handling Rules
* Create new files only when necessary
* Update existing files instead of duplicating logic
* Keep file structure organized

🏗️ Architecture Guidelines
Frontend (if applicable)
* Use component-based architecture
* Keep components small and reusable
* Separate UI and logic
Backend (if applicable)
* Follow MVC or modular structure
* Keep business logic separate from routes
* Validate all inputs

🔐 Security Best Practices
* Never expose API keys or secrets
* Use environment variables
* Validate and sanitize user input
* Prevent common vulnerabilities (XSS, SQL Injection)

⚡ Performance Guidelines
* Avoid unnecessary re-renders or loops
* Optimize database queries
* Use caching when appropriate

🧪 Testing & Debugging
* Write testable code
* Add basic error handling
* Log meaningful debug information

🧩 Task Execution Strategy
When given a task:
1. Understand the requirement
2. Check existing implementation
3. Plan minimal changes
4. Implement step-by-step
5. Test the result
6. Refactor if needed

📚 Documentation Rules
* Add comments only where necessary
* Explain complex logic clearly
* Keep README updated if major changes occur

🚫 What to Avoid
* Overengineering
* Unnecessary dependencies
* Hardcoded values
* Ignoring existing patterns

🧠 Context Memory Strategy
Use project files as long-term memory:
* README.md → project overview
* AGENTS.md → rules (this file)
* docs/ → detailed documentation
Always refer to these before making decisions.

🛠️ Default Tech Stack (if not specified)
* Frontend: React
* Backend: Node.js (Express)
* Database: PostgreSQL
* Styling: Tailwind CSS

🎬 Special Instruction (For Demo / Teaching Projects)
* Prefer simple and clear implementations
* Add explanatory comments for beginners
* Avoid overly complex patterns unless necessary

✅ Output Expectations
Every output should be:
* Working
* Clean
* Minimal
* Easy to understand

🔄 Continuous Improvement
If you see a better approach:
* Suggest improvement
* Then implement it safely

🚀 Final Rule
Always act like a senior software engineer who writes code that others can easily understand, use, and scale.


# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark intentional simplifications with a `ponytail:` comment. If the shortcut has a known ceiling (global lock, O(n²) scan, naive heuristic), the comment names the ceiling and the upgrade path.

Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

What are UI design principles?
UI design principles are the overarching guidance designers rely on to create products that serve and delight users. This guide goes over the core principles that shape effective UI design, with practical tips from Figma Advocacy Director Thomas Lowry. “Our job as digital designers is to help users navigate to the content and features they need, to accomplish what they want to do.

“UI design principles take inspiration from Gestalt principles of human perception, grouping design elements into simple patterns users can easily follow to reach their goals.”

Why UI principles matter
The benefits of applying UI design principles: enhances usability, improves decision-making, increases efficiency, reduces cognitive load.
Following UI design best practices makes digital products easier for everyone to use, follow, and enjoy. The benefits of applying UI design principles are many, including:

Enhances usability. “Think of a user as someone asking you directions. If you just showed them a map and expected them to memorize it, they'll probably get lost,” Tom says. “But if you point them to a sign that says their destination is this way, they can follow the signs from there … That's a much better experience. UI design principles help you set up signs users can follow towards their goals—one click, scroll, or interaction at a time.”
Improves decision-making. Clear and consistent UI design principles give a structured framework for predicting user needs and making informed design choices.
Increases efficiency. Aligning UI design principles at the start of projects lifts the cognitive load for designers, streamlining workflows and making product teams more efficient. Figma data analysts found that participants with access to a design system completed their design objective 34% faster than those without one.
Reduces cognitive load. A well-designed interface can simplify tasks, reducing the mental effort required to complete user actions. Less cognitive load can help create a more intuitive and enjoyable experience.
7 UI design principles to improve product design
The seven principles of UI design: hierarchy, progressive disclosure, consistency, contrast, proximity, accessibility, and alignment.
To elevate your UI designs, keep these UI principles top of mind:

Principle 1: Hierarchy
Designers use hierarchy to help users recognize key information and distinguish them from less important elements at a glance. “I often compare designing a digital product or website to designing a book,” Tom says. "On every page, navigational cues remind you of the title, chapter, and content section, so you never get lost.”

Like graphic designers, digital designers often play with the following visual cues to guide users to different elements within a user interface:

Font size and weight. Large and bold fonts stand out and can emphasize important information and buttons.
Contrast. The strategic use of contrasting colors directs users to key elements.
Spacing. Thoughtful spacing between elements creates visual interest and shows users how different UI elements are related.
"Be intentional about what goes where on a screen, especially what users see first and what they have to scroll to see,” Tom suggests. “Consider how you prioritize information: your UI content hierarchy should reflect what the user cares about most.”

Principle 2: Progressive disclosure
UX designers typically use progressive disclosure to guide users through a multi-step process, providing the right amount of information to make clear choices at each step.

UI designers can borrow this approach to prioritize what to include in the UI and what to exclude since too many features can be overwhelming.

“Smart digital designers sequence features and flows to make the experience feel less overwhelming,” says Tom. “Consider the UX example of a product onboarding flow, which asks you all about yourself: your name, your contact information, your role, and industry, and maybe what interests you in this product.

If you had to answer all that at once, that screen could look like a long form to fill out—and you might give up before you got started,” he continues.

One thing to watch out for with progressive disclosure is losing users along the way. “Give users a way to orient themselves, so they know where they are and how many steps they have to go,” Tom recommends.

Principle 3: Consistency
A good interface feels familiar from the first click. Design systems create this familiarity through consistent patterns—when a button looks and works the same way throughout your product, users stop thinking about the interface and focus on their tasks.

Continuity becomes increasingly important as users advance through a flow. “If one UI button is suddenly bigger, users are going to wonder why,” Tom says. “That irregularity adds to users' cognitive load, creating hesitancy and confusion. So you need a good rationale when you deviate from established patterns.”

Principle 4: Contrast
UI designers use contrast strategically to draw attention to important content or features. Tom explains, "For a critical piece of information, you may introduce a higher, more jarring contrast to command the user's attention.”

For example, you may prominently display a “delete account” button in the color red against a white background to immediately grab a user’s attention and reinforce the action. For secondary actions, like “keep account,” the color gray might work well to avoid user confusion.

Pro tip: Use Figma's selection colors feature to explore different color schemes. It’s also a great tool to apply consistent colors and contrast across your final designs.

Principle 5: Accessibility
UI designers also carefully contrast colors and luminosity to make designs distinctive and more accessible to users with vision impairments. (Vision impairments affect more than one in four users worldwide.)

Black text on a white background remains standard for printed media, but you can choose different colors using contrast checkers and plugins from Figma's design community.

To ensure your designs are inclusive, be sure to implement what is outlined in  the Web Content Accessibility Guidelines (WCAG), including:

Providing alternative text
Using appropriate padding rules
Ensuring compatibility with assistive technology
Providing proper keyboard navigation
Using sufficient contrast between foreground and background colors
Principle 6: Proximity
Things that belong together should stay together. Users naturally perceive UI elements that are close together as related, so this type of visual organization creates a more intuitive user experience and natural user flow.

Take streaming services, for example. Play, fast-forward, and rewind buttons on the same row because they all have something to do with controlling video playback. But you’d never find the quit button in this zone. It lives separately to prevent accidental clicks that could interrupt the viewing experience.

Principle 7: Alignment
Clean lines make designs feel professional. A strong grid system helps establish order and balance. Consistent alignment improves readability and creates predictability, making it easier for users to navigate your website or app.

4 pro tips for effective UI design
Keep the following tips in mind when applying the core UI design principles:

Apply perspective. Position UI elements on a screen to guide users through a logical sequence of information and actions to accomplish their goals. Determine the user flow and adjust the element placement accordingly to ensure a consistent user experience.
Make it effortless. Good interfaces feel invisible. Keep navigation consistent across pages, provide clear visual feedback for interactions, and add smart shortcuts like search, if it helps the user.
Apply shortcuts. Speed up common tasks with keyboard shortcuts and quick-access tools. Figma, for example, has multiple keyboard shortcuts to streamline workflows for designers.
Conduct testing. Watch how people use your interface. Regular testing helps you catch problems early and ensures your design works for everyone.