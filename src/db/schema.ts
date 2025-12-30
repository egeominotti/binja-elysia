import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Categories
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  parentId: integer('parent_id').references(() => categories.id),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('categories_slug_idx').on(table.slug),
  index('categories_parent_idx').on(table.parentId),
])

// Brands
export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  description: text('description'),
  website: text('website'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Products
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  price: real('price').notNull(),
  compareAtPrice: real('compare_at_price'),
  costPrice: real('cost_price'),
  categoryId: integer('category_id').references(() => categories.id),
  brandId: integer('brand_id').references(() => brands.id),
  stock: integer('stock').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  weight: real('weight'),
  dimensions: text('dimensions'), // JSON: { width, height, depth }
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  isNew: integer('is_new', { mode: 'boolean' }).default(false),
  isOnSale: integer('is_on_sale', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  avgRating: real('avg_rating').default(0),
  reviewCount: integer('review_count').default(0),
  viewCount: integer('view_count').default(0),
  soldCount: integer('sold_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('products_slug_idx').on(table.slug),
  index('products_sku_idx').on(table.sku),
  index('products_category_idx').on(table.categoryId),
  index('products_brand_idx').on(table.brandId),
  index('products_price_idx').on(table.price),
  index('products_featured_idx').on(table.isFeatured),
])

// Product Images
export const productImages = sqliteTable('product_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('product_images_product_idx').on(table.productId),
])

// Product Attributes (Size, Color, etc.)
export const attributes = sqliteTable('attributes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull().default('select'), // select, color, size
  isFilterable: integer('is_filterable', { mode: 'boolean' }).default(true),
  isRequired: integer('is_required', { mode: 'boolean' }).default(false),
})

// Attribute Values
export const attributeValues = sqliteTable('attribute_values', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  attributeId: integer('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
  slug: text('slug').notNull(),
  colorHex: text('color_hex'), // For color attributes
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('attr_values_attr_idx').on(table.attributeId),
])

// Product Variants (Combinations of attributes)
export const productVariants = sqliteTable('product_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull().unique(),
  price: real('price'),
  stock: integer('stock').default(0),
  image: text('image'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
}, (table) => [
  index('variants_product_idx').on(table.productId),
])

// Variant Attribute Values (Many-to-many)
export const variantAttributes = sqliteTable('variant_attributes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  variantId: integer('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  attributeValueId: integer('attribute_value_id').notNull().references(() => attributeValues.id, { onDelete: 'cascade' }),
}, (table) => [
  index('var_attr_variant_idx').on(table.variantId),
  index('var_attr_value_idx').on(table.attributeValueId),
])

// Product Tags
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const productTags = sqliteTable('product_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  index('product_tags_product_idx').on(table.productId),
  index('product_tags_tag_idx').on(table.tagId),
])

// Users
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  avatar: text('avatar'),
  role: text('role').notNull().default('customer'), // customer, admin
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('users_email_idx').on(table.email),
])

// User Addresses
export const addresses = sqliteTable('addresses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('shipping'), // shipping, billing
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  company: text('company'),
  address1: text('address1').notNull(),
  address2: text('address2'),
  city: text('city').notNull(),
  state: text('state'),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  phone: text('phone'),
}, (table) => [
  index('addresses_user_idx').on(table.userId),
])

// Wishlists
export const wishlists = sqliteTable('wishlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('wishlists_user_idx').on(table.userId),
  index('wishlists_product_idx').on(table.productId),
])

// Product Reviews
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title'),
  content: text('content'),
  isVerifiedPurchase: integer('is_verified_purchase', { mode: 'boolean' }).default(false),
  isApproved: integer('is_approved', { mode: 'boolean' }).default(false),
  helpfulCount: integer('helpful_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('reviews_product_idx').on(table.productId),
  index('reviews_user_idx').on(table.userId),
  index('reviews_rating_idx').on(table.rating),
])

// Coupons
export const coupons = sqliteTable('coupons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  description: text('description'),
  type: text('type').notNull().default('percentage'), // percentage, fixed, free_shipping
  value: real('value').notNull(),
  minOrderAmount: real('min_order_amount'),
  maxDiscount: real('max_discount'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0),
  userLimit: integer('user_limit').default(1), // Per user
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  startsAt: integer('starts_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('coupons_code_idx').on(table.code),
])

// Shopping Cart
export const carts = sqliteTable('carts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  couponId: integer('coupon_id').references(() => coupons.id),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('carts_user_idx').on(table.userId),
  index('carts_session_idx').on(table.sessionId),
])

// Cart Items
export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('cart_items_cart_idx').on(table.cartId),
  index('cart_items_product_idx').on(table.productId),
])

// Orders
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  status: text('status').notNull().default('pending'), // pending, processing, shipped, delivered, cancelled, refunded
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, paid, failed, refunded
  paymentMethod: text('payment_method'),
  subtotal: real('subtotal').notNull(),
  shippingCost: real('shipping_cost').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  total: real('total').notNull(),
  couponId: integer('coupon_id').references(() => coupons.id),
  couponCode: text('coupon_code'),
  currency: text('currency').notNull().default('EUR'),
  // Shipping Address
  shippingFirstName: text('shipping_first_name').notNull(),
  shippingLastName: text('shipping_last_name').notNull(),
  shippingCompany: text('shipping_company'),
  shippingAddress1: text('shipping_address1').notNull(),
  shippingAddress2: text('shipping_address2'),
  shippingCity: text('shipping_city').notNull(),
  shippingState: text('shipping_state'),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  shippingPhone: text('shipping_phone'),
  // Billing Address
  billingFirstName: text('billing_first_name'),
  billingLastName: text('billing_last_name'),
  billingCompany: text('billing_company'),
  billingAddress1: text('billing_address1'),
  billingAddress2: text('billing_address2'),
  billingCity: text('billing_city'),
  billingState: text('billing_state'),
  billingPostalCode: text('billing_postal_code'),
  billingCountry: text('billing_country'),
  // Tracking
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier'),
  notes: text('notes'),
  customerNotes: text('customer_notes'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('orders_number_idx').on(table.orderNumber),
  index('orders_user_idx').on(table.userId),
  index('orders_status_idx').on(table.status),
  index('orders_created_idx').on(table.createdAt),
])

// Order Items
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  total: real('total').notNull(),
  options: text('options'), // JSON: variant options
}, (table) => [
  index('order_items_order_idx').on(table.orderId),
])

// Order History
export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  comment: text('comment'),
  isCustomerNotified: integer('is_customer_notified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('order_history_order_idx').on(table.orderId),
])

// Shipping Methods
export const shippingMethods = sqliteTable('shipping_methods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  freeAbove: real('free_above'),
  estimatedDays: text('estimated_days'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
})

// Settings
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type').notNull().default('string'), // string, number, boolean, json
})

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
  tags: many(productTags),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}))

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  history: many(orderHistory),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
  coupon: one(coupons, {
    fields: [carts.couponId],
    references: [coupons.id],
  }),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  attributes: many(variantAttributes),
}))

export const variantAttributesRelations = relations(variantAttributes, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantAttributes.variantId],
    references: [productVariants.id],
  }),
  attributeValue: one(attributeValues, {
    fields: [variantAttributes.attributeValueId],
    references: [attributeValues.id],
  }),
}))

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(attributeValues),
}))

export const attributeValuesRelations = relations(attributeValues, ({ one }) => ({
  attribute: one(attributes, {
    fields: [attributeValues.attributeId],
    references: [attributes.id],
  }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  products: many(productTags),
}))

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}))
