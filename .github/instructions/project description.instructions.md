---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

"This is a headless CMS + Stripe checkout system for spiritual coaching. The public site is a React storefront that fetches products from an admin-managed database. Non-technical admins use a password-protected dashboard to add/edit/delete offerings (coaching packages, meditations, tarot readings) with pricing in multiple currencies. Orders flow through Stripe, and admin analytics show customer data. The architecture separates marketing content (managed via UI) from platform code (Git-deployed), allowing non-technical admins to maintain the site without code changes. The system is built with React, Node.js, and Stripe's API for seamless e-commerce functionality."