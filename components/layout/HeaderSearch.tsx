// 'use client';

// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import { fetchProducts } from '@/lib/api/products';
// import { filterCategoriesByQuery } from '@/lib/search/filterCategories';
// import type { Category } from '@/types/category';
// import type { Product } from '@/types/product';

// function SearchIcon({ className }: { className?: string }) {
//   return (
//     <svg
//       className={className}
//       fill="none"
//       viewBox="0 0 22 22"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//       />
//     </svg>
//   );
// }

// export interface HeaderSearchProps {
//   categories: Category[];
// }

// export function HeaderSearch({ categories }: HeaderSearchProps) {
//   const router = useRouter();

//   const containerRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const scrollPosition = useRef(0);

//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState('');
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(false);

//   const trimmed = query.trim();

//   const matchedCategories = trimmed
//     ? filterCategoriesByQuery(categories, trimmed).slice(0, 5)
//     : [];

//   const hasResults =
//     matchedCategories.length > 0 || products.length > 0;

//   useEffect(() => {
//     if (!trimmed) {
//       setProducts([]);
//       setLoading(false);
//       return;
//     }

//     let cancelled = false;

//     const timer = setTimeout(async () => {
//       setLoading(true);

//       try {
//         const result = await fetchProducts({
//           search: trimmed,
//           limit: 5,
//           is_active: true,
//         });

//         if (!cancelled) {
//           setProducts(result.products);
//         }
//       } catch {
//         if (!cancelled) {
//           setProducts([]);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     }, 300);

//     return () => {
//       cancelled = true;
//       clearTimeout(timer);
//     };
//   }, [trimmed]);

//   // Focus input
//   useEffect(() => {
//     if (open) {
//       inputRef.current?.focus();
//     }
//   }, [open]);

//   // ESC key and click outside handler
//   useEffect(() => {
//     if (!open) return;

//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') {
//         setOpen(false);
//       }
//     };

//     const handleClickOutside = (e: MouseEvent) => {
//       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
//         setOpen(false);
//       }
//     };

//     document.addEventListener('keydown', onKeyDown);
//     document.addEventListener('mousedown', handleClickOutside);

//     return () => {
//       document.removeEventListener('keydown', onKeyDown);
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [open]);

//   // Body scroll lock with position preservation
//   useEffect(() => {
//     if (open) {
//       // Save current scroll position
//       scrollPosition.current = window.scrollY;
      
//       // Lock body scroll
//       document.body.style.position = 'fixed';
//       document.body.style.top = `-${scrollPosition.current}px`;
//       document.body.style.width = '100%';
//       document.body.style.overflowY = 'scroll'; // Prevent layout shift
//     } else {
//       // Restore body scroll
//       document.body.style.position = '';
//       document.body.style.top = '';
//       document.body.style.width = '';
//       document.body.style.overflowY = '';
      
//       // Restore scroll position
//       window.scrollTo(0, scrollPosition.current);
//     }

//     return () => {
//       document.body.style.position = '';
//       document.body.style.top = '';
//       document.body.style.width = '';
//       document.body.style.overflowY = '';
//     };
//   }, [open]);

//   const goToSearch = useCallback(() => {
//     setOpen(false);

//     if (trimmed) {
//       router.push(`/search?q=${encodeURIComponent(trimmed)}`);
//     } else {
//       router.push('/search');
//     }
//   }, [router, trimmed]);

//   return (
//     <>
//       {/* Search Button */}
//       <button
//         type="button"
//         onClick={() => setOpen(true)}
//         aria-label="Open Search"
//         className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
//       >
//         <SearchIcon className="h-5 w-5" />
//       </button>

//       {/* Background Overlay */}
//       {open && (
//         <div
//           onClick={() => setOpen(false)}
//           className="fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300"
//         />
//       )}

//       {/* Sidebar */}
//       <div
//         ref={containerRef}
//         className={`fixed top-0 right-0 z-[100] flex h-screen sm:h-[95vh] w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
//           open ? 'translate-x-0' : 'translate-x-full'
//         }`}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between border-b px-5 py-4">
//           <h2 className="text-lg font-semibold">Search</h2>

//           <button
//             type="button"
//             onClick={() => {
//               setOpen(false);
//               setQuery('');
//             }}
//             className="rounded-lg p-2 hover:bg-muted"
//           >
//             <svg
//               className="h-5 w-5"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Search Input */}
//         <div className="border-b p-5">
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               goToSearch();
//             }}
//           >
//             <div className="relative">
//               <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

