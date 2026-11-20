import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { business, getDirectionsUrl, normalizeWhatsAppNumber, socialLinks } from "./business";
import { createProductEnquiryMessage, formatPrice, getProductPricing } from "./productPricing";
import type { Product } from "./products";
import { ManagedImage } from "./ManagedImage";
import { createManagedImageUrl, SIGNED_IMAGE_URL_TTL_SECONDS } from "./imageStorage";
import {
  fetchPublishedProducts,
  fetchPublishedCategories,
  fetchPublishedFilterCategories,
  fetchPublishedSiteImages,
  fetchHomepageSettings,
  fetchBusinessSettings,
  type AdminProduct,
  type AdminCategory,
  type FilterCategory,
  type HomepageSettings,
  type SiteImage,
} from "./catalogueStore";
import { supabase } from "./supabase";

interface QuoteItem {
  product: Product;
  quantity: number;
}

function whatsappLink(message: string) {
  const number = normalizeWhatsAppNumber(business.whatsappNumber);
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : "#contact";
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function uniqueCategoryNames(categories: string[]): string[] {
  return Array.from(
    new Map(
      categories
        .map((category) => category.trim())
        .filter(Boolean)
        .map((category) => [category.toLocaleLowerCase(), category]),
    ).values(),
  );
}

function getErrorMessage(caught: unknown): string {
  if (caught instanceof Error) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) {
    const message = caught.message;
    if (typeof message === "string" && message) return message;
  }
  return "Unknown Supabase error.";
}

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "search" | "phone" | "chat" | "menu" | "close" | "spark" | "map";
  size?: number;
}) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></>,
    chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14z" /></>,
    map: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function EnquiryLink({ product, className = "" }: { product?: Product; className?: string }) {
  const message = product
    ? createProductEnquiryMessage(product)
    : `Hello ${business.name}, I would like to know more about your surgical instruments.`;
  if (!normalizeWhatsAppNumber(business.whatsappNumber)) return null;
  return (
    <a
      className={className}
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={product ? `Enquire about ${product.name} on WhatsApp` : "Contact Kavita Surgical on WhatsApp"}
    >
      {product ? "Enquire now" : "WhatsApp us"} <Icon name="arrow" size={17} />
    </a>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const phoneNumber = business.phone;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="announcement" aria-label="Business details">
        <div className="wrap announcement-inner">
          <span className="announcement-copy">
            {business.gstin && <><strong>GSTIN</strong> {business.gstin}<span className="announcement-divider">·</span></>}
            <span className="announcement-secondary">Surgical instruments &amp; medical equipment</span>
          </span>
          {phoneNumber && <a href={`tel:${phoneNumber}`}><Icon name="phone" size={14} /> {business.phoneDisplay}</a>}
        </div>
      </aside>
      <header className="site-header">
        <div className="wrap nav-wrap">
          <a href="#home" className="brand" onClick={closeMenu} aria-label={`${business.name} home`}>
            <span className="brand-mark"><span>K</span><i /></span>
            <span className="brand-name">KAVITA<span>SURGICAL</span></span>
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
          <nav id="main-navigation" className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#products" onClick={closeMenu}>Products</a>
            <a href="#categories" onClick={closeMenu}>Categories</a>
            <a href="#about" onClick={closeMenu}>About us</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <EnquiryLink className="button button-small nav-cta" />
          </nav>
        </div>
      </header>
    </>
  );
}

function Hero({ homepage }: { homepage: HomepageSettings | null }) {
  return (
    <section className="hero" id="home">
      <div className="hero-grid-pattern" aria-hidden="true" />
      <div className="wrap hero-layout">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A considered catalogue for professionals</p>
          <h1>{homepage?.heroTitle ? <>{homepage.heroTitle}</> : <>Precision instruments.<br /><span>Trusted quality.</span></>}</h1>
          <p className="hero-description">
            {homepage?.heroSubtitle || "Find surgical instruments in Mumbai, browse our catalogue, and contact Kavita Surgical directly for product details and pricing."}
          </p>
          <div className="hero-actions">
            <a className="button" href="#products">Explore products <Icon name="arrow" /></a>
            <EnquiryLink className="button button-outline" />
          </div>
          <div className="hero-assurance">
            <span className="assurance-icon"><Icon name="spark" size={17} /></span>
            <span>Based in Malad East, Mumbai.<br /><strong>Direct product enquiries.</strong></span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art-orbit orbit-one" />
          <div className="hero-art-orbit orbit-two" />
          <div className="hero-art-label label-top"><span className="label-dot" /> INSTRUMENT STUDY <small>01 / 03</small></div>
          <ManagedImage
            className="hero-product-image"
            storagePath={homepage?.heroImageStoragePath}
            fallbackUrl={homepage?.heroImagePublished ? homepage.heroImageUrl : undefined}
            sizes="(max-width: 760px) calc(100vw - 40px), 52vw"
            alt={homepage?.heroImageAlt ?? ""}
            width="720"
            height="960"
            decoding="async"
          />
          <div className="hero-art-caption"><span>Designed for detail</span><b>Explore our instruments <Icon name="arrow" size={15} /></b></div>
          <span className="art-coordinate coordinate-one">19°04′ N</span>
          <span className="art-coordinate coordinate-two">72°52′ E</span>
        </div>
      </div>
      <div className="wrap hero-bottom">
        <span>Explore with confidence</span>
        <span className="bottom-rule" />
        <a href="#categories">Scroll to discover <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`section-heading ${align === "center" ? "text-center" : ""}`}>
      <p className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}

