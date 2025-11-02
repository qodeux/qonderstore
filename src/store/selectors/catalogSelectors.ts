// store/selectors/catalogSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { ProductFiltersState } from '../slices/productFiltersSlice'
import type { RootState } from '../store'
import { selectProductsWithBestPromo, type ProductWithPromo } from './productsWithPromo'

/** === Base === */
export const selectCatalogFilters = (state: RootState) => state.productFilters as ProductFiltersState
const selectCategories = (s: RootState) => s.categories.items // [{ id, name, slug_id, parent }, ...]

/** === Helpers: texto, tags, categorías, marcas, precio === */
const textMatch = (p: ProductWithPromo, q: string) => {
  if (!q) return true
  const t = q.toLowerCase()
  return (
    p.name?.toLowerCase().includes(t) ||
    (p as any).description?.toLowerCase?.().includes(t) ||
    (p as any).sku?.toLowerCase?.().includes(t) ||
    String(p.category ?? '')
      .toLowerCase()
      .includes(t)
  )
}

const tagsMatch = (p: ProductWithPromo, { types }: Pick<ProductFiltersState, 'types'>) => {
  if (!types.length) return true

  const isNew =
    Boolean((p as any).is_new) || (p.created_at ? Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 24 * 30 : false) // 30 días
  const isSale = Boolean(p.hasPromotion)
  const isFeatured = Boolean((p as any).featured)
  const isPopular = Boolean((p as any).popular || (p as any).views_count)

  const map: Record<string, boolean> = {
    new: isNew,
    sale: isSale,
    featured: isFeatured,
    popular: isPopular
  }

  return types.some((t) => map[t])
}

/**
 * Filtrado por categorías:
 * - En productos tienes `product.category` como **nombre** (string).
 * - En el Sidebar seleccionas **slug_id** de categorías padres.
 * - Mapeamos slug_id(parent) -> name(parent) y comparamos con product.category (nombre).
 */
const inSelectedParents = createSelector([selectCategories], (cats) => {
  const parentSlugToName = new Map<string, string>() // slug_id(parent) => name(parent)
  for (const c of cats) {
    if (c.parent === null) parentSlugToName.set(String(c.slug_id), String(c.name))
  }
  return parentSlugToName
})

const categoryMatch = (p: ProductWithPromo, selectedParentSlugs: string[], parentSlugToName: Map<string, string>) => {
  if (!selectedParentSlugs.length) return true
  const productParentName = String(p.category ?? '')
  const selectedParentNames = selectedParentSlugs.map((slug) => parentSlugToName.get(String(slug))).filter(Boolean) as string[]
  return selectedParentNames.includes(productParentName)
}

/** Marca: product.brand (o brand_id) es SIEMPRE numérico en tu modelo */
const brandMatch = (p: ProductWithPromo, ids: number[]) => {
  if (!ids.length) return true
  const brandId = Number((p as any).brand ?? (p as any).brand_id)
  return Number.isFinite(brandId) && ids.includes(brandId)
}

const priceMatch = (p: ProductWithPromo, min: number | null, max: number | null) => {
  const price = Number(p.finalPrice ?? p.price ?? 0)
  if (!Number.isFinite(price)) return false
  if (min != null && price < min) return false
  if (max != null && price > max) return false
  return true
}

/** === Ordenadores ===
 * price: finalPrice
 * popularity: views_count / popularity_score
 * rating: rating_avg
 * newest: created_at
 * discount: discountPercent
 * name: name
 */
const sorters = {
  relevance: (_a: ProductWithPromo, _b: ProductWithPromo) => 0,
  price: (a: ProductWithPromo, b: ProductWithPromo) => Number(a.finalPrice ?? a.price ?? 0) - Number(b.finalPrice ?? b.price ?? 0),
  popularity: (a: ProductWithPromo, b: ProductWithPromo) =>
    Number((a as any).views_count ?? (a as any).popularity_score ?? 0) - Number((b as any).views_count ?? (b as any).popularity_score ?? 0),
  rating: (a: ProductWithPromo, b: ProductWithPromo) => Number((a as any).rating_avg ?? 0) - Number((b as any).rating_avg ?? 0),
  newest: (a: ProductWithPromo, b: ProductWithPromo) =>
    new Date((a as any).created_at ?? 0).getTime() - new Date((b as any).created_at ?? 0).getTime(),
  discount: (a: ProductWithPromo, b: ProductWithPromo) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0),
  name: (a: ProductWithPromo, b: ProductWithPromo) => String(a.name ?? '').localeCompare(String(b.name ?? ''))
} as const

/** === Dominio de precios (para slider), usando finalPrice === */
export const selectPriceDomain = createSelector([selectProductsWithBestPromo], (list) => {
  const vals = list.map((p) => Number(p.finalPrice ?? p.price ?? 0)).filter((n) => Number.isFinite(n)) as number[]
  if (!vals.length) return { min: 0, max: 0 }
  return { min: Math.floor(Math.min(...vals)), max: Math.ceil(Math.max(...vals)) }
})

/** === Resultado final: productos visibles con filtros + orden === */
export const selectVisibleProducts = createSelector(
  [selectProductsWithBestPromo, selectCatalogFilters, inSelectedParents],
  (products, f, parentSlugToName) => {
    // 1) Filtrar
    let out = products.filter(
      (p) =>
        textMatch(p, f.query) &&
        tagsMatch(p, f) &&
        categoryMatch(p, f.categorySlugs, parentSlugToName) &&
        brandMatch(p, f.brandIds) &&
        priceMatch(p, f.priceMin, f.priceMax)
    )

    // 2) Ordenar (relevance = sin tocar orden de entrada)
    const sorter = sorters[f.sortBy] ?? sorters.relevance
    if (f.sortBy !== 'relevance') {
      out = [...out].sort(sorter)
      if (f.sortDir === 'desc') out.reverse()
    }

    return out
  }
)
