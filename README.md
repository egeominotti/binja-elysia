# TechStore E-Commerce - Binja Demo

A complete e-commerce demo built with **Elysia** (Bun web framework) and **Binja** (high-performance Jinja2/Django template engine for Bun).

This project demonstrates the power and flexibility of Binja's template system with 40+ custom filters for e-commerce applications.

## Features

- **Full E-Commerce Frontend**: Homepage, products, product details, cart, checkout, account pages
- **Binja Template Engine**: Jinja2/Django compatible syntax with custom filters
- **40+ Custom Filters**: Currency formatting, star ratings, stock status, pagination, and more
- **SQLite Database**: Drizzle ORM with complete schema (products, categories, orders, users, etc.)
- **Session-Based Cart**: Persistent shopping cart without authentication
- **Responsive Design**: Mobile-first CSS with modern design
- **SVG Placeholder Images**: Lightweight demo images

## Why Binja?

### Familiar Syntax
If you know Python/Django or Jinja2, you're already productive. No new templating language to learn.

### Template Inheritance = DRY Code
Define a base layout once, extend it everywhere. Change the header in one place, update all pages instantly.

```html
<!-- base.html: define structure once -->
<!DOCTYPE html>
<html>
  <body>
    {% block content %}{% endblock %}
  </body>
</html>

<!-- page.html: just fill the blocks -->
{% extends "base.html" %}
{% block content %}
  <h1>My Page</h1>
{% endblock %}
```

### Powerful Custom Filters
Keep templates clean by moving presentation logic into reusable filters:

```html
{{ 1299.99|currency }}     <!-- €1,299.99 -->
{{ 4.5|stars }}            <!-- ★★★★☆ -->
{{ 3|stock_status }}       <!-- Low Stock -->
```

### High Performance (AOT Compilation)
Binja compiles templates ahead-of-time for blazing fast rendering in production.

### Clean Separation of Concerns
- **Controllers** handle business logic and data
- **Templates** handle presentation only

```typescript
// Controller: fetch data
const products = await db.query.products.findMany()
return render('products.html', { products })
```

```html
<!-- Template: render data -->
{% for product in products %}
  <div>{{ product.name }}</div>
{% endfor %}
```

### 84 Built-in Filters + Extensible
Don't reinvent the wheel. Date formatting, string manipulation, array operations - all built-in. Need more? Add custom filters easily.

### Reusable Components
```html
{% include "components/product-card.html" %}
```
Write once, use everywhere.

### Comparison with Alternatives

| Feature | Binja | JSX/React | EJS | Handlebars |
|---------|-------|-----------|-----|------------|
| Server-side rendering | Yes | No | Yes | Yes |
| No client JS required | Yes | No | Yes | Yes |
| Template inheritance | Yes | No | No | Partial |
| 84+ built-in filters | Yes | No | No | No |
| Django/Jinja2 syntax | Yes | No | No | No |
| AOT compilation | Yes | Yes | No | No |
| Custom filters | Yes | N/A | No | Yes |

### Ideal Use Cases

**Perfect for:**
- E-commerce sites
- Blogs and CMS
- Admin dashboards
- Marketing/landing pages
- SEO-critical applications
- Multi-page applications (MPA)

**Consider alternatives for:**
- Highly interactive SPAs
- Real-time collaborative apps

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0 or higher

### Installation

```bash
# Install dependencies
bun install

# Create database and seed with demo data
bun run db:push
bun run seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
binja-elysia/
├── src/
│   ├── index.ts           # Main Elysia app with routes
│   ├── db/
│   │   ├── index.ts       # Database connection (bun:sqlite)
│   │   ├── schema.ts      # Drizzle ORM schema (20+ tables)
│   │   └── seed.ts        # Demo data seeder
│   ├── lib/
│   │   └── templates.ts   # Binja configuration with 40+ custom filters
│   └── services/
│       ├── product.service.ts
│       ├── category.service.ts
│       ├── brand.service.ts
│       └── cart.service.ts
├── templates/
│   ├── base.html          # Base template with blocks
│   ├── pages/
│   │   ├── home.html
│   │   ├── products.html
│   │   ├── product-detail.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── account.html
│   │   └── wishlist.html
│   ├── components/
│   │   └── product-card.html
│   └── partials/
│       ├── header.html
│       ├── footer.html
│       ├── styles.html
│       ├── scripts.html
│       └── modals.html
├── public/
│   └── images/            # SVG placeholder images
├── data/
│   └── ecommerce.db       # SQLite database (auto-created)
└── package.json
```

## Binja Features Used

### Template Inheritance

```html
{% extends "base.html" %}

{% block title %}Home{% endblock %}

{% block content %}
  <!-- Page content -->
{% endblock %}
```

### Custom Filters