//               <input
//                 ref={inputRef}
//                 type="search"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search categories & products..."
//                 className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary"
//               />
//             </div>
//           </form>
//         </div>

//         {/* Scrollable Results */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {loading && !hasResults ? (
//             <p className="py-4 text-center text-sm text-muted-foreground">
//               Searching...
//             </p>
//           ) : null}

//           {!loading && trimmed && !hasResults ? (
//             <p className="py-4 text-center text-sm text-muted-foreground">
//               No matches found.
//             </p>
//           ) : null}

//           {/* Categories */}
//           {matchedCategories.length > 0 && (
//             <div className="mb-6">
//               <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                 Categories
//               </p>

//               <ul className="space-y-1">
//                 {matchedCategories.map((category) => (
//                   <li key={category.id}>
//                     <Link
//                       href={`/shop/category/${category.slug}`}
//                       onClick={() => {
//                         setOpen(false);
//                         setQuery('');
//                       }}
//                       className="block rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
//                     >
//                       {category.name}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Products */}
//           {products.length > 0 && (
//             <div>
//               <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                 Products
//               </p>

//               <ul className="space-y-1">
//                 {products.map((product) => (
//                   <li key={product.id}>
//                     <Link
//                       href={`/products/${product.slug}`}
//                       onClick={() => {
//                         setOpen(false);
//                         setQuery('');
//                       }}
//                       className="block rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
//                     >
//                       {product.name}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>

//         {/* Bottom Button */}
//         <div className="border-t bg-background p-5">
//           <button
//             type="button"
//             onClick={goToSearch}
//             disabled={!trimmed}
//             className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {trimmed
//               ? `View all results for "${trimmed}"`
//               : 'Browse all products'}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProducts } from '@/lib/api/products';
import { filterCategoriesByQuery } from '@/lib/search/filterCategories';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 22 22"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export interface HeaderSearchProps {
  categories: Category[];
}

export function HeaderSearch({ categories }: HeaderSearchProps) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollPosition = useRef(0);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const trimmed = query.trim();

  const matchedCategories = trimmed
    ? filterCategoriesByQuery(categories, trimmed).slice(0, 5)
    : [];

  const hasResults =
    matchedCategories.length > 0 || products.length > 0;

  useEffect(() => {
    if (!trimmed) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const result = await fetchProducts({
          search: trimmed,
          limit: 5,
          is_active: true,
        });

        if (!cancelled) {
          setProducts(result.products);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  // Focus input
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Handle open/close with animation
  const handleOpen = () => {
    setIsAnimating(true);
    setOpen(true);
  };

  const handleClose = () => {
    setIsAnimating(true);
    setOpen(false);
    
    // Wait for animation to complete before fully removing from DOM
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // ESC key and click outside handler
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Body scroll lock with position preservation
  useEffect(() => {
    if (open) {
      // Save current scroll position
      scrollPosition.current = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // Prevent layout shift
    } else if (!open && !isAnimating) {
      // Restore body scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition.current);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [open, isAnimating]);

  const goToSearch = useCallback(() => {
    handleClose();

    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/search');
    }
  }, [router, trimmed]);

  return (
    <>
      {/* Search Button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open Search"
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {/* Only render when open or animating */}
      {(open || isAnimating) && (
        <>
          {/* Background Overlay */}
          <div
            onClick={handleClose}
            className={`fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Sidebar - Original Design */}
          <div
            ref={containerRef}
            className={`fixed top-0 right-0 z-[100] flex h-screen sm:h-[95vh] w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Search</h2>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setQuery('');
                }}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="border-b p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goToSearch();
                }}
              >
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search categories & products..."
                    className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
            </div>

            {/* Scrollable Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && !hasResults ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              ) : null}

              {!loading && trimmed && !hasResults ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No matches found.
                </p>
              ) : null}

              {/* Categories */}
              {matchedCategories.length > 0 && (
                <div className="mb-6">
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>

                  <ul className="space-y-1">
                    {matchedCategories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/shop/category/${category.slug}`}
                          onClick={() => {
                            handleClose();
                            setQuery('');
                          }}
                          className="block rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Products */}
              {products.length > 0 && (
                <div>
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Products
                  </p>

                  <ul className="space-y-1">
                    {products.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={() => {
                            handleClose();
                            setQuery('');
                          }}
                          className="block rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                          {product.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Button */}
            <div className="border-t bg-background p-5">
              <button
                type="button"
                onClick={goToSearch}
                disabled={!trimmed}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {trimmed
                  ? `View all results for "${trimmed}"`
                  : 'Browse all products'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}