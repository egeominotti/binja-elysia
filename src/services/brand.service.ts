import { db, brands, products } from '../db'
import { eq, sql, asc } from 'drizzle-orm'

export class BrandService {
  async getAllBrands() {
    return db.query.brands.findMany({
      where: eq(brands.isActive, true),
      orderBy: [asc(brands.name)]
    })
  }

  async getBrandBySlug(slug: string) {
    return db.query.brands.findFirst({
      where: eq(brands.slug, slug)
    })
  }

  async getBrandsWithProductCount() {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logo: brands.logo,
        productCount: sql<number>`count(${products.id})`
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .where(eq(brands.isActive, true))
      .groupBy(brands.id)
      .orderBy(asc(brands.name))

    return result
  }
}

export const brandService = new BrandService()