```html
<!-- Currency formatting -->
{{ product.price|currency }}              <!-- €1,299.00 -->

<!-- Star ratings -->
{{ product.avgRating|stars }}             <!-- ★★★★☆ -->
{{ product.avgRating|stars_html|safe }}   <!-- <span class="star">★</span>... -->

<!-- Stock status -->
{{ product.stock|stock_status }}          <!-- In Stock / Low Stock / Out of Stock -->

<!-- Discount calculations -->
{{ product.price|discount_percent(product.compareAtPrice) }}%  <!-- 20% -->

<!-- Truncation -->
{{ product.name|truncatechars(30) }}      <!-- iPhone 15 Pro Max 256G... -->

<!-- Date formatting -->
{{ order.createdAt|date('M d, Y') }}      <!-- Dec 30, 2024 -->

<!-- Pluralization -->
{{ count }} item{{ count|pluralize }}     <!-- 1 item / 5 items -->

<!-- Default values -->
{{ user.avatar|default('/images/placeholder.svg') }}
```

### Conditionals and Loops

```html
{% if product.isOnSale and product.compareAtPrice %}
  <span class="badge badge-danger">Sale!</span>
{% endif %}

{% for product in featured_products %}
  {% include "components/product-card.html" %}
{% endfor %}
```

### Built-in Tests

```html
{% if products is iterable %}
  {% for product in products %}...{% endfor %}
{% endif %}

{% if loop.first %}First item{% endif %}
{% if loop.last %}Last item{% endif %}
```

## Available Scripts

```bash
bun run dev       # Start development server with hot reload
bun run build     # Build for production
bun run start     # Start production server
bun run db:push   # Push schema to database
bun run seed      # Seed database with demo data
```

## Custom Filters Reference

| Filter | Description | Example |
|--------|-------------|---------|
| `currency` | Format as currency | `{{ 1299 \| currency }}` |
| `stars` | Convert rating to stars | `{{ 4.5 \| stars }}` |
| `stars_html` | Stars with HTML markup | `{{ 4.5 \| stars_html \| safe }}` |
| `stock_status` | Stock availability text | `{{ 5 \| stock_status }}` |
| `discount_percent` | Calculate discount % | `{{ 80 \| discount_percent(100) }}` |
| `truncatechars` | Truncate text | `{{ text \| truncatechars(20) }}` |
| `date` | Format date | `{{ date \| date('Y-m-d') }}` |
| `pluralize` | Pluralize word | `{{ 5 \| pluralize }}` |
| `floatformat` | Format decimals | `{{ 4.567 \| floatformat(2) }}` |
| `default` | Default value | `{{ val \| default('N/A') }}` |
| `urlencode` | URL encode | `{{ 'hello world' \| urlencode }}` |
| `first` | First item/char | `{{ 'Hello' \| first }}` |
| `last` | Last item/char | `{{ [1,2,3] \| last }}` |
| `length` | Get length | `{{ items \| length }}` |
| `upper` | Uppercase | `{{ 'hello' \| upper }}` |
| `lower` | Lowercase | `{{ 'HELLO' \| lower }}` |
| `title` | Title case | `{{ 'hello world' \| title }}` |
| `json` | JSON stringify | `{{ obj \| json }}` |
| `join` | Join array | `{{ tags \| join(', ') }}` |

## Database Schema

The demo includes a complete e-commerce schema:

- **products** - Products with pricing, stock, ratings
- **categories** - Hierarchical categories
- **brands** - Product brands
- **product_images** - Multiple images per product
- **product_variants** - Size/color variants
- **attributes** / **attribute_values** - Variant attributes
- **users** - Customer accounts
- **addresses** - Shipping/billing addresses
- **carts** / **cart_items** - Shopping cart
- **orders** / **order_items** - Order management
- **reviews** - Product reviews with ratings
- **coupons** - Discount codes
- **shipping_methods** - Shipping options
- **wishlists** - User wishlists

## Pages and Routes

| Route | Page |
|-------|------|
| `/` | Homepage with featured products |
| `/products` | Product listing with filters |
| `/products/:slug` | Product detail page |
| `/category/:slug` | Category products |
| `/brand/:slug` | Brand products |
| `/cart` | Shopping cart |
| `/checkout` | Checkout process |
| `/login` | Login page |
| `/register` | Registration page |
| `/account` | User dashboard |
| `/account/wishlist` | Wishlist page |
| `/search?q=` | Search results |

## Demo Data

The seeder creates:
- 6 brands (Apple, Samsung, Sony, Nike, Adidas, IKEA)
- 10 products across categories
- 4 discount coupons (WELCOME10, SAVE20, FLAT50, FREESHIP)
- 3 shipping methods
- Demo user account

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia](https://elysiajs.com)
- **Templates**: [Binja](https://npmjs.com/package/binja)
- **Database**: SQLite (bun:sqlite)
- **ORM**: [Drizzle](https://orm.drizzle.team)
- **Styling**: Custom CSS (no frameworks)

## License

MIT

---

Built with [Binja](https://npmjs.com/package/binja) - The Jinja2/Django Template Engine for Bun
