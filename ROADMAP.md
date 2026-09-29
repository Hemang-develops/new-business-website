# Project Pointers & Requirements

This document tracks upcoming features, bugs, and general development notes.

## Active Requirements / Backlog

1. Monthly vs yearly subscriber view
2. Configurable mail
3. Courses // still pending
4. Separate offerings to types in home page for separate landing page of each 
5. minimum amount for installment: 15000 INR
6. introduce toast msg for attention
11. make demo live
10. improve confirm email supabase default mail
9. calendly integration - > cal.com integration
12. remove back to offerings button
13. separate hero for offering pages
14. Show more issue with card
10. old content should not be shown after modified but loader should be shown then new data
11. pages break after refresh due to page api not found
12. scroll issue 
13. white screen due to lazy loading
16. email going twice
18. drip content
28. remove asthetic amounts
7. add comment(review) in offerings(option to add image)
15. explore offering => Details here 
22. newsletter feature in admin
17. ADD EMAIL IN TEMPLATE FOR ISSUES 
19. reminder email
27. faq not working
IMP : need to implement side nav in admin control

7. add comment(review) in offerings(option to add image)
test above (Could not find the 'author_image' column of 'comments' in the schema cache)
make website proper for diff screen sizes
8. user inventory (admin)
## when stripe payment is cancelled, routed back to "http://localhost:5173/buy/email-coaching/cancel" instead of just url "/buy/email-coaching/cancel"
20. filter to show only products in which courses can be added
21. add content or module needs to be intituitve
23. privacy policy, terms of service
24. cookie policy
25. a service that allows users to send a request to view/edit/delete their personal information stored on your website and/or app
26. website have Global Privacy Control (GPC) enabled?
28. test razorpay integration

## Future scope:
29. different type of admin with different permissions

## Test Findings (2026-07-29)

- Email confirmation failure: sign-up smoke test returned "Error sending confirmation email". Likely causes: SMTP not configured in Supabase Auth, or SMTP credentials invalid. This blocks user sign-up confirmation and should be resolved before public launch.

- `course-access-fulfill` invocation logs (from latest smoke run):

        - "Request received. Auth header present: true"
        - "[Fulfill] Checking for Admin session..."
        - "[Fulfill] Internal secret check: Invalid/Missing"
        - "[Fulfill] Unauthorized attempt."
        - "[Fulfill] Auth error: invalid claim: missing sub claim"

        These indicate the fulfillment function is receiving a request without a valid admin/service-session or required secret; ensure `SUPABASE_SERVICE_ROLE_KEY` and any function-specific secrets/webhook signing secrets are set for the function runtime and that invocations include expected auth metadata.

Action items from tests:
1. Verify and configure SMTP for Supabase Auth (or the configured email provider) so confirmation emails send successfully.
2. Ensure server-only secrets are present in Supabase Functions (service role key and webhook secrets) and that the fulfillment function validates & receives expected auth claims.
3. Re-run smoke tests after fixes and record results here.

Additional logged issues (2026-07-30):

- Send email failures (detailed):
        - Symptom: Sign-up confirmation returned "Error sending confirmation email" during smoke tests.
        - Location: `supabase/functions/_shared/course-fulfillment.ts` -> `sendEmail()` uses `RESEND_API_KEY` and `EMAIL_FROM`.
        - Next steps: capture the Resend API response body for failed sends, verify `RESEND_API_KEY` and `EMAIL_FROM` values in function secrets, and confirm Supabase Auth SMTP settings if using SMTP instead of Resend.

- Course access fulfillment invocation (detailed):
        - Symptom: `course-access-fulfill` logged missing/invalid auth ("Internal secret check: Invalid/Missing" and "invalid claim: missing sub claim"). Smoke test reported an "unknown" invoke status when calling from the admin client.
        - Location: `supabase/functions/course-access-fulfill` and shared helpers in `supabase/functions/_shared/course-fulfillment.ts`.
        - Next steps: ensure `FULFILLMENT_SECRET` (or valid admin JWT) is set for automated invocations, add server-side logging of the function invoke response bodies, and add a local dev fallback to skip sending real emails during smoke runs.

New action items:
4. Add a `DEV_SKIP_EMAIL` (or `NODE_ENV=development`) fallback in `supabase/functions/_shared/course-fulfillment.ts` to avoid sending real emails during local E2E/smoke runs.
5. Improve smoke-test logging to print the full invoke response body from `admin.functions.invoke` (helpful for debugging fulfillment failures).
6. If the current `FULFILLMENT_SECRET` is unknown, rotate it in Supabase and update local dev secrets and any callers.
7. adding temp stripe_webhook_secret for testing, need to change to live once live



## Architecture Diagrams

Courses --->  
        |--> Booking (meeting)                                            
        |                                                       |--> with out Modules ------------------|
        |--> Content ---> Normal (all at once access)---------------------|                             |-------> Types (youtube video/ rich text/ video or audio (uploaded))/ external link
                     |                                                    |----------> Modules-----------
                     |                                                    |                             
                     |--> Drip content (access in interval of days)-------|       
