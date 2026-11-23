'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, ChevronDown, Tag, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardMedia, CardContent } from '@/components/ui/Card';
import { cn, formatNumber } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  showFilters?: boolean;
  maxProducts?: number;
  className?: string;
}

export function ProductCatalog({
  products,
  categories,
  initialCategory,
  showFilters = true,
  maxProducts,
  className,
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'newest'>('featured');

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.features?.some((f) => f.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

  const displayProducts = maxProducts ? filteredProducts.slice(0, maxProducts) : filteredProducts;

  const categoryOptions = [
    { value: 'all', label: 'Tutte le categorie' },
    ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
  ];

  return (
    <section className={cn('section', className)} aria-labelledby="catalog-heading">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <h2 id="catalog-heading" className="heading-h2 mb-2">Catalogo Prodotti e Servizi</h2>
            <p className="text-body text-secondary-600 dark:text-secondary-400">
              Scopri la nostra gamma completa di soluzioni per l'industria manifatturiera.
              {filteredProducts.length > 0 && (
                <span className="ml-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'prodotto' : 'prodotti'})
                </span>
              )}
            </p>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[250px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Cerca prodotti, categorie, specifiche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                  aria-label="Cerca nel catalogo"
                />
              </div>

              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" aria-hidden="true" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input pl-10 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center]"
                  aria-label="Filtra per categoria"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 border border-secondary-200 rounded-lg p-1 dark:border-secondary-700" role="group" aria-label="Modalità visualizzazione">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2 rounded transition-colors', viewMode === 'grid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-secondary-500 hover:text-secondary-700')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Visualizzazione a griglia"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-2 rounded transition-colors', viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-secondary-500 hover:text-secondary-700')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="Visualizzazione a lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="input min-w-[180px]"
                aria-label="Ordina per"
              >
                <option value="featured">In evidenza</option>
                <option value="name">Nome A-Z</option>
                <option value="newest">Più recenti</option>
              </select>
            </div>
          )}
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-16" role="status">
            <Search className="w-16 h-16 mx-auto text-secondary-300 dark:text-secondary-700 mb-4" aria-hidden="true" />
            <h3 className="heading-h3 mb-2">Nessun prodotto trovato</h3>
            <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6">
              Prova a modificare i filtri o la ricerca per trovare ciò che cerchi.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Reimposta filtri
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4" role="list">
                {displayProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {maxProducts && filteredProducts.length > maxProducts && (
              <div className="text-center mt-10">
                <Button variant="outline" size="lg" onClick={() => { /* navigate to full catalog */ }}>
                  Vedi tutti i {filteredProducts.length} prodotti
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0];

  return (
    <article className="card-hover group flex flex-col" role="listitem">
      <CardMedia aspectRatio="video" className="relative">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary-100 dark:bg-secondary-800">
            <Tag className="w-12 h-12 text-secondary-400 dark:text-secondary-500" aria-hidden="true" />
          </div>
        )}

        {(product.isNew || product.isFeatured) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && <span className="badge-accent">Nuovo</span>}
            {product.isFeatured && <span className="badge-primary">In evidenza</span>}
          </div>
        )}

        {product.brochureUrl && (
          <a
            href={product.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors shadow-lg"
            aria-label={`Scarica scheda tecnica ${product.name}`}
          >
            <ExternalLink className="w-5 h-5" aria-hidden="true" />
          </a>
        )}
      </CardMedia>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-secondary-500 dark:text-secondary-500 uppercase tracking-wider">
            {product.category}
          </span>
        </div>

        <h3 className="heading-h4 mb-2 line-clamp-1">{product.name}</h3>

        <p className="text-body text-secondary-600 dark:text-secondary-400 mb-4 flex-1 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        {product.features && product.features.length > 0 && (
          <ul className="space-y-1.5 mb-4" role="list" aria-label="Caratteristiche principali">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" aria-hidden="true" />
                {feature}
              </li>
            ))}
            {product.features.length > 3 && (
              <li className="text-sm text-primary-600 dark:text-primary-400">
                +{product.features.length - 3} altre caratteristiche
              </li>
            )}
          </ul>
        )}

        <Link
          href={`/prodotto/${product.slug}`}
          className="btn-primary w-full justify-center group"
        >
          Scheda completa
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </CardContent>
    </article>
  );
}

interface ProductListItemProps {
  product: Product;
}

function ProductListItem({ product }: ProductListItemProps) {
  const primaryImage = product.images?.[0];

  return (
    <article className="card-hover group flex gap-6 p-4" role="listitem">
      <div className="relative w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Tag className="w-10 h-10 text-secondary-400 dark:text-secondary-500 mx-auto my-auto" aria-hidden="true" />
        )}

        {(product.isNew || product.isFeatured) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && <span className="badge-accent text-xs">Nuovo</span>}
            {product.isFeatured && <span className="badge-primary text-xs">In evidenza</span>}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-secondary-500 dark:text-secondary-500 uppercase tracking-wider">
              {product.category}
            </span>
            {product.isFeatured && <span className="badge-primary text-xs">In evidenza</span>}
            {product.isNew && <span className="badge-accent text-xs">Nuovo</span>}
          </div>
          <h3 className="heading-h4 mb-2">{product.name}</h3>
          <p className="text-body text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-3">
            {product.shortDescription || product.description}
          </p>

          {product.features && product.features.length > 0 && (
            <ul className="space-y-1" role="list">
              {product.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href={`/prodotto/${product.slug}`}
          className="btn-primary w-full sm:w-auto justify-center group mt-4"
        >
          Scheda completa
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}