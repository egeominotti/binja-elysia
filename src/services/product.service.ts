import { db, products, productImages, categories, brands, reviews, productTags, tags } from '../db'
import { eq, and, or, gte, lte, like, desc, asc, sql, inArray } from 'drizzle-orm'

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
  sale?: boolean
  new?: boolean
  rating?: number
  search?: string
  tags?: string[]
}

export interface PaginationOptions {
  page: number
  perPage: number
  sort: string
}

export class ProductService {
  async getProducts(filters: ProductFilters = {}, pagination: PaginationOptions = { page: 1, perPage: 12, sort: 'relevance' }) {
    const conditions: any[] = [eq(products.isActive, true)]

    // Category filter
    if (filters.category) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, filters.category)
      })
      if (category) {
        conditions.push(eq(products.categoryId, category.id))
      }
    }

    // Brand filter
    if (filters.brand) {
      const brand = await db.query.brands.findFirst({
        where: eq(brands.slug, filters.brand)
      })
      if (brand) {
        conditions.push(eq(products.brandId, brand.id))
      }
    }

    // Price range
    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice))
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice))
    }

    // Stock filter
    if (filters.inStock) {
      conditions.push(sql`${products.stock} > 0`)
    }

    // Featured
    if (filters.featured) {
      conditions.push(eq(products.isFeatured, true))
    }

    // On sale
    if (filters.sale) {
      conditions.push(eq(products.isOnSale, true))
    }

    // New arrivals
    if (filters.new) {
      conditions.push(eq(products.isNew, true))
    }

    // Rating
    if (filters.rating) {
      conditions.push(gte(products.avgRating, filters.rating))
    }

    // Search
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      conditions.push(
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm),
          like(products.sku, searchTerm)
        )
      )
    }

    // Sorting
    let orderBy: any
    switch (pagination.sort) {
      case 'price-asc':
        orderBy = asc(products.price)
        break
      case 'price-desc':
        orderBy = desc(products.price)
        break
      case 'newest':
        orderBy = desc(products.createdAt)
        break
      case 'rating':
        orderBy = desc(products.avgRating)
        break
      case 'bestselling':
        orderBy = desc(products.soldCount)
        break
      case 'name-asc':
        orderBy = asc(products.name)
        break
      case 'name-desc':
        orderBy = desc(products.name)
        break
      default:
        orderBy = desc(products.isFeatured)
    }

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pagination.perPage)
    const offset = (pagination.page - 1) * pagination.perPage

    // Get products with relations
    const result = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        category: true,
        brand: true,
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      orderBy,
      limit: pagination.perPage,
      offset
    })

    return {
      products: result,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
        total,
        totalPages
      }
    }
  }

  async getProductBySlug(slug: string) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: {
        category: true,
        brand: true,
        images: {
          orderBy: [asc(productImages.sortOrder)]
        },
        reviews: {
          with: { user: true },
          where: eq(reviews.isApproved, true),
          orderBy: [desc(reviews.createdAt)],
          limit: 10
        },
        variants: true,
        tags: {
          with: { tag: true }
        }
      }
    })

    if (product) {
      // Increment view count
      await db
        .update(products)
        .set({ viewCount: sql`${products.viewCount} + 1` })
        .where(eq(products.id, product.id))
    }

    return product
  }

  async getProductById(id: number) {
    return db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        brand: true,
        images: true,
        variants: true
      }
    })
  }

  async getFeaturedProducts(limit: number = 8) {
    return db.query.products.findMany({
      where: and(eq(products.isFeatured, true), eq(products.isActive, true)),
      with: {
        category: true,
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      orderBy: [desc(products.createdAt)],
      limit
    })
  }

  async getNewProducts(limit: number = 8) {
    return db.query.products.findMany({
      where: and(eq(products.isNew, true), eq(products.isActive, true)),
      with: {
        category: true,
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      orderBy: [desc(products.createdAt)],
      limit
    })
  }

  async getSaleProducts(limit: number = 8) {
    return db.query.products.findMany({
      where: and(eq(products.isOnSale, true), eq(products.isActive, true)),
      with: {
        category: true,
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      orderBy: [desc(products.createdAt)],
      limit
    })
  }

  async getRelatedProducts(productId: number, categoryId: number | null, limit: number = 4) {
    const conditions = [
      eq(products.isActive, true),
      sql`${products.id} != ${productId}`
    ]

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId))
    }

    return db.query.products.findMany({
      where: and(...conditions),
      with: {
        category: true,
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      orderBy: [desc(products.avgRating)],
      limit
    })
  }

  async searchProducts(query: string, limit: number = 10) {
    const searchTerm = `%${query}%`

    return db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm)
        )
      ),
      with: {
        images: {
          where: eq(productImages.isPrimary, true),
          limit: 1
        }
      },
      limit
    })
  }
}

export const productService = new ProductService()
