export const PROMO_VIDEO_EMBED_URL = process.env.NEXT_PUBLIC_PROMO_VIDEO_URL?.trim() ?? '';

export const fallbackSlides = [
  {
    title: 'Premium Digital Products Delivered Instantly',
    subtitle: 'Discover curated software, templates, and digital assets for creators and professionals',
    imageUrl: '/icon.png',
  },
  {
    title: 'Your Digital Marketplace',
    subtitle: 'Secure payments, instant delivery, and lifetime access to your purchases',
    imageUrl: '/icon.png',
  },
];

export const fallbackReviews = [
  {
    id: -1,
    rating: 5,
    title: 'Exceptional Quality',
    body: 'The digital products exceeded my expectations. Checkout was seamless and delivery was instant.',
    product_name: 'Premium Collection',
    product_slug: 'premium-collection',
    is_verified_purchase: true,
    reviewer_name: 'Verified customer',
    image_path: null,
  },
  {
    id: -2,
    rating: 5,
    title: 'Outstanding Support',
    body: 'The team was incredibly responsive and helpful throughout the entire process.',
    product_name: 'Digital Bundle',
    product_slug: 'digital-bundle',
    is_verified_purchase: true,
    reviewer_name: 'Verified customer',
    image_path: null,
  },
  {
    id: -3,
    rating: 4,
    title: 'Great Value',
    body: 'Excellent products at competitive prices. The platform is user-friendly and reliable.',
    product_name: 'Creative Suite',
    product_slug: 'creative-suite',
    is_verified_purchase: true,
    reviewer_name: 'Verified customer',
    image_path: null,
  },
];

