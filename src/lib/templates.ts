import { Environment } from 'binja'

// Custom filters for e-commerce
const customFilters = {
  // Currency formatting
  currency: (value: number, currency: string = 'EUR', locale: string = 'it-IT') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value)
  },

  // Percentage formatting
  percent: (value: number, decimals: number = 0) => {
    return `${(value * 100).toFixed(decimals)}%`
  },

  // Calculate discount percentage
  discount_percent: (price: number, compareAtPrice: number) => {
    if (!compareAtPrice || compareAtPrice <= price) return 0
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  },

  // Format rating as stars
  stars: (rating: number, maxStars: number = 5) => {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0)
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars)
  },

  // Rating as HTML stars
  stars_html: (rating: number, maxStars: number = 5) => {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0)
    let html = '<span class="stars">'
    html += '<i class="star full"></i>'.repeat(fullStars)
    if (halfStar) html += '<i class="star half"></i>'
    html += '<i class="star empty"></i>'.repeat(emptyStars)
    html += '</span>'
    return html
  },

  // Stock status badge
  stock_status: (stock: number, lowThreshold: number = 5) => {
    if (stock === 0) return '<span class="badge badge-danger">Out of Stock</span>'
    if (stock <= lowThreshold) return `<span class="badge badge-warning">Only ${stock} left</span>`
    return '<span class="badge badge-success">In Stock</span>'
  },

  // Stock class
  stock_class: (stock: number, lowThreshold: number = 5) => {
    if (stock === 0) return 'out-of-stock'
    if (stock <= lowThreshold) return 'low-stock'
    return 'in-stock'
  },

  // Order status badge
  order_status: (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: 'Pending', class: 'badge-secondary' },
      processing: { label: 'Processing', class: 'badge-info' },
      shipped: { label: 'Shipped', class: 'badge-primary' },
      delivered: { label: 'Delivered', class: 'badge-success' },
      cancelled: { label: 'Cancelled', class: 'badge-danger' },
      refunded: { label: 'Refunded', class: 'badge-warning' },
    }
    const s = statusMap[status] || { label: status, class: 'badge-secondary' }
    return `<span class="badge ${s.class}">${s.label}</span>`
  },

  // Payment status badge
  payment_status: (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: 'Pending', class: 'badge-warning' },
      paid: { label: 'Paid', class: 'badge-success' },
      failed: { label: 'Failed', class: 'badge-danger' },
      refunded: { label: 'Refunded', class: 'badge-info' },
    }
    const s = statusMap[status] || { label: status, class: 'badge-secondary' }
    return `<span class="badge ${s.class}">${s.label}</span>`
  },

  // Image placeholder
  placeholder_image: (width: number = 300, height: number = 300, text: string = '') => {
    const t = text || `${width}x${height}`
    return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(t)}`
  },

  // Product image with fallback
  product_image: (url: string | null, alt: string = 'Product') => {
    const src = url || '/images/placeholder.jpg'
    return `<img src="${src}" alt="${alt}" loading="lazy" class="product-image">`
  },

  // Truncate with read more
  truncate_more: (text: string, length: number = 100, url: string = '#') => {
    if (!text || text.length <= length) return text
    return `${text.slice(0, length)}... <a href="${url}" class="read-more">Read more</a>`
  },

  // Human readable number (1000 -> 1K)
  humanize_number: (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  },

  // Format phone number
  phone_format: (phone: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  },

  // Generate initials
  initials: (name: string) => {
    if (!name) return ''
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  // Color swatch HTML
  color_swatch: (color: string, hex: string, selected: boolean = false) => {
    const selectedClass = selected ? 'selected' : ''
    return `<span class="color-swatch ${selectedClass}" style="background-color: ${hex}" title="${color}"></span>`
  },

  // Size button HTML
  size_button: (size: string, available: boolean = true, selected: boolean = false) => {
    const disabledClass = available ? '' : 'disabled'
    const selectedClass = selected ? 'selected' : ''
    return `<button class="size-btn ${disabledClass} ${selectedClass}" ${available ? '' : 'disabled'}>${size}</button>`
  },

  // Breadcrumb item
  breadcrumb: (items: Array<{ name: string; url?: string }>) => {
    return items
      .map((item, index) => {
        const isLast = index === items.length - 1
        if (isLast) {
          return `<span class="breadcrumb-item active">${item.name}</span>`
        }
        return `<a href="${item.url || '#'}" class="breadcrumb-item">${item.name}</a>`
      })
      .join(' <span class="breadcrumb-separator">/</span> ')
  },

  // Pagination info
  pagination_info: (page: number, perPage: number, total: number) => {
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `Showing ${start}-${end} of ${total} items`
  },

  // Generate query string from object
  query_string: (params: Record<string, any>, baseUrl: string = '') => {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    return query ? `${baseUrl}?${query}` : baseUrl
  },

  // Check if value is in array
  in_array: (value: any, arr: any[]) => {
    return arr?.includes(value) ?? false
  },

  // Format weight
  weight_format: (weight: number, unit: string = 'kg') => {
    if (unit === 'kg' && weight < 1) {
      return `${(weight * 1000).toFixed(0)}g`
    }
    return `${weight}${unit}`
  },

  // Calculate cart total
  cart_total: (items: Array<{ price: number; quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  // Cart item count
  cart_count: (items: Array<{ quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // Relative time (2 hours ago, yesterday, etc.)
  time_ago: (date: Date | string | number) => {
    const d = new Date(date)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ]

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds)
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
      }
    }
    return 'just now'
  },

  // JSON encode for data attributes
  json_attr: (value: any) => {
    return JSON.stringify(value).replace(/"/g, '&quot;')
  },

  // Create meta tags
  meta_tags: (product: { name: string; shortDescription?: string; description?: string }) => {
    const desc = product.shortDescription || product.description || ''
    return `<meta name="description" content="${desc.slice(0, 160)}">
