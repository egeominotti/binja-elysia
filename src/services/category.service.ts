import { db, categories, products } from '../db'
import { eq, isNull, sql, asc } from 'drizzle-orm'

export class CategoryService {
  async getAllCategories() {
    return db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder), asc(categories.name)]
    })
  }

  async getParentCategories() {
    return db.query.categories.findMany({
      where: (cat, { and }) => and(
        eq(cat.isActive, true),
        isNull(cat.parentId)
      ),
      with: {
        subcategories: {
          where: eq(categories.isActive, true),
          orderBy: [asc(categories.sortOrder)]
        }
      },
      orderBy: [asc(categories.sortOrder)]
    })
  }

  async getCategoryBySlug(slug: string) {
    return db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with: {
        parent: true,
        subcategories: {
          where: eq(categories.isActive, true)
        }
      }
    })
  }

  async getCategoriesWithProductCount() {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        productCount: sql<number>`count(${products.id})`
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder))

    return result
  }
}

export const categoryService = new CategoryService()
