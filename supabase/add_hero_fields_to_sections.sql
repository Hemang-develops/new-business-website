-- Add hero fields to storefront_sections for offering type hero pages
ALTER TABLE public.storefront_sections
ADD COLUMN hero_title text,
ADD COLUMN hero_subtitle text,
ADD COLUMN hero_description text,
ADD COLUMN hero_image_url text,
ADD COLUMN hero_cta_label text,
ADD COLUMN hero_cta_href text;

-- Update existing sections with default hero content
UPDATE public.storefront_sections
SET
  hero_title = CASE
    WHEN id = 'coaching' THEN 'Meet Your Manifestation Coach'
    WHEN id = 'custom-meditation' THEN 'Custom Creations by Nehal'
    WHEN id = 'meditations' THEN 'Guided by Nehal Patel'
    WHEN id = 'digital' THEN 'Digital Tools from Nehal'
    WHEN id = 'energy-readings' THEN 'Energy Readings with Nehal'
    ELSE 'Experience the Transformation'
  END,
  hero_subtitle = CASE
    WHEN id = 'coaching' THEN 'High-Frequency Coaching & Mentorship'
    WHEN id = 'custom-meditation' THEN 'Personalized Spiritual Tools'
    WHEN id = 'meditations' THEN 'Meditations & Rituals for Manifestation'
    WHEN id = 'digital' THEN 'Self-Paced Digital Resources'
    WHEN id = 'energy-readings' THEN 'Tarot & Energy Guidance'
    ELSE 'Transform Your Reality'
  END,
  hero_description = CASE
    WHEN id = 'coaching' THEN 'Hi, I''m Nehal Patel - a manifestation coach, energy reader, and your guide to quantum leaping into your dream reality. With over 5 years of experience helping clients manifest love, wealth, and purpose, I combine ancient wisdom with modern techniques to help you bridge the gap between where you are and where you want to be.'
    WHEN id = 'custom-meditation' THEN 'Hi, I''m Nehal Patel - the creator behind High Frequencies 11. I specialize in crafting personalized spiritual tools that speak directly to your soul''s desires. Each creation is infused with reiki, channeled guidance, and the exact frequencies you need to manifest your intentions.'
    WHEN id = 'meditations' THEN 'Hi, I''m Nehal Patel - a certified manifestation coach and energy healer. My meditations combine hypnotic soundscapes, reiki energy, and powerful affirmations to help you reprogram your subconscious and align with your highest timeline.'
    WHEN id = 'digital' THEN 'Hi, I''m Nehal Patel - founder of High Frequencies 11. I create digital resources that make spiritual growth accessible and practical. My tools are designed to fit into your busy life while delivering real transformation.'
    WHEN id = 'energy-readings' THEN 'Hi, I''m Nehal Patel - an intuitive energy reader and tarot practitioner. I provide clear, actionable guidance to help you navigate your spiritual journey and make decisions aligned with your highest good.'
    ELSE 'Hi, I''m Nehal Patel - your manifestation guide and energy healer. Let me help you step into the reality you''ve been dreaming of.'
  END,
  hero_cta_label = 'Explore Offerings',
  hero_cta_href = ''
WHERE id IN ('coaching', 'custom-meditation', 'meditations', 'digital', 'energy-readings');