<meta property="og:title" content="${product.name}">
<meta property="og:description" content="${desc.slice(0, 200)}">`
  },

  // Range filter
  range: (start: number, end: number, step: number = 1) => {
    const result = []
    for (let i = start; i <= end; i += step) {
      result.push(i)
    }
    return result
  },

  // Group products by attribute
  group_by_category: (products: Array<{ categoryId: number }>) => {
    return products.reduce((groups: Record<number, any[]>, product) => {
      const key = product.categoryId
      if (!groups[key]) groups[key] = []
      groups[key].push(product)
      return groups
    }, {})
  },

  // Sort by
  sort_by: (arr: any[], key: string, order: 'asc' | 'desc' = 'asc') => {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      if (order === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })
  },

  // Filter by attribute
  filter_by: (arr: any[], key: string, value: any) => {
    return arr.filter(item => item[key] === value)
  },

  // Chunk array
  chunk: (arr: any[], size: number) => {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  // Pick specific keys from object
  pick: (obj: Record<string, any>, keys: string[]) => {
    return keys.reduce((result: Record<string, any>, key) => {
      if (key in obj) result[key] = obj[key]
      return result
    }, {})
  },

  // Conditional class
  class_if: (condition: boolean, trueClass: string, falseClass: string = '') => {
    return condition ? trueClass : falseClass
  },

  // Price range display
  price_range: (min: number, max: number, currency: string = 'EUR') => {
    const format = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(v)
    if (min === max) return format(min)
    return `${format(min)} - ${format(max)}`
  },

  // SEO-friendly URL
  seo_url: (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  },
}

// Global variables
const globals = {
  site_name: 'TechStore',
  site_tagline: 'Your Premium E-Commerce Destination',
  current_year: new Date().getFullYear(),
  currency_symbol: '€',
  currency_code: 'EUR',
  support_email: 'support@techstore.com',
  support_phone: '+39 02 1234567',
  social_links: {
    facebook: 'https://facebook.com/techstore',
    twitter: 'https://twitter.com/techstore',
    instagram: 'https://instagram.com/techstore',
    youtube: 'https://youtube.com/techstore',
  },
  free_shipping_threshold: 100,
}

// Create Environment
export const templates = new Environment({
  templates: './templates',
  autoescape: true,
  cache: true,
  cacheMaxSize: 200,
  timezone: 'Europe/Rome',
  debug: Bun.env.NODE_ENV !== 'production',
  debugOptions: {
    dark: true,
    position: 'bottom-right',
    collapsed: true,
  },
  filters: customFilters,
  globals,
  urlResolver: (name: string, ...args: any[]) => {
    const routes: Record<string, string> = {
      home: '/',
      products: '/products',
      product: `/products/${args[0] || ':slug'}`,
      category: `/category/${args[0] || ':slug'}`,
      brand: `/brand/${args[0] || ':slug'}`,
      cart: '/cart',
      checkout: '/checkout',
      account: '/account',
      login: '/login',
      register: '/register',
      orders: '/account/orders',
      wishlist: '/account/wishlist',
      search: '/search',
    }
    return routes[name] || '/'
  },
  staticResolver: (path: string) => `/static/${path}`,
})

// Helper to render with consistent context
export async function render(template: string, context: Record<string, any> = {}) {
  const html = await templates.render(template, {
    ...context,
    request_path: context.request_path || '/',
    is_authenticated: context.user !== undefined,
    cart_count: context.cart?.items?.length || 0,
  })

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
