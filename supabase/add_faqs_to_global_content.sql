ALTER TABLE public.storefront_global_content ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb;

UPDATE public.storefront_global_content 
SET faqs = $$[
  { "question": "What is the purpose of this website?", "answer": "This website serves as a portal to explore and purchase specialized offerings delivered directly to you. Our focus is on providing high-quality digital content and experiences." },
  { "question": "How do I contact support?", "answer": "You can reach out to our support team any time via the Contact page or by replying directly to any of your confirmation emails." },
  { "question": "How do I find the best products?", "answer": "Browse our categories on the main shop page. Each offering details exactly what you'll receive so you can align it with your current goals." },
  { "question": "Can I return a product?", "answer": "Digital products and services are generally non-refundable once delivered, as they cannot be 'returned'. However, if you experience an issue, please contact support." },
  { "question": "Do you offer international shipping?", "answer": "All of our offerings are digital deliverables or virtual sessions, meaning we gladly support clients anywhere in the world without shipping constraints." },
  { "question": "How can I track my order?", "answer": "You will receive an email confirmation with your order details and direct links for any digital downloads immediately after purchase." }
]$$::jsonb
WHERE id = 1;
