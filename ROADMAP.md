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


## Architecture Diagrams

Courses --->  
        |--> Booking (meeting)                                            
        |                                                       |--> with out Modules ------------------|
        |--> Content ---> Normal (all at once access)---------------------|                             |-------> Types (youtube video/ rich text/ video or audio (uploaded))/ external link
                     |                                                    |----------> Modules-----------
                     |                                                    |                             
                     |--> Drip content (access in interval of days)-------|       
