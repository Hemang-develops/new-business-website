# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


Requirement:

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
8. user inventory (admin)
15. explore offering => Details here 
17. ADD EMAIL IN TEMPLATE FOR ISSUES 
19. reminder email
20. filter to show only products in which courses can be added
21. add content or module needs to be intituitve
22. newsletter feature in admin
23. privacy policy, terms of service
24. cookie policy
25. a service that allows users to send a request to view/edit/delete their personal information stored on your website and/or app
26. website have Global Privacy Control (GPC) enabled?
27. faq not working


Courses --->  
        |--> Booking (meeting)                                            
        |                                                       |--> with out Modules ------------------|
        |--> Content ---> Normal (all at once access)---------------------|                             |-------> Types (youtube video/ rich text/ video or audio (uploaded))/ external link
                     |                                                    |----------> Modules-----------
                     |                                                    |                             
                     |--> Drip content (access in interval of days)-------|       

## Cal.com booking sync

This project now supports auto-provisioned Cal.com event types for offerings saved from the admin.

Frontend env:

```env
VITE_CALCOM_DEFAULT_HOST_ID=default-host
```

Supabase Edge Function secrets:

```env
CALCOM_USERNAME=your-calcom-username
CALCOM_API_KEY=cal_xxx
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
```

Deploy the booking sync function after adding the new `storefront_offerings` booking columns from:

- `supabase/add_booking_fields_to_storefront_offerings.sql`
- `supabase/functions/sync-booking-offering`
