import { db, carts, cartItems, products, coupons, productImages } from '../db'
import { eq, and, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export interface CartItem {
  productId: number
  variantId?: number
  quantity: number
  options?: Record<string, string>
}

export class CartService {
  async getOrCreateCart(userId?: number, sessionId?: string) {
    // Try to find existing cart
    let cart = await db.query.carts.findFirst({
      where: userId
        ? eq(carts.userId, userId)
        : eq(carts.sessionId, sessionId!),
      with: {
        items: {
          with: {
            product: {
              with: {
                images: true
              }
            },
            variant: true
          }
        },
        coupon: true
      }
    })

    if (!cart) {
      // Create new cart
      const [newCart] = await db.insert(carts).values({
        userId,
        sessionId: sessionId || nanoid()
      }).returning()

      cart = await db.query.carts.findFirst({
        where: eq(carts.id, newCart.id),
        with: {
          items: {
            with: {
              product: {
                with: { images: true }
              },
              variant: true
            }
          },
          coupon: true
        }
      })
    }

    return this.calculateCartTotals(cart!)
  }

  async addToCart(cartId: number, item: CartItem) {
    // Check if item already exists
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, item.productId),
        item.variantId ? eq(cartItems.variantId, item.variantId) : sql`${cartItems.variantId} IS NULL`
      )
    })

    // Get product price
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId)
    })

    if (!product) {
      throw new Error('Product not found')
    }

    if (product.stock < item.quantity) {
      throw new Error('Not enough stock')
    }

    if (existingItem) {
      // Update quantity
      await db
        .update(cartItems)
        .set({
          quantity: sql`${cartItems.quantity} + ${item.quantity}`
        })
        .where(eq(cartItems.id, existingItem.id))
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: product.price
      })
    }

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId))

    return this.getCartById(cartId)
  }

  async updateCartItem(cartId: number, itemId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(cartId, itemId)
    }

    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))

    return this.getCartById(cartId)
  }

  async removeFromCart(cartId: number, itemId: number) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))

    return this.getCartById(cartId)
  }

  async clearCart(cartId: number) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId))

    await db
      .update(carts)
      .set({ couponId: null })
      .where(eq(carts.id, cartId))

    return this.getCartById(cartId)
  }

  async applyCoupon(cartId: number, code: string) {
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true)
      )
    })

    if (!coupon) {
      throw new Error('Invalid coupon code')
    }

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new Error('Coupon has expired')
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit reached')
    }

    // Get cart to check minimum order
    const cart = await this.getCartById(cartId)
    if (coupon.minOrderAmount && cart.subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount is ${coupon.minOrderAmount}`)
    }

    await db
      .update(carts)
      .set({ couponId: coupon.id })
      .where(eq(carts.id, cartId))

    return this.getCartById(cartId)
  }

  async removeCoupon(cartId: number) {
    await db
      .update(carts)
      .set({ couponId: null })
      .where(eq(carts.id, cartId))

    return this.getCartById(cartId)
  }

  async getCartById(cartId: number) {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.id, cartId),
      with: {
        items: {
          with: {
            product: {
              with: { images: true }
            },
            variant: true
          }
        },
        coupon: true
      }
    })

    if (!cart) {
      throw new Error('Cart not found')
    }

    return this.calculateCartTotals(cart)
  }

  private calculateCartTotals(cart: any) {
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity
    }, 0)

    let discount = 0
    if (cart.coupon) {
      if (cart.coupon.type === 'percentage') {
        discount = subtotal * (cart.coupon.value / 100)
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount)
        }
      } else if (cart.coupon.type === 'fixed') {
        discount = cart.coupon.value
      }
    }

    const shipping = subtotal >= 100 ? 0 : 5.99 // Free shipping over 100
    const total = Math.max(0, subtotal - discount + shipping)

    return {
      ...cart,
      subtotal,
      discount,
      shipping,
      total
    }
  }

  async getCartItemCount(cartId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`sum(${cartItems.quantity})` })
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId))

    return result[0]?.count || 0
  }
}

export const cartService = new CartService()
