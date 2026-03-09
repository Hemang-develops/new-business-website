begin;

update public.storefront_offerings
set image_url = v.image_url,
    image_alt = v.image_alt,
    updated_at = now()
from (
  values
    ('email-coaching', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80', 'journal, coffee and laptop on table'),
    ('single-audio-call', 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80', 'woman speaking on a phone call'),
    ('four-call-package', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', 'notebook and headset for coaching call'),
    ('personalised-meditation', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', 'woman meditating with headphones'),
    ('personalised-subliminal', 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80', 'headphones resting on open journal'),
    ('manifest-for-you', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'ritual altar with candles'),
    ('quantum-jump', 'https://images.unsplash.com/photo-1523294587484-bae6cc870010?auto=format&fit=crop&w=1200&q=80', 'celestial imagery with woman visualising'),
    ('trauma-release', 'https://images.unsplash.com/photo-1465146633011-14f8e0781093?auto=format&fit=crop&w=1200&q=80', 'woman journaling for healing'),
    ('inner-child', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80', 'woman relaxing with hand on heart'),
    ('aphrodite-ritual', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80', 'woman applying beauty ritual with mirror'),
    ('manifest-sp', 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80', 'headphones resting on open journal'),
    ('good-luck-ritual', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', 'lucky charms and sparkling lights'),
    ('current-sp-energy', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80', 'tarot spread with candles'),
    ('monthly-check-in', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', 'tarot cards on cloth'),
    ('tarot-email', 'https://images.unsplash.com/photo-1531263539449-56fdf29dfc4d?auto=format&fit=crop&w=1200&q=80', 'tarot reading notebook'),
    ('tarot-oracle-email', 'https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?auto=format&fit=crop&w=1200&q=80', 'oracle cards with crystals'),
    ('tarot-audio-call', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'oracle reading during audio call'),
    ('sp-rampage-ebook', 'https://images.unsplash.com/photo-1529234316406-31a017689551?auto=format&fit=crop&w=1200&q=80', 'open book with pen and flowers')
) as v(id, image_url, image_alt)
where public.storefront_offerings.id = v.id
  and (public.storefront_offerings.image_url is null or btrim(public.storefront_offerings.image_url) = '');

commit;
