import { db } from './index'
import * as schema from './schema'
import { mkdir } from 'fs/promises'

async function seed() {
  console.log('Seeding database...')

  // Create data directory
  await mkdir('./data', { recursive: true })

  // Categories
  const [electronics] = await db.insert(schema.categories).values([
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', sortOrder: 1 },
  ]).returning()

  const [clothing] = await db.insert(schema.categories).values([
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', sortOrder: 2 },
  ]).returning()

  const [home] = await db.insert(schema.categories).values([
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home decor and garden supplies', sortOrder: 3 },
  ]).returning()

  // Subcategories
  await db.insert(schema.categories).values([
    { name: 'Smartphones', slug: 'smartphones', parentId: electronics.id, sortOrder: 1 },
    { name: 'Laptops', slug: 'laptops', parentId: electronics.id, sortOrder: 2 },
    { name: 'Audio', slug: 'audio', parentId: electronics.id, sortOrder: 3 },
    { name: 'Accessories', slug: 'accessories', parentId: electronics.id, sortOrder: 4 },
    { name: 'Men', slug: 'men', parentId: clothing.id, sortOrder: 1 },
    { name: 'Women', slug: 'women', parentId: clothing.id, sortOrder: 2 },
    { name: 'Kids', slug: 'kids', parentId: clothing.id, sortOrder: 3 },
    { name: 'Furniture', slug: 'furniture', parentId: home.id, sortOrder: 1 },
    { name: 'Kitchen', slug: 'kitchen', parentId: home.id, sortOrder: 2 },
    { name: 'Garden', slug: 'garden', parentId: home.id, sortOrder: 3 },
  ])

  // Brands
  const brands = await db.insert(schema.brands).values([
    { name: 'Apple', slug: 'apple', description: 'Think Different', website: 'https://apple.com' },
    { name: 'Samsung', slug: 'samsung', description: 'Do What You Can\'t', website: 'https://samsung.com' },
    { name: 'Sony', slug: 'sony', description: 'Be Moved', website: 'https://sony.com' },
    { name: 'Nike', slug: 'nike', description: 'Just Do It', website: 'https://nike.com' },
    { name: 'Adidas', slug: 'adidas', description: 'Impossible Is Nothing', website: 'https://adidas.com' },
    { name: 'IKEA', slug: 'ikea', description: 'The Wonderful Everyday', website: 'https://ikea.com' },
  ]).returning()

  // Attributes
  const [sizeAttr] = await db.insert(schema.attributes).values([
    { name: 'Size', slug: 'size', type: 'size', isFilterable: true },
  ]).returning()

  const [colorAttr] = await db.insert(schema.attributes).values([
    { name: 'Color', slug: 'color', type: 'color', isFilterable: true },
  ]).returning()

  const [storageAttr] = await db.insert(schema.attributes).values([
    { name: 'Storage', slug: 'storage', type: 'select', isFilterable: true },
  ]).returning()

  // Attribute Values
  await db.insert(schema.attributeValues).values([
    // Sizes
    { attributeId: sizeAttr.id, value: 'XS', slug: 'xs', sortOrder: 1 },
    { attributeId: sizeAttr.id, value: 'S', slug: 's', sortOrder: 2 },
    { attributeId: sizeAttr.id, value: 'M', slug: 'm', sortOrder: 3 },
    { attributeId: sizeAttr.id, value: 'L', slug: 'l', sortOrder: 4 },
    { attributeId: sizeAttr.id, value: 'XL', slug: 'xl', sortOrder: 5 },
    { attributeId: sizeAttr.id, value: 'XXL', slug: 'xxl', sortOrder: 6 },
    // Colors
    { attributeId: colorAttr.id, value: 'Black', slug: 'black', colorHex: '#000000', sortOrder: 1 },
    { attributeId: colorAttr.id, value: 'White', slug: 'white', colorHex: '#FFFFFF', sortOrder: 2 },
    { attributeId: colorAttr.id, value: 'Red', slug: 'red', colorHex: '#EF4444', sortOrder: 3 },
    { attributeId: colorAttr.id, value: 'Blue', slug: 'blue', colorHex: '#3B82F6', sortOrder: 4 },
    { attributeId: colorAttr.id, value: 'Green', slug: 'green', colorHex: '#22C55E', sortOrder: 5 },
    { attributeId: colorAttr.id, value: 'Gold', slug: 'gold', colorHex: '#F59E0B', sortOrder: 6 },
    // Storage
    { attributeId: storageAttr.id, value: '64GB', slug: '64gb', sortOrder: 1 },
    { attributeId: storageAttr.id, value: '128GB', slug: '128gb', sortOrder: 2 },
    { attributeId: storageAttr.id, value: '256GB', slug: '256gb', sortOrder: 3 },
    { attributeId: storageAttr.id, value: '512GB', slug: '512gb', sortOrder: 4 },
    { attributeId: storageAttr.id, value: '1TB', slug: '1tb', sortOrder: 5 },
  ])

  // Tags
  await db.insert(schema.tags).values([
    { name: 'Best Seller', slug: 'best-seller' },
    { name: 'New Arrival', slug: 'new-arrival' },
    { name: 'Limited Edition', slug: 'limited-edition' },
    { name: 'Sale', slug: 'sale' },
    { name: 'Eco Friendly', slug: 'eco-friendly' },
    { name: 'Premium', slug: 'premium' },
  ])

  // Products
  const productsData = [
    {
      sku: 'IPHONE15-PRO',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'The most powerful iPhone ever. Featuring A17 Pro chip, titanium design, and advanced camera system.',
      shortDescription: 'Pro. Beyond.',
      price: 1199.00,
      compareAtPrice: 1299.00,
      categoryId: 2, // Smartphones
      brandId: 1, // Apple
      stock: 50,
      isFeatured: true,
      isNew: true,
      avgRating: 4.8,
      reviewCount: 124,
      viewCount: 5420,
      soldCount: 89,
    },
    {
      sku: 'GALAXY-S24',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with the new titanium frame.',
      shortDescription: 'Ultra. Elevated.',
      price: 1299.00,
      categoryId: 2,
      brandId: 2,
      stock: 35,
      isFeatured: true,
      avgRating: 4.7,
      reviewCount: 89,
      viewCount: 3210,
      soldCount: 45,
    },
    {
      sku: 'MACBOOK-PRO-16',
      name: 'MacBook Pro 16"',
      slug: 'macbook-pro-16',
      description: 'The most powerful MacBook Pro ever is here. With M3 Pro or M3 Max chip.',
      shortDescription: 'Pro to the Max.',
      price: 2499.00,
      compareAtPrice: 2699.00,
      categoryId: 3, // Laptops
      brandId: 1,
      stock: 20,
      isFeatured: true,
      avgRating: 4.9,
      reviewCount: 67,
      viewCount: 2890,
      soldCount: 34,
    },
    {
      sku: 'SONY-WH1000',
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'Industry-leading noise canceling with Auto NC Optimizer. Exceptionally clear hands-free calling.',
      shortDescription: 'Silence the noise.',
      price: 349.00,
      compareAtPrice: 399.00,
      categoryId: 4, // Audio
      brandId: 3,
      stock: 100,
      isOnSale: true,
      avgRating: 4.6,
      reviewCount: 234,
      viewCount: 8920,
      soldCount: 456,
    },
    {
      sku: 'AIRPODS-PRO',
      name: 'AirPods Pro (2nd Gen)',
      slug: 'airpods-pro-2',
      description: 'Rebuilt from the sound up. Active Noise Cancellation and Adaptive Audio.',
      shortDescription: 'Rebuilt from the sound up.',
      price: 249.00,
      categoryId: 4,
      brandId: 1,
      stock: 150,
      isFeatured: true,
      isNew: true,
      avgRating: 4.7,
      reviewCount: 567,
      viewCount: 12340,
      soldCount: 890,
    },
    {
      sku: 'NIKE-AIRMAX',
      name: 'Nike Air Max 90',
      slug: 'nike-air-max-90',
      description: 'Lace up and feel the legacy. The Air Max 90 stays true to its OG roots.',
      shortDescription: 'Nothing but iconic.',
      price: 130.00,
      categoryId: 6, // Men
      brandId: 4,
      stock: 200,
      avgRating: 4.5,
      reviewCount: 890,
      viewCount: 15670,
      soldCount: 1234,
    },
    {
      sku: 'ADIDAS-ULTRA',
      name: 'Adidas Ultraboost Light',
      slug: 'adidas-ultraboost-light',
      description: 'Experience epic energy return with the new Ultraboost Light. 30% lighter than before.',
      shortDescription: 'Lighter. Faster. Better.',
      price: 190.00,
      compareAtPrice: 220.00,
      categoryId: 6,
      brandId: 5,
      stock: 85,
      isOnSale: true,
      avgRating: 4.4,
      reviewCount: 456,
      viewCount: 7890,
      soldCount: 567,
    },
    {
      sku: 'IKEA-MALM',
      name: 'IKEA MALM Bed Frame',
      slug: 'ikea-malm-bed-frame',
      description: 'Simple, clean design that works with any style. High headboard provides support when sitting up.',
      shortDescription: 'Real wood. Real quality.',
      price: 299.00,
      categoryId: 9, // Furniture
      brandId: 6,
      stock: 45,
      avgRating: 4.3,
      reviewCount: 234,
      viewCount: 5670,
      soldCount: 123,
    },
    {
      sku: 'IPAD-PRO',
      name: 'iPad Pro 12.9"',
      slug: 'ipad-pro-12-9',
      description: 'The ultimate iPad experience with the M2 chip. Pro performance, Pro workflow.',
      shortDescription: 'Supercharged by M2.',
      price: 1099.00,
      categoryId: 2,
      brandId: 1,
      stock: 30,
      isFeatured: true,
      avgRating: 4.8,
      reviewCount: 189,
      viewCount: 6780,
      soldCount: 156,
    },
    {
      sku: 'SAMSUNG-TV',
      name: 'Samsung 65" OLED 4K',
      slug: 'samsung-65-oled-4k',
      description: 'Immersive 4K OLED display with Neural Quantum Processor and Dolby Atmos.',
      shortDescription: 'Brilliance in every pixel.',
      price: 1799.00,
      compareAtPrice: 2199.00,
      categoryId: 1,
      brandId: 2,
      stock: 15,
      isOnSale: true,
      isFeatured: true,
      avgRating: 4.6,
      reviewCount: 78,
      viewCount: 4560,
      soldCount: 34,
    },
  ]

  for (const product of productsData) {
    const [inserted] = await db.insert(schema.products).values(product).returning()

    // Add images
    await db.insert(schema.productImages).values([
      { productId: inserted.id, url: `/images/products/${inserted.slug}.svg`, alt: inserted.name, isPrimary: true, sortOrder: 1 },
    ])
  }

  // Coupons
  await db.insert(schema.coupons).values([
    { code: 'WELCOME10', description: '10% off for new customers', type: 'percentage', value: 10, minOrderAmount: 50 },
    { code: 'SAVE20', description: '20% off orders over 200', type: 'percentage', value: 20, minOrderAmount: 200, maxDiscount: 100 },
    { code: 'FLAT50', description: '50 off your order', type: 'fixed', value: 50, minOrderAmount: 150 },
    { code: 'FREESHIP', description: 'Free shipping on any order', type: 'free_shipping', value: 0, minOrderAmount: 0 },
  ])

  // Shipping Methods
  await db.insert(schema.shippingMethods).values([
    { name: 'Standard Shipping', description: 'Delivery in 5-7 business days', price: 5.99, freeAbove: 100, estimatedDays: '5-7', sortOrder: 1 },
    { name: 'Express Shipping', description: 'Delivery in 2-3 business days', price: 12.99, estimatedDays: '2-3', sortOrder: 2 },
    { name: 'Next Day Delivery', description: 'Delivery next business day', price: 24.99, estimatedDays: '1', sortOrder: 3 },
  ])

  // Demo user
  await db.insert(schema.users).values({
    email: 'demo@example.com',
    passwordHash: await Bun.password.hash('demo123'),
    firstName: 'Demo',
    lastName: 'User',
    role: 'customer',
  })

  // Admin user
  await db.insert(schema.users).values({
    email: 'admin@example.com',
    passwordHash: await Bun.password.hash('admin123'),
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  })

  console.log('Database seeded successfully!')
}

seed().catch(console.error)