function CategorySection({
  onSelect,
  catalogueCategories,
}: {
  onSelect: (category: string) => void;
  catalogueCategories: AdminCategory[];
}) {
  const uniqueCategories = catalogueCategories.filter((category, index, categories) => {
    const normalizedName = category.name.trim().toLocaleLowerCase();
    return categories.findIndex((candidate) =>
      candidate.name.trim().toLocaleLowerCase() === normalizedName,
    ) === index;
  });
  return (
    <section className="section categories-section" id="categories">
      <div className="wrap">
        <SectionHeading
          eyebrow="Find your instrument"
          title="Browse by category"
          description="A clear starting point for exploring our surgical instrument catalogue."
        />
        <div className="category-grid">
          {uniqueCategories.map((category, index) => {
            return (
            <button className="category-card" key={category.id ?? category.name} onClick={() => onSelect(category.name)}>
              <span className="category-art">
                {(category.imageStoragePath || category.image) && (
                  <ManagedImage
                    storagePath={category.imageStoragePath}
                    fallbackUrl={category.imagePublished ? category.image : undefined}
                    sizes="(max-width: 760px) 45vw, 280px"
                    alt=""
                    aria-hidden="true"
                    width="720"
                    height="960"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <span className="category-number">0{index + 1}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-arrow"><Icon name="arrow" size={18} /></span>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  featured = false,
  quoted,
  onQuoteToggle,
  onEnquire,
  onImagePreview,
}: {
  product: Product;
  featured?: boolean;
  quoted: boolean;
  onQuoteToggle: (product: Product) => void;
  onEnquire: (product: Product) => void;
  onImagePreview: (product: Product) => void;
}) {
  const pricing = getProductPricing(product);
  const hasDiscount = pricing.discountPercentage !== undefined;
  const handleProductPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const card = event.currentTarget;
    const art = card.querySelector<HTMLElement>(".product-art");
    if (!art) return;
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    art.style.setProperty("--tilt-x", `${y * -7}deg`);
    art.style.setProperty("--tilt-y", `${x * 9}deg`);
    art.style.setProperty("--shadow-x", `${x * -12}px`);
    art.style.setProperty("--shadow-y", `${8 + y * 8}px`);
  };
  const handleProductPointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    const art = event.currentTarget.querySelector<HTMLElement>(".product-art");
    if (!art) return;
    art.style.setProperty("--tilt-x", "0deg");
    art.style.setProperty("--tilt-y", "0deg");
    art.style.setProperty("--shadow-x", "0px");
    art.style.setProperty("--shadow-y", "9px");
  };

  return (
    <article
      className={`product-card ${featured ? "product-featured" : ""}`}
      onPointerMove={handleProductPointerMove}
      onPointerLeave={handleProductPointerLeave}
    >
      <button
        type="button"
        className="product-art"
        onClick={() => onImagePreview(product)}
        aria-label={`Zoom preview of ${product.name}`}
        disabled={!product.imageStoragePath && !product.imageUrl}
      >
        <span className="product-category">{product.category}</span>
        <ManagedImage
          storagePath={product.imageStoragePath}
          fallbackUrl={product.imageUrl}
          sizes="(max-width: 420px) 46vw, (max-width: 760px) 48vw, (max-width: 1000px) 30vw, 280px"
          alt={product.imageAlt}
          width="720"
          height="960"
          loading="lazy"
          decoding="async"
        />
        <span className="art-index">{product.sku}</span>
        {(product.imageStoragePath || product.imageUrl) && <span className="image-zoom-label">Zoom preview</span>}
      </button>
      <div className="product-content">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          {featured && <span className="featured-mark"><Icon name="spark" size={14} /></span>}
        </div>
        <p>{product.description}</p>
        <div className="product-meta">
          <div className="product-pricing" aria-label={`${product.name} pricing`}>
            {hasDiscount && pricing.originalPrice !== undefined && (
              <div className="price-details">
                <span className="mrp-label">MRP</span>
                <s className="original-price">{formatPrice(pricing.originalPrice)}</s>
                {pricing.discountPercentage !== undefined && pricing.discountPercentage > 0 && (
                  <span className="discount-badge">{pricing.discountPercentage}% OFF</span>
                )}
              </div>
            )}
            {pricing.sellingPrice !== undefined ? (
              <strong className="offer-price">{formatPrice(pricing.sellingPrice)}</strong>
            ) : (
              <span className="price-on-enquiry">Price on enquiry</span>
            )}
            <span className="sample-pricing-label">
              {product.gstRate === undefined ? "GST details on enquiry" : `GST ${product.gstRate}%`}
            </span>
          </div>
          <div className="product-card-actions">
            <button
              type="button"
              className="quote-toggle"
              aria-pressed={quoted}
              onClick={() => onQuoteToggle(product)}
            >
              <span className="quote-check" aria-hidden="true">{quoted ? "✓" : "+"}</span>
              {quoted ? "Added to quote" : "Add to quote"}
            </button>
            <button
              type="button"
              className="product-enquire button"
              onClick={() => onEnquire(product)}
            >
              Enquire now <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Catalogue({
  selectedCategory,
  onCategoryChange,
  quoteList,
  onQuoteToggle,
  onEnquire,
  onImagePreview,
  textScale,
  onTextScaleChange,
  catalogueProducts,
  filterCategories,
  filterCategoriesLoading,
  filterCategoriesError,
}: {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  quoteList: QuoteItem[];
  onQuoteToggle: (product: Product) => void;
  onEnquire: (product: Product) => void;
  onImagePreview: (product: Product) => void;
  textScale: number;
  onTextScaleChange: (scale: number) => void;
  catalogueProducts: Product[];
  filterCategories: FilterCategory[];
  filterCategoriesLoading: boolean;
  filterCategoriesError: string;
}) {
  const [query, setQuery] = useState("");
  const uniqueFilterCategories = filterCategories.filter((category, index, categories) => {
    const normalizedName = category.name.trim().toLocaleLowerCase();
    return categories.findIndex((candidate) =>
      candidate.name.trim().toLocaleLowerCase() === normalizedName,
    ) === index;
  });
  const selectedFilterCategoryId = selectedCategory.startsWith("filter-category:")
    ? selectedCategory.slice("filter-category:".length)
    : "";
  const filteredProducts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return catalogueProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "All Instruments" ||
        selectedCategory === "All instruments" ||
        selectedCategory === product.category ||
        (Boolean(selectedFilterCategoryId) && product.filterCategoryId === selectedFilterCategoryId);
      const matchesQuery =
        !searchTerm ||
        `${product.name} ${product.sku} ${product.category} ${product.description}`.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory, selectedFilterCategoryId, catalogueProducts]);

  return (
    <section className="section catalogue-section" id="products">
      <div className="wrap">
        <div className="catalogue-heading">
          <SectionHeading
            eyebrow="The collection"
            title="Instruments, thoughtfully selected."
            description="See something you need? Get in touch for current availability and pricing."
          />
          <a href="#contact" className="text-link">Need help finding something? <Icon name="arrow" size={16} /></a>
        </div>
        <div className="catalogue-controls sticky-catalogue-controls">
          <div className="catalogue-toolbar-row">
            <label className="search-field">
              <Icon name="search" size={19} />
              <span className="visually-hidden">Search instruments</span>
              <input
                type="search"
                placeholder="Search instruments or SKU..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="text-size-toggle" role="group" aria-label="Text size">
              {[
                { label: "A-", scale: 0.92 },
                { label: "A", scale: 1 },
                { label: "A+", scale: 1.12 },
              ].map((option) => (
                <button
                  type="button"
                  key={option.label}
                  className={textScale === option.scale ? "active" : ""}
                  aria-pressed={textScale === option.scale}
                  onClick={() => onTextScaleChange(option.scale)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row" role="group" aria-label="Filter products by category">
            <button
              type="button"
              className={`filter-chip ${selectedCategory === "All Instruments" ? "active" : ""}`}
              aria-pressed={selectedCategory === "All Instruments"}
              onClick={() => onCategoryChange("All Instruments")}
            >
              All Instruments
            </button>
            {uniqueFilterCategories.map((category) => {
              const value = `filter-category:${category.id}`;
              return (
              <button
                type="button"
                key={category.id}
                className={`filter-chip ${selectedCategory === value ? "active" : ""}`}
                aria-pressed={selectedCategory === value}
                onClick={() => onCategoryChange(value)}
              >
                {category.name}
              </button>
              );
            })}
          </div>
          {filterCategoriesLoading && <p className="catalogue-filter-state" role="status">Loading filter categories…</p>}
          {!filterCategoriesLoading && filterCategoriesError && (
            <p className="catalogue-filter-state" role="alert">
              Filter categories could not be loaded: {filterCategoriesError}
            </p>
          )}
          {!filterCategoriesLoading && !filterCategoriesError && uniqueFilterCategories.length === 0 && (
            <p className="catalogue-filter-state" role="status">No published filter categories are available yet. Showing all products.</p>
          )}
          <div className="results-row">
            <span aria-live="polite" aria-atomic="true">{filteredProducts.length} {filteredProducts.length === 1 ? "instrument" : "instruments"}</span>
            {(selectedCategory !== "All Instruments" || query) && (
              <button className="reset-button" onClick={() => { onCategoryChange("All Instruments"); setQuery(""); }}>
                Clear filters <span aria-hidden="true">×</span>
              </button>
            )}
            {quoteList.length > 0 && (
              <button className="quote-summary" type="button" onClick={() => onEnquire(quoteList[0].product)}>
                Quote list ({quoteList.length})
              </button>
            )}
          </div>
        </div>
        {filteredProducts.length ? (
          <div className="product-grid" id="product-results">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quoted={quoteList.some((item) => item.product.id === product.id)}
                onQuoteToggle={onQuoteToggle}
                onEnquire={onEnquire}
                onImagePreview={onImagePreview}
              />
            ))}
          </div>
        ) : (
          <div className="empty-results">
            <span><Icon name="search" size={24} /></span>
            <h3>No matching instruments</h3>
            <p>Try a different search or clear the selected filters.</p>
            <button className="button button-dark" onClick={() => { onCategoryChange("All Instruments"); setQuery(""); }}>Clear filters</button>
          </div>
        )}
        <p className="pricing-note">
          Excl. GST | Bulk pricing available. Confirm current availability and final pricing with us.
        </p>
        <p className="catalogue-support">
          Looking for bipolar forceps, surgical scissors, or needle holders?{" "}
          <EnquiryLink className="catalogue-support-link" />
        </p>
      </div>
    </section>
  );
}

function FeaturedSection({
  quoteList,
  onQuoteToggle,
  onEnquire,
  onImagePreview,
  catalogueProducts,
  loading,
  error,
  productLimit,
}: {
  quoteList: QuoteItem[];
  onQuoteToggle: (product: Product) => void;
  onEnquire: (product: Product) => void;
  onImagePreview: (product: Product) => void;
  catalogueProducts: Product[];
  loading: boolean;
  error: string;
  productLimit: number;
}) {
  const featuredProducts = catalogueProducts
    .filter((product) => product.featured)
    .sort((a, b) =>
      (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0) ||
      a.name.localeCompare(b.name),
    )
    .slice(0, Math.max(0, productLimit));
  return (
    <section className="featured-section section">
      <div className="wrap">
        <div className="featured-intro">
          <SectionHeading
            eyebrow="A closer look"
            title="Featured instruments"
            description="A few highlights from the catalogue to help you get started."
          />
          <a href="#products" className="button button-light">View all instruments <Icon name="arrow" /></a>
        </div>
        <div className="featured-grid">
          {loading && <p className="featured-state" role="status">Loading featured instruments...</p>}
          {!loading && error && <p className="featured-state" role="alert">Featured instruments could not be loaded: {error}</p>}
          {!loading && !error && featuredProducts.length === 0 && (
            <p className="featured-state">No featured instruments are currently available.</p>
          )}
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              featured
              quoted={quoteList.some((item) => item.product.id === product.id)}
              onQuoteToggle={onQuoteToggle}
              onEnquire={onEnquire}
              onImagePreview={onImagePreview}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ image }: { image?: SiteImage }) {
  return (
    <section className="section about-section" id="about">
      <div className="wrap about-layout">
        <div className="about-visual">
          <span className="about-index">KAVITA SURGICAL <i>—</i> PRODUCT DISCOVERY</span>
          <div className="about-visual-art">
            <ManagedImage
              storagePath={image?.storagePath}
              alt={image?.altText ?? ""}
              width="720"
              height="960"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="about-stamp"><span>KS</span><small>PRODUCT<br />DISCOVERY</small></div>
          <span className="about-visual-caption">Thoughtful browsing.<br /><strong>Direct answers.</strong></span>
        </div>
        <div className="about-copy">
          <SectionHeading
            eyebrow="About Kavita Surgical"
            title="A simpler way to find the instruments you need."
            description="Based in Malad East, Mumbai, Kavita Surgical offers a convenient way for medical professionals, healthcare institutions, and businesses to explore surgical instruments and ask us directly for product information and pricing."
          />
          <div className="about-points">
            <div><span>01</span><p><strong>A considered selection</strong>Browse a range of surgical instruments in one place.</p></div>
            <div><span>02</span><p><strong>Personal, direct enquiries</strong>Get in touch to ask about products and pricing.</p></div>
            <div><span>03</span><p><strong>Convenient communication</strong>Choose WhatsApp or phone — whichever works for you.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ settingsError }: { settingsError: string }) {
  const phoneNumber = business.phone;
  const directionsUrl = getDirectionsUrl();
  return (
    <section className="contact-section" id="contact">
      <div className="wrap contact-inner">
        <div className="contact-copy">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> Here when you need us</p>
          <h2>Let's find the right<br /><span>instrument together.</span></h2>
          <p>Reach out to {business.name} for product details, current pricing, or availability.</p>
          {settingsError && <p className="admin-error" role="alert">Business contact details could not be refreshed.</p>}
        </div>
        <div className="contact-card">
          <div className="contact-card-top"><span className="contact-monogram">KS</span><span>CONTACT DETAILS</span></div>
          <h3>{business.name}</h3>
          {business.gstin && <p><span>GSTIN</span> {business.gstin}</p>}
          {phoneNumber && <a className="contact-phone" href={`tel:${phoneNumber}`}><Icon name="phone" size={19} /> {business.phoneDisplay}</a>}
          {business.address && <a className="contact-address" href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="map" size={18} />
            <span>{business.addressLines[0]}<br />{business.addressLines[1]}</span>
          </a>}
          <div className="contact-actions">
            <EnquiryLink className="button button-light" />
            {phoneNumber && <a className="button button-ghost-light" href={`tel:${phoneNumber}`}><Icon name="phone" size={17} /> Call us</a>}
            {business.address && <a className="button button-ghost-light" href={directionsUrl} target="_blank" rel="noopener noreferrer"><Icon name="map" size={17} /> Directions</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const phoneNumber = business.phone;
  const directionsUrl = getDirectionsUrl();
  const activeSocialLinks = socialLinks.filter(
    (social): social is typeof social & { href: string } => Boolean(social.href),
  );

  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-brand">
          <a href="#home" className="brand">
            <span className="brand-mark"><span>K</span><i /></span>
            <span className="brand-name">KAVITA<span>SURGICAL</span></span>
          </a>
          <p>Surgical instruments and medical equipment.<br />Product discovery, made straightforward.</p>
        </div>
        <div className="footer-nav">
          <span className="footer-label">Explore</span>
          <a href="#home">Home</a><a href="#products">Products</a><a href="#categories">Categories</a>
          <a href="#about">About us</a><a href="#contact">Contact</a>
        </div>
        <div className="footer-contact">
          <span className="footer-label">Get in touch</span>
          {phoneNumber && <a href={`tel:${phoneNumber}`}>{business.phoneDisplay}</a>}
          {normalizeWhatsAppNumber(business.whatsappNumber) && <a href={whatsappLink(`Hello ${business.name}, I would like to know more about your instruments.`)} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>}
          {business.address && <a className="footer-address" href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${business.name} address on Google Maps`}>
            {business.addressLines[0]}<br />{business.addressLines[1]}
          </a>}
          {business.gstin && <span className="footer-gst">GSTIN {business.gstin}</span>}
        </div>
        <div className="footer-social">
          <span className="footer-label">Follow</span>
          {activeSocialLinks.length > 0 ? (
            <div className="social-links">
              {activeSocialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Kavita Surgical on ${social.name}`}
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Kavita Surgical. All rights reserved.</span>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: "Instagram" | "Facebook" | "LinkedIn" }) {
  const icon = {
    Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></>,
    Facebook: <><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1z" /></>,
    LinkedIn: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7m0-10v.01M12 17v-4a3 3 0 0 1 6 0v4m-6-4v4" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon[name]}
    </svg>
  );
}

function ImageLightbox({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!product) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])'),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [product, onClose]);

  if (!product) return null;

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    dialog.style.setProperty("--preview-x", `${y * -5}deg`);
    dialog.style.setProperty("--preview-y", `${x * 7}deg`);
  };
  const handlePreviewPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--preview-x", "0deg");
    event.currentTarget.style.setProperty("--preview-y", "0deg");
  };

  return (
    <div className="lightbox-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} image preview`}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerMove={handlePreviewPointerMove}
        onPointerLeave={handlePreviewPointerLeave}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close image preview">
          <Icon name="close" size={21} />
        </button>
        <ManagedImage
          storagePath={product.imageStoragePath}
          fallbackUrl={product.imageUrl}
          sizes="90vw"
          alt={product.imageAlt}
          width="720"
          height="960"
        />
        <div className="lightbox-caption">
          <span>{product.category}</span>
          <strong>{product.name}</strong>
          <small>{product.sku}</small>
        </div>
      </div>
    </div>
  );
}

function InquiryModal({
  product,
  quoteList,
  onClose,
  onQuantityChange,
}: {
  product: Product | null;
  quoteList: QuoteItem[];
  onClose: () => void;
  onQuantityChange: (product: Product, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [buyerName, setBuyerName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [phone, setPhone] = useState("");
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const quoteListRef = useRef(quoteList);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    quoteListRef.current = quoteList;
    onCloseRef.current = onClose;
  }, [quoteList, onClose]);

  useEffect(() => {
    if (!product) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const currentItem = quoteListRef.current.find((item) => item.product.id === product.id);
    setQuantity(String(currentItem?.quantity ?? 1));
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [product]);

  if (!product) return null;

  const includedQuoteItems: QuoteItem[] =
    quoteList.length > 0
      ? quoteList
      : [{ product, quantity: Math.max(1, Number(quantity) || 1) }];
  const quotedDetails = includedQuoteItems
    .map((item) =>
      `${item.product.name} (${item.product.sku}) — Quantity: ${
        item.product.id === product.id ? quantity : item.quantity
      }`,
    )
    .join("\n");
  const inquiryMessage = [
    `Hello ${business.name},`,
    "",
    "I would like to enquire about the following instrument:",
    "",
    quotedDetails,
    "",
    buyerName ? `Contact name: ${buyerName}` : "",
    organisation ? `Organisation: ${organisation}` : "",
    phone ? `Phone: ${phone}` : "",
    "",
    "Please share availability and bulk pricing.",
  ].filter(Boolean).join("\n");

  const whatsappUrl = whatsappLink(inquiryMessage);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        ref={modalRef}
        className="inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Instrument enquiry</span>
            <h2 id="inquiry-modal-title">{product.name}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close enquiry form">
            <Icon name="close" size={21} />
          </button>
        </div>
        <div className="modal-product-summary">
          <ManagedImage
            storagePath={product.imageStoragePath}
            fallbackUrl={product.imageUrl}
            alt=""
            aria-hidden="true"
            width="720"
            height="960"
          />
          <div>
            <strong>{product.sku}</strong>
            <span>{product.category}</span>
          </div>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => {
                const nextQuantity = Math.max(1, Number(event.target.value) || 1);
                setQuantity(nextQuantity.toString());
                onQuantityChange(product, nextQuantity);
              }}
            />
          </label>
        </div>
        {quoteList.length > 1 && (
          <p className="quote-modal-note">{quoteList.length} instruments will be included in this inquiry.</p>
        )}
        <div className="inquiry-form">
          <label>
            Buyer name
            <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" />
          </label>
          <label>
            Hospital / organisation
            <input value={organisation} onChange={(event) => setOrganisation(event.target.value)} placeholder="Organisation name" />
          </label>
          <label>
            Phone
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91" />
          </label>
        </div>
        <div className="modal-actions">
          {normalizeWhatsAppNumber(business.whatsappNumber)
            ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button modal-whatsapp">Send via WhatsApp</a>
            : <p role="status">WhatsApp contact is not configured. Please contact the business directly.</p>}
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("All Instruments");
  const [quoteList, setQuoteList] = useState<QuoteItem[]>([]);
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [textScale, setTextScale] = useState(1);
  const [catalogueProducts, setCatalogueProducts] = useState<Product[]>([]);
  const [catalogueProductsLoading, setCatalogueProductsLoading] = useState(true);
  const [catalogueProductsError, setCatalogueProductsError] = useState("");
  const [databaseCategories, setDatabaseCategories] = useState<AdminCategory[] | null>(null);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [filterCategoriesLoading, setFilterCategoriesLoading] = useState(true);
  const [filterCategoriesError, setFilterCategoriesError] = useState("");
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [homepage, setHomepage] = useState<HomepageSettings | null>(null);
  const [businessRevision, setBusinessRevision] = useState(0);
  const [businessSettingsError, setBusinessSettingsError] = useState("");

  useEffect(() => {
    const schema = document.getElementById("business-schema");
    if (!schema) return;
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          "@id": "#business",
          name: business.name,
          telephone: business.phone || undefined,
          taxID: business.gstin || undefined,
          description: "Surgical instruments catalogue and direct product enquiries.",
          address: business.address
            ? {
                "@type": "PostalAddress",
                streetAddress: business.address,
                addressCountry: "IN",
              }
            : undefined,
        },
        {
          "@type": "WebSite",
          "@id": "#website",
          name: business.name,
          inLanguage: "en-IN",
          publisher: { "@id": "#business" },
        },
      ],
    });
  }, [businessRevision]);

  useEffect(() => {
    let cancelled = false;
    const loadPublishedProducts = () => {
      if (!supabase) {
        setCatalogueProducts([]);
        setCatalogueProductsError("Supabase is not configured.");
        setCatalogueProductsLoading(false);
        return;
      }
      setCatalogueProductsLoading(true);
      return fetchPublishedProducts()
      .then((managedProducts: AdminProduct[]) => {
        if (!cancelled) {
          setCatalogueProducts(managedProducts);
          setCatalogueProductsError("");
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setCatalogueProducts([]);
          setCatalogueProductsError(getErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogueProductsLoading(false);
      });
    };
    const loadPublishedCategories = () =>
      fetchPublishedCategories()
        .then((rows) => {
          if (!cancelled) setDatabaseCategories(rows);
        })
        .catch(() => {
          if (!cancelled) setDatabaseCategories(null);
        });
    const loadPublishedFilterCategories = () => {
      setFilterCategoriesLoading(true);
      return fetchPublishedFilterCategories()
        .then((rows) => {
          if (!cancelled) {
            setFilterCategories(rows);
            setFilterCategoriesError("");
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setFilterCategories([]);
            setFilterCategoriesError(getErrorMessage(caught));
          }
        })
        .finally(() => {
          if (!cancelled) setFilterCategoriesLoading(false);
        });
    };
    const loadPublishedSiteImages = () =>
      fetchPublishedSiteImages()
        .then((rows) => {
          if (!cancelled) setSiteImages(rows);
        })
        .catch(() => {
          if (!cancelled) setSiteImages([]);
        });
    void loadPublishedProducts();
    void loadPublishedCategories();
    void loadPublishedFilterCategories();
    void loadPublishedSiteImages();
    const channel = supabase
      ?.channel("published-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => void loadPublishedProducts(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_images" },
        () => void loadPublishedProducts(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => void loadPublishedCategories(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "filter_categories" },
        () => void loadPublishedFilterCategories(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_images" },
        () => void loadPublishedSiteImages(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      if (channel) void supabase?.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const siteIcon = siteImages.find((image) => image.sectionKey === "site-icon");
    let cancelled = false;
    let refreshTimer: number | undefined;
    if (!siteIcon) {
      document.querySelector('link[rel="icon"]')?.remove();
      return () => {
        cancelled = true;
      };
    }

    const refreshIcon = async () => {
      try {
        const url = await createManagedImageUrl(siteIcon.storagePath);
        if (cancelled) return;
        let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!iconLink) {
          iconLink = document.createElement("link");
          iconLink.rel = "icon";
          document.head.append(iconLink);
        }
        iconLink.href = url;
        refreshTimer = window.setTimeout(
          refreshIcon,
          (SIGNED_IMAGE_URL_TTL_SECONDS - 60) * 1000,
        );
      } catch {
        if (!cancelled) document.querySelector('link[rel="icon"]')?.remove();
      }
    };
    void refreshIcon();
    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [siteImages]);

  useEffect(() => {
    if (
      !filterCategoriesLoading &&
      selectedCategory.startsWith("filter-category:") &&
      !filterCategories.some((category) =>
        `filter-category:${category.id}` === selectedCategory,
      )
    ) {
      setSelectedCategory("All Instruments");
    }
  }, [filterCategories, filterCategoriesLoading, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = () =>
      Promise.all([fetchHomepageSettings(), fetchBusinessSettings()])
      .then(([homepageSettings, businessSettings]) => {
        if (cancelled) return;
        if (homepageSettings) setHomepage(homepageSettings);
        if (businessSettings) {
          business.name = businessSettings.name || business.name;
          business.gstin = businessSettings.gstin;
          business.phone = businessSettings.phone;
          business.phoneDisplay = businessSettings.phone;
          business.whatsappNumber = normalizeWhatsAppNumber(businessSettings.whatsapp);
          business.address = businessSettings.address;
          business.addressLines = business.address.split(/,\s*(?=[^,]+$)/);
          const socialByName = new Map([
            ["Instagram", businessSettings.instagram],
            ["Facebook", businessSettings.facebook],
            ["LinkedIn", businessSettings.linkedin],
          ]);
          socialLinks.forEach((social) => {
            social.href = safeHttpsUrl(socialByName.get(social.name) ?? "");
          });
          setBusinessRevision((revision) => revision + 1);
        }
        setBusinessSettingsError("");
      })
      .catch((caught: unknown) => {
        if (!cancelled) setBusinessSettingsError(getErrorMessage(caught));
      });
    void loadSettings();
    const settingsChannel = supabase
      ?.channel("public-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_settings" },
        () => void loadSettings(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_settings" },
        () => void loadSettings(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      if (settingsChannel) void supabase?.removeChannel(settingsChannel);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--catalogue-font-scale", textScale.toString());
  }, [textScale]);

  const toggleQuote = (product: Product) => {
    setQuoteList((current) =>
      current.some((item) => item.product.id === product.id)
        ? current.filter((item) => item.product.id !== product.id)
        : [...current, { product, quantity: 1 }],
    );
  };

  const changeQuoteQuantity = (product: Product, quantity: number) => {
    setQuoteList((current) =>
      current.map((item) =>
        item.product.id === product.id ? { ...item, quantity } : item,
      ),
    );
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const catalogueCategoryNames = uniqueCategoryNames(databaseCategories
    ? databaseCategories.map((category) => category.name)
    : catalogueProducts.map((product) => product.category));
  const catalogueCategories = databaseCategories ?? catalogueCategoryNames.map((name, index) => ({
    name,
    slug: `catalogue-category-${index}`,
    description: "",
    image: "",
    imageAlt: "",
    imagePublished: false,
    sortOrder: index,
    published: true,
  }));
  const aboutImage = siteImages.find((image) => image.sectionKey === "about-visual");
  const promotionalBanner = siteImages.find((image) => image.sectionKey === "promotional-banner");

  return (
    <>
      <Header />
      <main id="main-content">
        <Hero homepage={homepage} />
        {promotionalBanner && (
          <section className="site-promo-banner" aria-label="Promotional banner">
            <div className="wrap">
              <ManagedImage
                storagePath={promotionalBanner.storagePath}
                alt={promotionalBanner.altText}
                loading="lazy"
                decoding="async"
              />
            </div>
          </section>
        )}
        <CategorySection
          onSelect={selectCategory}
          catalogueCategories={catalogueCategories}
        />
        <Catalogue
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          quoteList={quoteList}
          onQuoteToggle={toggleQuote}
          onEnquire={setEnquiryProduct}
          onImagePreview={setPreviewProduct}
          textScale={textScale}
          onTextScaleChange={setTextScale}
          catalogueProducts={catalogueProducts}
          filterCategories={filterCategories}
          filterCategoriesLoading={filterCategoriesLoading}
          filterCategoriesError={filterCategoriesError}
        />
        <FeaturedSection
          quoteList={quoteList}
          onQuoteToggle={toggleQuote}
          onEnquire={setEnquiryProduct}
          onImagePreview={setPreviewProduct}
          catalogueProducts={catalogueProducts}
          loading={catalogueProductsLoading}
          error={catalogueProductsError}
          productLimit={homepage?.featuredProductLimit ?? 3}
        />
        <AboutSection image={aboutImage} />
        <ContactSection settingsError={businessSettingsError} />
      </main>
      <Footer />
      {normalizeWhatsAppNumber(business.whatsappNumber) && (
        <a
          className="floating-whatsapp"
          href={whatsappLink(`Hello ${business.name}, I would like to know more about your surgical instruments.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with ${business.name} on WhatsApp`}
        >
          <Icon name="chat" size={22} />
          <span>Chat with us</span>
        </a>
      )}
      <ImageLightbox product={previewProduct} onClose={() => setPreviewProduct(null)} />
      <InquiryModal
        product={enquiryProduct}
        quoteList={quoteList}
        onClose={() => setEnquiryProduct(null)}
        onQuantityChange={changeQuoteQuantity}
      />
    </>
  );
}
