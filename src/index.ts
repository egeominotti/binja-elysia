import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { cookie } from '@elysiajs/cookie'
import { render } from './lib/templates'
import { productService } from './services/product.service'
import { categoryService } from './services/category.service'
import { brandService } from './services/brand.service'
import { cartService } from './services/cart.service'
import { nanoid } from 'nanoid'

// Configuration - centralized values
const CONFIG = {
  TAX_RATE: 0.22, // 22% VAT (Italy)
  FREE_SHIPPING_THRESHOLD: 100, // Free shipping above this amount
  SHIPPING_METHODS: [
    { id: 1, name: 'Standard Shipping', description: '5-7 business days', price: 5.99, freeAbove: 100, estimatedDays: '5-7' },
    { id: 2, name: 'Express Shipping', description: '2-3 business days', price: 12.99, estimatedDays: '2-3' },
    { id: 3, name: 'Next Day', description: 'Next business day', price: 24.99, estimatedDays: '1' }
  ]
}

// Session middleware
const sessionMiddleware = new Elysia({ name: 'session' })
  .derive({ as: 'global' }, async ({ cookie: { session_id } }) => {
    let sessionId = session_id.value
    if (!sessionId) {
      sessionId = nanoid()
      session_id.set({
        value: sessionId,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }
    return { sessionId }
  })

// Cart middleware
const cartMiddleware = new Elysia({ name: 'cart' })
  .use(sessionMiddleware)
  .derive({ as: 'global' }, async ({ sessionId }) => {
    const cart = await cartService.getOrCreateCart(undefined, sessionId as string)
    return { cart }
  })

// Common context middleware (categories, brands for nav)
const commonContext = new Elysia({ name: 'common' })
  .derive({ as: 'global' }, async () => {
    const [categories, brands] = await Promise.all([
      categoryService.getAllCategories(),
      brandService.getAllBrands()
    ])
    return { categories, brands }
  })

// Main app
const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: 'public', prefix: '/' }))
  .use(cookie())
  .use(sessionMiddleware)
  .use(cartMiddleware)
  .use(commonContext)

  // Home Page
  .get('/', async ({ categories, brands, cart }) => {
    const [featured_products, new_products, sale_products] = await Promise.all([
      productService.getFeaturedProducts(8),
      productService.getNewProducts(8),
      productService.getSaleProducts(4)
    ])

    return render('pages/home.html', {
      categories,
      brands,
      featured_products,
      new_products,
      sale_products,
      cart,
      cart_count: cart.items.length,
      request_path: '/'
    })
  })

  // Products List
  .get('/products', async ({ query, categories, brands, cart }) => {
    const page = parseInt(query.page as string) || 1
    const perPage = parseInt(query.per_page as string) || 12
    const sort = (query.sort as string) || 'relevance'

    const filters = {
      category: query.category as string,
      brand: query.brand as string,
      minPrice: query.price_min ? parseFloat(query.price_min as string) : undefined,
      maxPrice: query.price_max ? parseFloat(query.price_max as string) : undefined,
      inStock: query.in_stock === '1',
      featured: query.featured === '1',
      sale: query.sale === '1',
      new: query.new === '1',
      rating: query.rating ? parseInt(query.rating as string) : undefined,
      search: query.q as string
    }

    const result = await productService.getProducts(filters, { page, perPage, sort })

    // Build pagination pages
    const paginationPages = []
    for (let i = 1; i <= result.pagination.totalPages; i++) {
      if (
        i === 1 ||
        i === result.pagination.totalPages ||
        (i >= page - 2 && i <= page + 2)
      ) {
        paginationPages.push({
          number: i,
          current: i === page,
          url: `/products?${new URLSearchParams({ ...query as any, page: i.toString() })}`
        })
      } else if (paginationPages[paginationPages.length - 1] !== '...') {
        paginationPages.push('...')
      }
    }

    // Get filter options
    const [filter_categories, filter_brands] = await Promise.all([
      categoryService.getCategoriesWithProductCount(),
      brandService.getBrandsWithProductCount()
    ])

    return render('pages/products.html', {
      products: result.products,
      pagination: {
        ...result.pagination,
        pages: paginationPages,
        prevUrl: page > 1 ? `/products?${new URLSearchParams({ ...query as any, page: (page - 1).toString() })}` : '#',
        nextUrl: page < result.pagination.totalPages ? `/products?${new URLSearchParams({ ...query as any, page: (page + 1).toString() })}` : '#'
      },
      filters,
      sort,
      per_page: perPage,
      search_query: query.q,
      categories,
      brands,
      filter_categories,
      filter_brands,
      active_filters: Object.entries(filters)
        .filter(([_, v]) => v)
        .map(([key, value]) => ({ key, value, label: `${key}: ${value}` })),
      cart,
      cart_count: cart.items.length,
      request_path: '/products'
    })
  })

  // Category Products
  .get('/category/:slug', async ({ params, query, categories, brands, cart }) => {
    const category = await categoryService.getCategoryBySlug(params.slug)
    if (!category) {
      return new Response('Category not found', { status: 404 })
    }

    const page = parseInt(query.page as string) || 1
    const perPage = parseInt(query.per_page as string) || 12
    const sort = (query.sort as string) || 'relevance'

    const result = await productService.getProducts(
      { category: params.slug },
      { page, perPage, sort }
    )

    return render('pages/products.html', {
      products: result.products,
      pagination: result.pagination,
      category,
      page_title: category.name,
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: `/category/${params.slug}`
    })
  })

  // Brand Products
  .get('/brand/:slug', async ({ params, query, categories, brands, cart }) => {
    const brand = await brandService.getBrandBySlug(params.slug)
    if (!brand) {
      return new Response('Brand not found', { status: 404 })
    }

    const page = parseInt(query.page as string) || 1
    const perPage = parseInt(query.per_page as string) || 12
    const sort = (query.sort as string) || 'relevance'

    const result = await productService.getProducts(
      { brand: params.slug },
      { page, perPage, sort }
    )

    return render('pages/products.html', {
      products: result.products,
      pagination: result.pagination,
      brand,
      page_title: brand.name,
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: `/brand/${params.slug}`
    })
  })

  // Product Detail
  .get('/products/:slug', async ({ params, categories, brands, cart }) => {
    const product = await productService.getProductBySlug(params.slug)
    if (!product) {
      return new Response('Product not found', { status: 404 })
    }

    const related_products = await productService.getRelatedProducts(
      product.id,
      product.categoryId,
      4
    )

    // Calculate rating distribution
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    product.reviews?.forEach((r: any) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1
    })

    const totalReviews = product.reviews?.length || 1
    Object.keys(ratingCounts).forEach(key => {
      ratingDistribution[parseInt(key)] = (ratingCounts[parseInt(key)] / totalReviews) * 100
    })

    return render('pages/product-detail.html', {
      product,
      reviews: product.reviews || [],
      related_products,
      rating_counts: ratingCounts,
      rating_distribution: ratingDistribution,
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: `/products/${params.slug}`,
      request_url: `${Bun.env.BASE_URL || 'http://localhost:3000'}/products/${params.slug}`
    })
  })

  // Cart Page
  .get('/cart', async ({ categories, brands, cart }) => {
    const suggested_products = await productService.getFeaturedProducts(4)

    return render('pages/cart.html', {
      cart,
      suggested_products,
      categories,
      brands,
      cart_count: cart.items.length,
      request_path: '/cart'
    })
  })

  // Checkout Page
  .get('/checkout', async ({ categories, brands, cart }) => {
    if (cart.items.length === 0) {
      return Response.redirect('/cart')
    }

    // Use centralized config for shipping methods
    const shipping_methods = CONFIG.SHIPPING_METHODS

    // Calculate initial shipping (free above threshold)
    const shippingCost = cart.subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : shipping_methods[0].price
    const tax = (cart.subtotal - cart.discount) * CONFIG.TAX_RATE

    return render('pages/checkout.html', {
      cart,
      shipping_methods,
      shipping_cost: shippingCost,
      tax,
      tax_rate: CONFIG.TAX_RATE,
      categories,
      brands,
      cart_count: cart.items.length,
      request_path: '/checkout'
    })
  })

  // Login Page
  .get('/login', async ({ categories, brands, cart }) => {
    return render('pages/login.html', {
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: '/login'
    })
  })

  // Register Page
  .get('/register', async ({ categories, brands, cart }) => {
    return render('pages/register.html', {
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: '/register'
    })
  })

  // Account Page
  .get('/account', async ({ categories, brands, cart }) => {
    // Demo user for showcase
    const user = {
      id: 1,
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      avatar: null
    }

    return render('pages/account.html', {
      user,
      orders_count: 3,
      wishlist_count: 5,
      reviews_count: 2,
      recent_orders: [],
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      is_authenticated: true,
      request_path: '/account'
    })
  })

  // Logout
  .get('/logout', async ({ cookie: { session_id } }) => {
    session_id.remove()
    return Response.redirect('/login')
  })

  // Wishlist Page
  .get('/account/wishlist', async ({ categories, brands, cart }) => {
    // Get featured products as demo wishlist items
    const wishlistProducts = await productService.getFeaturedProducts(4)
    const wishlist_items = wishlistProducts.map((p, i) => ({
      id: i + 1,
      product: p
    }))

    return render('pages/wishlist.html', {
      wishlist_items,
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      is_authenticated: true,
      request_path: '/account/wishlist'
    })
  })

  // Search
  .get('/search', async ({ query, categories, brands, cart }) => {
    const searchQuery = query.q as string

    if (!searchQuery) {
      return Response.redirect('/products')
    }

    const result = await productService.getProducts(
      { search: searchQuery },
      { page: 1, perPage: 24, sort: 'relevance' }
    )

    return render('pages/products.html', {
      products: result.products,
      pagination: result.pagination,
      search_query: searchQuery,
      page_title: `Search: ${searchQuery}`,
      categories,
      brands,
      cart,
      cart_count: cart.items.length,
      request_path: '/search'
    })
  })

  // ============ API Routes ============

  // Search API
  .get('/api/search', async ({ query }) => {
    const q = query.q as string
    if (!q || q.length < 2) {
      return { products: [] }
    }

    const products = await productService.searchProducts(q, 10)
    return {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: (p.images as any[])?.[0]?.url
      }))
    }
  })

  // Get product by ID
  .get('/api/products/:id', async ({ params }) => {
    const product = await productService.getProductById(parseInt(params.id))
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return product
  })

  // Cart API
  .post('/api/cart/add', async ({ body, cart }) => {
    try {
      const { productId, quantity = 1, options } = body as any

      const updatedCart = await cartService.addToCart(cart.id, {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        options
      })

      return {
        success: true,
        cart: updatedCart,
        cartCount: updatedCart.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .patch('/api/cart/update/:itemId', async ({ params, body, cart }) => {
    try {
      const { quantity } = body as any
      const updatedCart = await cartService.updateCartItem(
        cart.id,
        parseInt(params.itemId),
        parseInt(quantity)
      )

      return {
        success: true,
        cart: updatedCart,
        cartCount: updatedCart.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .delete('/api/cart/remove/:itemId', async ({ params, cart }) => {
    try {
      const updatedCart = await cartService.removeFromCart(cart.id, parseInt(params.itemId))

      return {
        success: true,
        cart: updatedCart,
        cartCount: updatedCart.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .delete('/api/cart/clear', async ({ cart }) => {
    try {
      await cartService.clearCart(cart.id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .post('/api/cart/coupon', async ({ body, cart }) => {
    try {
      const { code } = body as any
      const updatedCart = await cartService.applyCoupon(cart.id, code)

      return {
        success: true,
        cart: updatedCart
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .delete('/api/cart/coupon', async ({ cart }) => {
    try {
      const updatedCart = await cartService.removeCoupon(cart.id)

      return {
        success: true,
        cart: updatedCart
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Wishlist API (simplified - would need user auth in real app)
  .post('/api/wishlist/toggle', async ({ body }) => {
    const { productId: _ } = body as any
    // Simplified - just return success (productId would be used in real implementation)
    return {
      success: true,
      inWishlist: true
    }
  })

  // Error handling
  .onError(({ code, error, set }) => {
    console.error(`Error [${code}]:`, error)

    // Handle different Elysia error codes
    if (code === 'UNKNOWN') {
      set.status = 404
      return 'Page not found'
    }

    if (code === 'VALIDATION') {
      set.status = 400
      return 'Invalid request'
    }

    set.status = 500
    return 'Internal server error'
  })

  .listen(3000)

console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🛒 TechStore E-Commerce                                 ║
  ║                                                           ║
  ║   Server running at: http://localhost:${app.server?.port}              ║
  ║                                                           ║
  ║   Powered by Elysia + Binja                               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
`)

export type App = typeof app
