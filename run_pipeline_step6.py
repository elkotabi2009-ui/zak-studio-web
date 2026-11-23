#!/usr/bin/env python3
"""
STEP 6: Prospect Company Landing Page Generator
Generates professional company presentation landing pages for prospects who reply "interested"
NOT a full website, NOT ecommerce, NOT maintenance portal.
Purpose: Professional digital business card / company presentation page.
"""
import os, json, subprocess, shutil, base64
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = Path(__file__).parent
NETLIFY_AUTH_TOKEN = os.getenv("NETLIFY_AUTH_TOKEN")

# Read logo as base64 for embedding
_logo_path = PROJECT_DIR / "07-assets" / "logo-mark.svg"
LOGO_SVG = _logo_path.read_text(encoding="utf-8") if _logo_path.exists() else ""
LOGO_BASE64 = base64.b64encode(LOGO_SVG.encode()).decode() if LOGO_SVG else ""

# Landing page template - PROFESSIONAL COMPANY PRESENTATION (Biglietto da visita digitale)
LANDING_TEMPLATE = """<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{company_name}} - {{sector}} | {{location}} | {{employees}} dipendenti | Export: {{export_markets}}">
    <title>{{company_name}} | {{sector}} - Eccellenza Italiana nel Mondo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Schema.org Organization -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "{{company_name}}",
        "url": "{{canonical_url}}",
        "logo": "{{canonical_url}}/assets/logo.svg",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "{{address_street}}",
            "addressLocality": "{{address_city}}",
            "addressRegion": "{{address_province}}",
            "postalCode": "{{address_cap}}",
            "addressCountry": "IT"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "{{phone}}",
            "contactType": "customer service",
            "availableLanguage": ["Italian", "English"]
        },
        "sameAs": {{social_links_json}}
    }
    </script>

    <!-- Schema.org Products (sample) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": {{products_schema_json}}
    }
    </script>

    <style>
        {{ CSS_CONTENT }}
    </style>
</head>
<body>
    <!-- Hero Section -->
    <header class="hero" role="banner">
        <div class="container">
            <div class="hero-logo">
                <img class="logo-mark" src="data:image/svg+xml;base64,{{logo_base64}}" alt="ZAK Studio Web" width="48" height="48"/>
                <span class="logo-text">ZAK Studio Web</span>
            </div>
            <div class="hero-badge">{{sector_badge}}</div>
            <h1 class="hero-title">{{company_name}}</h1>
            <p class="hero-subtitle">{{hero_subtitle}}</p>
            <div class="hero-metrics">
                <div class="metric">
                    <span class="metric-value">{{employees}}</span>
                    <span class="metric-label">Dipendenti</span>
                </div>
                <div class="metric">
                    <span class="metric-value">{{year_founded}}+</span>
                    <span class="metric-label">Anni di Esperienza</span>
                </div>
                <div class="metric">
                    <span class="metric-value">{{export_count}}+</span>
                    <span class="metric-label">Paesi Export</span>
                </div>
                <div class="metric">
                    <span class="metric-value">{{certifications_count}}</span>
                    <span class="metric-label">Certificazioni</span>
                </div>
            </div>
            <div class="hero-cta">
                <a href="#contatti" class="cta-primary">Richiedi Informazioni</a>
                <a href="#prodotti" class="cta-secondary">I Nostri Prodotti</a>
            </div>
        </div>
    </header>

    <!-- Chi Siamo -->
    <section id="chi-siamo" class="section about" aria-labelledby="about-title">
        <div class="container">
            <h2 id="about-title" class="section-title">Chi Siamo</h2>
            <div class="about-grid">
                <div class="about-text">
                    <p>{{about_paragraph_1}}</p>
                    <p>{{about_paragraph_2}}</p>
                </div>
                <div class="about-highlights">
                    <h3>Perché Sceglierci</h3>
                    <ul>
                        {% for highlight in highlights %}
                        <li>{{highlight}}</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Prodotti/Servizi -->
    <section id="prodotti" class="section products" aria-labelledby="products-title">
        <div class="container">
            <h2 id="products-title" class="section-title">Prodotti e Servizi</h2>
            <p class="section-subtitle">Soluzioni tecniche per l'industria {{sector_lower}}: qualità, precisione, affidabilità.</p>

            <div class="products-grid">
                {% for product in products %}
                <article class="product-card" itemscope itemtype="https://schema.org/Product">
                    <div class="product-icon">{{product.icon}}</div>
                    <h3 itemprop="name">{{product.name}}</h3>
                    <p itemprop="description">{{product.description}}</p>
                    <ul class="product-specs">
                        {% for spec in product.specs %}
                        <li>{{spec}}</li>
                        {% endfor %}
                    </ul>
                    <a href="#contatti" class="product-cta" data-product="{{product.name}}">Richiedi Scheda Tecnica</a>
                    <meta itemprop="brand" content="{{company_name}}">
                    <meta itemprop="category" content="{{sector}}">
                </article>
                {% endfor %}
            </div>
        </div>
    </section>

    <!-- Certificazioni & Export -->
    <section id="certificazioni" class="section certifications" aria-labelledby="cert-title">
        <div class="container">
            <h2 id="cert-title" class="section-title">Certificazioni ed Export</h2>
            <div class="cert-grid">
                <div class="cert-block">
                    <h3>Certificazioni</h3>
                    <ul class="cert-list">
                        {% for cert in certifications %}
                        <li>{{cert}}</li>
                        {% endfor %}
                    </ul>
                </div>
                <div class="cert-block">
                    <h3>Mercati Export</h3>
                    <div class="export-countries">
                        {% for country in export_countries %}
                        <span class="country-tag">{{country}}</span>
                        {% endfor %}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Referenze / Case Study -->
    <section id="referenze" class="section references" aria-labelledby="ref-title">
        <div class="container">
            <h2 id="ref-title" class="section-title">Alcuni Clienti Soddisfatti</h2>
            <div class="refs-grid">
                {% for ref in references %}
                <div class="ref-card">
                    <h4>{{ref.name}}</h4>
                    <p>{{ref.project}}</p>
                    <span class="ref-sector">{{ref.sector}}</span>
                </div>
                {% endfor %}
            </div>
        </div>
    </section>

    <!-- Contatti -->
    <section id="contatti" class="section contact" aria-labelledby="contact-title">
        <div class="container">
            <h2 id="contact-title" class="section-title">Contattaci</h2>
            <p class="section-subtitle">Siamo a disposizione per preventivi, schede tecniche, campioni e informazioni commerciali.</p>

            <div class="contact-grid">
                <div class="contact-info">
                    <h3>Sede Operativa</h3>
                    <address>
                        {{address_street}}<br>
                        {{address_cap}} {{address_city}} ({{address_province}})<br>
                        Italia
                    </address>
                    <div class="contact-item">
                        <strong>Telefono:</strong> <a href="tel:{{phone}}">{{phone}}</a>
                    </div>
                    <div class="contact-item">
                        <strong>Email:</strong> <a href="mailto:{{email}}">{{email}}</a>
                    </div>
                    {% if pec %}
                    <div class="contact-item">
                        <strong>PEC:</strong> <a href="mailto:{{pec}}">{{pec}}</a>
                    </div>
                    {% endif %}
                </div>

                <form id="contact-form" class="contact-form" action="https://formspree.io/f/{{formspree_id}}" method="POST">
                    <input type="hidden" name="_next" value="{{canonical_url}}#grazie">
                    <div class="form-group">
                        <label for="nome">Nome e Cognome *</label>
                        <input type="text" id="nome" name="nome" required>
                    </div>
                    <div class="form-group">
                        <label for="azienda">Azienda</label>
                        <input type="text" id="azienda" name="azienda">
                    </div>
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="telefono">Telefono</label>
                        <input type="tel" id="telefono" name="telefono">
                    </div>
                    <div class="form-group">
                        <label for="messaggio">Richiesta *</label>
                        <textarea id="messaggio" name="messaggio" rows="5" required placeholder="Descrivi la tua esigenza: preventivo, scheda tecnica, campioni, collaborazione..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="interesse">Prodotto/Servizio di interesse</label>
                        <select id="interesse" name="interesse">
                            <option value="">Seleziona...</option>
                            {% for product in products %}
                            <option value="{{product.name}}">{{product.name}}</option>
                            {% endfor %}
                            <option value="altro">Altro / Consulenza tecnica</option>
                        </select>
                    </div>
                    <button type="submit" class="cta-primary form-submit">Invia Richiesta</button>
                    <p class="form-note">Rispondiamo entro 24 ore lavorative. I dati sono trattati secondo GDPR - <a href="{{privacy_url}}" target="_blank">Privacy Policy</a></p>
                </form>
            </div>

            <div id="grazie" class="thank-you hidden">
                <h3>Grazie per la richiesta!</h3>
                <p>Il nostro team tecnico-commerciale ti contatterà entro 24 ore.</p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-company">
                    <div class="footer-logo">
                        <img class="logo-mark" src="data:image/svg+xml;base64,{{logo_base64}}" alt="ZAK Studio Web" width="48" height="48"/>
                        <span class="logo-text">ZAK Studio Web</span>
                    </div>
                    <p>{{footer_tagline}}</p>
                    <p class="footer-credits">Landing page creata da <strong>ZAK Studio Web</strong> — Digital presence per l'industria italiana</p>
                </div>
                <div class="footer-links">
                    <h4>Navigazione</h4>
                    <nav>
                        <a href="#chi-siamo">Chi Siamo</a>
                        <a href="#prodotti">Prodotti</a>
                        <a href="#certificazioni">Certificazioni</a>
                        <a href="#referenze">Referenze</a>
                        <a href="#contatti">Contatti</a>
                    </nav>
                </div>
                <div class="footer-links">
                    <h4>Legale</h4>
                    <nav>
                        <a href="{{privacy_url}}" target="_blank">Privacy Policy</a>
                        <a href="{{cookie_url}}" target="_blank">Cookie Policy</a>
                        <a href="{{terms_url}}" target="_blank">Termini di Servizio</a>
                    </nav>
                </div>
                <div class="footer-social">
                    <h4>Seguici</h4>
                    <div class="social-links">
                        {% if linkedin %}
                        <a href="{{linkedin}}" target="_blank" rel="noopener" aria-label="LinkedIn">LinkedIn</a>
                        {% endif %}
                        {% if youtube %}
                        <a href="{{youtube}}" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a>
                        {% endif %}
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; {{current_year}} {{company_name}}. Tutti i diritti riservati.</p>
                <p class="credits">Landing page realizzata da <a href="https://zakstudio.com" target="_blank">ZAK Studio Web</a> — Professional Digital Presence</p>
            </div>
        </div>
    </footer>

    <script>
        {{ JS_CONTENT }}
    </script>
</body>
</html>"""

# CSS Content (inlined for performance)
CSS_CONTENT = """
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #ffffff; line-height: 1.7; font-size: 16px; }

.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

/* Hero */
.hero { padding: 5rem 0 4rem; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #e2e8f0; }
.hero-badge { display: inline-block; padding: 0.5rem 1.25rem; background: #1a3c5e; color: #fff; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 9999px; margin-bottom: 1.5rem; }
.hero-title { font-size: clamp(2.25rem, 5vw, 3.5rem); line-height: 1.15; margin-bottom: 1rem; color: #1a1a2e; font-weight: 700; letter-spacing: -0.02em; }
.hero-subtitle { font-size: clamp(1.125rem, 2.5vw, 1.375rem); color: #475569; max-width: 70ch; margin: 0 auto 2.5rem; font-weight: 400; }
.hero-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin: 3rem auto 0; max-width: 800px; }
.metric { padding: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; transition: box-shadow 0.2s, transform 0.2s; }
.metric:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.metric-value { display: block; font-size: 2.5rem; font-weight: 700; color: #1a3c5e; line-height: 1; }
.metric-label { display: block; font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
.hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 3rem; }

/* Logo styles */
.hero-logo, .footer-logo { display: inline-flex; align-items: center; gap: 0.75rem; justify-content: center; margin-bottom: 0.5rem; }
.logo-mark { width: 48px; height: 48px; flex-shrink: 0; }
.logo-text { font-size: 1.5rem; font-weight: 700; color: #1a3c5e; letter-spacing: -0.02em; }
.footer-logo .logo-text { font-size: 1.25rem; }

/* Buttons */
.cta-primary, .cta-secondary, .form-submit { display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 8px; font-weight: 600; font-size: 1rem; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; }
.cta-primary { background: #1a3c5e; color: #fff; }
.cta-primary:hover { background: #0f2740; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,60,94,0.3); }
.cta-secondary { background: #fff; color: #1a3c5e; border: 2px solid #1a3c5e; }
.cta-secondary:hover { background: #1a3c5e; color: #fff; }
.form-submit { width: 100%; background: #1a3c5e; color: #fff; }
.form-submit:hover { background: #0f2740; }

/* Sections */
.section { padding: 5rem 0; }
.section:nth-child(even) { background: #f8fafc; }
.section-title { font-size: clamp(1.75rem, 3.5vw, 2.25rem); text-align: center; margin-bottom: 0.5rem; color: #1a1a2e; font-weight: 700; }
.section-subtitle { font-size: 1.125rem; text-align: center; color: #64748b; margin-bottom: 3rem; max-width: 60ch; margin-left: auto; margin-right: auto; }

/* About */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
.about-text p { margin-bottom: 1.5rem; color: #334155; }
.about-highlights { background: #1a3c5e; color: #fff; padding: 2.5rem; border-radius: 16px; }
.about-highlights h3 { font-size: 1.25rem; margin-bottom: 1.5rem; }
.about-highlights ul { list-style: none; }
.about-highlights li { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; padding-left: 1.5rem; }
.about-highlights li:last-child { border-bottom: none; }
.about-highlights li::before { content: "✓"; position: absolute; left: 0; color: #e86c00; font-weight: bold; }

/* Products */
.products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.product-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; transition: box-shadow 0.3s, transform 0.3s; text-align: center; }
.product-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.1); transform: translateY(-4px); }
.product-icon { font-size: 3rem; margin-bottom: 1rem; }
.product-card h3 { font-size: 1.25rem; margin-bottom: 1rem; color: #1a1a2e; }
.product-card p { color: #64748b; margin-bottom: 1.5rem; line-height: 1.6; }
.product-specs { list-style: none; text-align: left; margin-bottom: 1.5rem; padding: 0 1rem; }
.product-specs li { padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #475569; }
.product-specs li:last-child { border-bottom: none; }
.product-cta { display: inline-block; padding: 0.75rem 1.5rem; background: #f8fafc; color: #1a3c5e; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; transition: all 0.2s; }
.product-cta:hover { background: #1a3c5e; color: #fff; border-color: #1a3c5e; }

/* Certifications */
.cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
.cert-block h3 { font-size: 1.125rem; margin-bottom: 1.5rem; color: #1a1a2e; }
.cert-list { list-style: none; }
.cert-list li { padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.75rem; }
.cert-list li:last-child { border-bottom: none; }
.cert-list li::before { content: ""; width: 8px; height: 8px; background: #1a3c5e; border-radius: 50%; flex-shrink: 0; }
.export-countries { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.country-tag { padding: 0.5rem 1rem; background: #1a3c5e; color: #fff; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }

/* References */
.refs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.ref-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; text-align: center; }
.ref-card h4 { font-size: 1.125rem; color: #1a1a2e; margin-bottom: 0.5rem; }
.ref-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 0.75rem; }
.ref-sector { display: inline-block; padding: 0.25rem 0.75rem; background: #f1f5f9; color: #475569; border-radius: 9999px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem; align-items: start; }
.contact-info { background: #1a3c5e; color: #fff; padding: 2.5rem; border-radius: 16px; }
.contact-info h3 { font-size: 1.25rem; margin-bottom: 1.5rem; }
.contact-info address { font-style: normal; line-height: 1.8; margin-bottom: 1.5rem; }
.contact-item { margin-bottom: 0.75rem; }
.contact-item a { color: #e86c00; text-decoration: none; transition: color 0.2s; }
.contact-item a:hover { color: #fff; }
.contact-form { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1a1a2e; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.875rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #1a3c5e; box-shadow: 0 0 0 3px rgba(26,60,94,0.15); }
.form-note { font-size: 0.75rem; color: #64748b; margin-top: 1rem; text-align: center; }
.form-note a { color: #1a3c5e; }
.thank-you { text-align: center; padding: 3rem; color: #1a3c5e; }
.hidden { display: none !important; }

/* Footer */
.footer { background: #1a1a2e; color: #fff; padding: 4rem 0 2rem; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
.footer-company h3 { font-size: 1.5rem; margin-bottom: 1rem; }
.footer-company p { color: #94a3b8; margin-bottom: 1.5rem; }
.footer-legal { font-size: 0.875rem; color: #64748b; line-height: 1.8; }
.footer-links h4 { font-size: 1rem; margin-bottom: 1rem; color: #e86c00; }
.footer-links nav { display: flex; flex-direction: column; gap: 0.5rem; }
.footer-links a { color: #94a3b8; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
.footer-links a:hover { color: #e86c00; }
.social-links { display: flex; flex-direction: column; gap: 0.5rem; }
.social-links a { color: #94a3b8; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
.social-links a:hover { color: #e86c00; }
.footer-bottom { border-top: 1px solid #334155; padding-top: 2rem; text-align: center; color: #64748b; font-size: 0.875rem; }
.footer-bottom a { color: #e86c00; text-decoration: none; }
.footer-bottom a:hover { text-decoration: underline; }
.credits { margin-top: 0.5rem; }

/* Mobile */
@media (max-width: 1024px) {
    .about-grid { grid-template-columns: 1fr; gap: 2rem; }
    .cert-grid { grid-template-columns: 1fr; gap: 2rem; }
    .contact-grid { grid-template-columns: 1fr; gap: 2rem; }
    .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
}
@media (max-width: 768px) {
    .hero-metrics { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .metric-value { font-size: 2rem; }
    .footer-grid { grid-template-columns: 1fr; text-align: center; }
    .social-links { flex-direction: row; justify-content: center; }
    .footer-links nav { align-items: center; }
}
"""

# JavaScript Content
JS_CONTENT = """
// Form handling
document.getElementById('contact-form').addEventListener('submit', function(e) {
    const form = this;
    const submitBtn = form.querySelector('.form-submit');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Invio in corso...';
    submitBtn.disabled = true;

    // Let form submit naturally to Formspree
    // Success handling via _next redirect
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.focus({ preventScroll: true });
        }
    });
});

// Product CTA tracking
document.querySelectorAll('.product-cta').forEach(btn => {
    btn.addEventListener('click', function() {
        const product = this.dataset.product;
        if (typeof gtag !== 'undefined') {
            gtag('event', 'product_inquiry', { product_name: product });
        }
    });
});

// Intersection Observer for animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Hero visible immediately
document.querySelector('.hero').style.opacity = '1';
document.querySelector('.hero').style.transform = 'translateY(0)';
"""

def get_sector_data(sector: str) -> dict:
    """Return sector-specific content for landing page"""
    sector_lower = sector.lower()

    sector_configs = {
        "manifatturiero meccanico": {
            "badge": "Manifatturiero Meccanico — Precisione Industriale",
            "subtitle": "Produzione di componenti meccanici ad alta precisione per l'industria globale. Qualità certificata, consegne puntuali, innovazione continua.",
            "highlights": [
                "Tolleranze al micron su specifiche cliente",
                "Certificazioni ISO 9001 / ISO 14001 / ISO 45001",
                "Ufficio tecnico interno per co-progettazione",
                "Gestione completa: dalla materia prima al prodotto finito",
                "Tracciabilità totale lotti produzione",
                "Consegne just-in-time su kanban cliente"
            ],
            "about_1": "Da oltre {{year_founded}} anni, {{company_name}} è punto di riferimento nel settore {{sector_lower}} per aziende che richiedono componenti meccanici di precisione, affidabili e consegnati nei tempi concordati. La nostra sede di {{location}} ospita un parco macchine all'avanguardia e un team tecnico specializzato.",
            "about_2": "Lavoriamo con i principali settori industriali — automotive, aerospace, oil & gas, macchine utensili, automazione — fornendo componenti critici dove la precisione non è negoziabile. Ogni pezzo è controllato secondo piani di controllo concordati con il cliente, con report dimensionali completi.",
            "products": [
                {"name": "Componenti per Presse Idrauliche", "icon": "⚙️", "description": "Alberi, pistoni, guide, flange per presse fino a 5000 tonnellate. Materiali: acciai legati, temprati, nitrurati.", "specs": ["Tolleranze ±0.01 mm", "Rugosità Ra 0.4-0.8", "Trattamenti termici certificati", "Collaudo 100% dimensionale"]},
                {"name": "Parti per Macchine Utensili", "icon": "🔧", "description": "Mandrini, slitte, basamenti, colonne per centri di lavoro e torni CNC. Rigidità e stabilità termica garantite.", "specs": ["Acciai da bonifica / cementazione", "Distensione termica controllata", "Geometrie complesse 5 assi", "Rapporto PPAP su richiesta"]},
                {"name": "Componentistica Automotive", "icon": "🚗", "description": "Componenti sicurezza critica per OEM e Tier 1: perni, bielle, alberi motore, parti frenanti.", "specs": ["IATF 16949 compliant", "PPAP Livello 3", "IMDS registrato", "Tracciabilità lotto-fornitore"]},
                {"name": "Lavorazioni Conto Terzi CNC", "icon": "🏭", "description": "Servizio completo tornitura/fresatura 3-5 assi per lotti da 1 a 5000 pezzi. Dalla forgia al finito.", "specs": ["CNC 5 assi Hermle / DMG Mori", "Controllo CMM Zeiss", "Gestione Kanban / JIT", "Documentazione First Article Inspection"]}
            ],
            "certifications": ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018", "IATF 16949:2016 (se automotive)", "PED 2014/68/UE (se pressione)", "EN 1090 (se strutture metalliche)"],
            "export_countries": ["Germania", "Francia", "USA", "Spagna", "Polonia", "Rep. Ceca", "Turchia", "Brasile", "India", "Cina"],
            "references": [
                {"name": "Gruppo Metalmeccanico BO (Brescia)", "project": "Fornitura annua 50.000 alberi pressa", "sector": "Presse Idrauliche"},
                {"name": "Costruttore Macchine UT (Bergamo)", "project": "Mandrini e slitte per centri lavoro 5 assi", "sector": "Macchine Utensili"},
                {"name": "OEM Automotive (Torino)", "project": "Componenti sicurezza critica - 2M pz/anno", "sector": "Automotive"}
            ]
        },
        "macchine utensili": {
            "badge": "Costruttori Macchine Utensili — Tecnologia Avanzata",
            "subtitle": "Progettazione e costruzione di centri di lavoro, torni CNC e macchine speciali per l'industria manifatturiera mondiale.",
            "highlights": [
                "Centri lavoro 3-5 assi ad alta dinamica",
                "Torni CNC multi-torretta / multi-mandrino",
                "Macchine speciali su specifica cliente",
                "Retrofit e revamping macchine esistenti",
                "Service post-vendita globale 24/7",
                "Formazione operatori e programmatori"
            ],
            "about_1": "{{company_name}} progetta e costruisce macchine utensili ad alta tecnologia dal {{year_founded}}. La nostra gamma copre centri di lavoro verticali e orizzontali, torni CNC multi-tasking e macchine speciali per lavorazioni complesse. Ogni macchina nasce dall'ascolto delle esigenze produttive del cliente.",
            "about_2": "Con {{employees}} dipendenti tra ingegneri meccanici, elettrici, software e tecnici di montaggio, gestiamo internamente l'intero ciclo: progettazione meccanica (SolidWorks/Inventor), elettrica (Eplan), software (Siemens/Heidenhain/Fanuc), assemblaggio, collaudo geometrico (laser/ballbar) e avviamento presso il cliente.",
            "products": [
                {"name": "Centri Lavoro Verticali VMC", "icon": "🏭", "description": "Corsa X/Y/Z 800-2000 mm, mandrino 12.000-24.000 rpm, cambi utensile 30-120 posizioni.", "specs": ["Precisione posizionamento ±0.004 mm", "Ripetibilità ±0.002 mm", "Avanzamenti 40-60 m/min", "CNC Siemens 840D / Heidenhain TNC / Fanuc 31i"]},
                {"name": "Centri Lavoro Orizzontali HMC", "icon": "⚙️", "description": "Pallet 400-1000 mm, 2-6 stazioni, tavola rotante 1°/0.001°. Per produzione alta volumi.", "specs": ["Cambio pallet < 8 sec", "Mandrini torque elevato", "Sistemi misura in-process Renishaw", "Automazione pallet system integrata"]},
                {"name": "Torni CNC Multi-Tasking", "icon": "🔄", "description": "Tornitura + fresatura in un setup. 2 torrette, 2 mandrini, asse Y, asse B. Done-in-one.", "specs": ["Diametro max tornitura 300-800 mm", "Lunghezza max 1000-3000 mm", "Mandrino principale + contromandrino", "Fresatura asse B/C continua"]},
                {"name": "Macchine Speciali & Retrofit", "icon": "🛠️", "description": "Macchine dedicate per processi specifici. Revamping macchine obsolete con CNC moderno.", "specs": ["Progettazione su specifica cliente", "Integrazione robot/automazione", "Adeguamento sicurezza Macchine 2006/42/CE", "Collaudo CE e libreria tecnica"]}
            ],
            "certifications": ["ISO 9001:2015", "CE Macchine 2006/42/CE", "ISO 13849-1 (Safety)", "UL/CSA (per export USA/Canada)"],
            "export_countries": ["Germania", "USA", "Cina", "India", "Messico", "Brasile", "Turchia", "Polonia", "Francia", "Regno Unito"],
            "references": [
                {"name": "Tier 1 Automotive (Stoccarda)", "project": "5 Centri lavoro HMC pallet 630 mm", "sector": "Automotive"},
                {"name": "Costruttore Stampi (Milano)", "project": "VMC 5 assi per stampi in acciaio temprato", "sector": "Stampaggio"},
                {"name": "Aerospace Fornitore (Tolosa)", "project": "Torni multi-tasking per parti titanio", "sector": "Aerospace"}
            ]
        },
        "stampaggio metalli": {
            "badge": "Stampaggio Metalli a Freddo/Caldo — Precisione di Serie",
            "subtitle": "Stampaggio lamiere, tranciatura, imbutitura profonda, stampaggio a caldo. Dalla prototipazione alla grande serie.",
            "highlights": [
                "Imbutitura profonda fino a 500 mm diametro",
                "Tranciatura fine tolleranze ±0.03 mm",
                "Stampaggio a caldo acciai alto resistenziali",
                "Saldatura robotizzata / clinching / rivettatura",
                "Trattamenti superficie: zincatura, cataforesi, verniciatura",
                "Assemblaggio sottogruppi completi"
            ],
            "about_1": "{{company_name}} opera nello stampaggio metalli dal {{year_founded}} con presse da 100 a 2500 tonnellate. Realizziamo componenti stampati per automotive, elettrodomestici, edilizia, energetico. Internamente: progettazione stampi (CAD/CAM/CAE), costruzione stampi, stampaggio, trattamenti, assemblaggio.",
            "about_2": "Il nostro parco presse include linee progressive, transfer e tandem. Gestiamo acciai dolci, alto resistenziali (DP, CP, MS), inox, alluminio. Ogni progetto parte da simulazione stampo (AutoForm/LS-DYNA) per garantire fattibilità e zero difetti in produzione. Certificati IATF 16949 per automotive.",
            "products": [
                {"name": "Componenti Strutturali Automotive", "icon": "🚗", "description": "Longheroni, rinforzi, traverse, parti crash. Acciai DP/CP/MS 500-1500 MPa.", "specs": ["IATF 16949", "PPAP Livello 3", "IMDS", "Controllo 100% caratteristiche critiche"]},
                {"name": "Parti Elettrodomestici / Bianco", "icon": "🏠", "description": "Casse, porte, componenti interni lavatrici/forni/frigo. Acciaio preverniciato / inox.", "specs": ["Aspetto estetico Classe A", "Resistenza corrosione 500h CASS", "Tolleranze dimensionali ±0.1 mm", "Imballaggio dedicato just-in-sequence"]},
                {"name": "Componenti Edilizia / Energetico", "icon": "🏗️", "description": "Profili per facciate continue, staffe fotovoltaico, componenti eolico. Zincati a caldo / magni.", "specs": ["EN 1090 EXC2/EXC3", "Zincatura 80-120 µm", "Marcatura CE", "Certificato 3.1 EN 10204"]},
                {"name": "Stampaggio Conto Terzi / Prototipi", "icon": "🔨", "description": "Servizio stampaggio per vostri stampi. Prototipazione rapida (stampa 3D inserti) per validazione.", "specs": ["Presse 100-2500 ton", "Cambio stampo < 15 min", "Lotti da 500 a 500.000 pz", "Report dimensionali First Article"]}
            ],
            "certifications": ["IATF 16949:2016", "ISO 9001:2015", "ISO 14001:2015", "EN 1090 EXC3", "ISO 45001:2018"],
            "export_countries": ["Germania", "Francia", "Spagna", "Polonia", "Rep. Ceca", "Slovacchia", "Ungheria", "Romania", "Turchia", "Marocco"],
            "references": [
                {"name": "OEM Tedesco (Monaco)", "project": "12 componenti strutturali - 3M pz/anno", "sector": "Automotive"},
                {"name": "Leader Elettrodomestici (Bergamo)", "project": "Casse lavatrici - 500k pz/anno", "sector": "White Goods"},
                {"name": "Costruttore Fotovoltaico (Padova)", "project": "Staffe montaggio - 200 MW/anno", "sector": "Energy"}
            ]
        }
    }

    # Default fallback
    default = {
        "badge": f"{sector} — Eccellenza Industriale",
        "subtitle": f"Leader nel settore {sector_lower}. Qualità, innovazione, affidabilità per clienti globali.",
        "highlights": [
            "Esperienza pluridecennale nel settore",
            "Certificazioni qualità internazionali",
            "Produzione flessibile: dal prototipo alla grande serie",
            "Ufficio tecnico per co-design e ottimizzazione",
            "Export in {{export_count}} paesi",
            "Servizio post-vendita dedicato"
        ],
        "about_1": f"{{company_name}} opera nel settore {sector_lower} dal {{year_founded}} con {{employees}} dipendenti presso la sede di {{location}}. Siamo specializzati nella fornitura di prodotti e servizi ad alto contenuto tecnico per clienti industriali esigenti in Italia e all'estero.",
        "about_2": "La nostra forza risiede nella combinazione di competenze tecniche approfondite, parco macchine moderno e approccio orientato al cliente. Ogni progetto viene seguito da un referente tecnico-commerciale dedicato, dalla richiesta di preventivo alla consegna, garantendo continuità e competenza.",
        "products": [
            {"name": "Prodotto/Servizio Principale", "icon": "🏭", "description": "Descrizione del vostro prodotto/servizio core. Specifiche tecniche, materiali, campi applicativi.", "specs": ["Specifica 1", "Specifica 2", "Specifica 3", "Specifica 4"]},
            {"name": "Lavorazioni Conto Terzi", "icon": "🔧", "description": "Servizi di lavorazione/meccanica/stampaggio/assemblaggio per conto terzi. Flessibilità lotti.", "specs": ["Capacità produttiva", "Tolleranze raggiungibili", "Certificazioni materiale", "Tempi consegna standard"]},
            {"name": "Consulenza Tecnica Progettuale", "icon": "📐", "description": "Supporto in fase di design: DFM, ottimizzazione costi, selezione materiali, simulazione.", "specs": ["Analisi fattibilità", "Simulazione FEM/CFD", "Prototipazione rapida", "Documentazione tecnica"]},
            {"name": "Servizio Post-Vendita & Ricambi", "icon": "🔄", "description": "Assistenza tecnica, ricambi originali, retrofit, manutenzione preventiva/predittiva.", "specs": ["SLA tempi risposta", "Magazzino ricambi", "Tecnici certificati", "Formazione cliente"]}
        ],
        "certifications": ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
        "export_countries": ["Germania", "Francia", "USA", "Spagna", "Polonia"],
        "references": [
            {"name": "Cliente Riferimento 1", "project": "Progetto tipico settore", "sector": sector},
            {"name": "Cliente Riferimento 2", "project": "Progetto tipico settore", "sector": sector},
            {"name": "Cliente Riferimento 3", "project": "Progetto tipico settore", "sector": sector}
        ]
    }

    return sector_configs.get(sector_lower, default)

def generate_landing_page(lead: dict, formspree_id: str = "your-form-id") -> str:
    """Generate complete landing page HTML for a prospect company"""
    sector_data = get_sector_data(lead["sector"])
    slug = lead["slug"]
    domain = lead["domain"]

    # Parse location
    location_parts = lead["location"].replace("(", "").replace(")", "").split()
    address_city = " ".join(location_parts[:-1]) if len(location_parts) > 1 else lead["location"]
    address_province = location_parts[-1] if location_parts else ""
    address_cap = "25000"  # placeholder
    address_street = "Via dell'Industria 1"  # placeholder

    # Prepare template data
    current_year = datetime.now().year
    year_founded = current_year - 25  # estimate

    # Social links for schema
    social_links = []
    if lead.get("linkedin"): social_links.append(lead["linkedin"])
    social_links_json = json.dumps(social_links) if social_links else "[]"

    # Products schema
    products_schema = []
    for i, p in enumerate(sector_data["products"]):
        products_schema.append({
            "@type": "ListItem",
            "position": i+1,
            "item": {
                "@type": "Product",
                "name": p["name"],
                "description": p["description"],
                "brand": {"@type": "Brand", "name": lead["company"]},
                "category": lead["sector"]
            }
        })
    products_schema_json = json.dumps(products_schema)

    # Export count
    export_count = len(sector_data["export_countries"])
    certifications_count = len(sector_data["certifications"])

    template_data = {
        "company_name": lead["company"],
        "domain": domain,
        "slug": slug,
        "sector": lead["sector"],
        "sector_lower": lead["sector"].lower(),
        "employees": lead["employees"],
        "location": lead["location"],
        "revenue_est": lead.get("revenue_est", "N/A"),
        "sector_badge": sector_data["badge"],
        "hero_subtitle": sector_data["subtitle"],
        "year_founded": year_founded,
        "export_count": export_count,
        "certifications_count": certifications_count,
        "highlights": sector_data["highlights"],
        "about_paragraph_1": sector_data["about_1"].format(
            company_name=lead["company"], sector_lower=lead["sector"].lower(),
            year_founded=year_founded, location=lead["location"], employees=lead["employees"]
        ),
        "about_paragraph_2": sector_data["about_2"],
        "products": sector_data["products"],
        "certifications": sector_data["certifications"],
        "export_countries": sector_data["export_countries"],
        "references": sector_data["references"],
        "address_street": address_street,
        "address_city": address_city,
        "address_province": address_province,
        "address_cap": address_cap,
        "phone": f"+39 0{hash(lead['company']) % 1000:03d} {hash(lead['domain']) % 10000000:07d}",  # placeholder
        "email": f"info@{domain}",
        "pec": f"pec@{domain.replace('.', '-')}.pec.it",  # placeholder
        "vat_number": f"0{hash(lead['company']) % 1000000000:09d}",  # placeholder
        "rea_number": f"{address_province}-{hash(lead['domain']) % 1000000:06d}",  # placeholder
        "share_capital": f"{lead['employees'] * 1000:,}".replace(",", "."),
        "privacy_url": f"https://{domain}/privacy",
        "cookie_url": f"https://{domain}/cookie-policy",
        "terms_url": f"https://{domain}/termini",
        "linkedin": f"https://linkedin.com/company/{slug}",
        "youtube": "",
        "formspree_id": formspree_id,
        "canonical_url": f"https://{slug}.zakstudio.com",
        "current_year": current_year,
        "footer_tagline": f"Eccellenza nel {lead['sector'].lower()} dal {year_founded}. Qualità certificata per l'industria globale.",
        "social_links_json": social_links_json,
        "products_schema_json": products_schema_json,
        "CSS_CONTENT": CSS_CONTENT,
        "JS_CONTENT": JS_CONTENT,
        "logo_base64": LOGO_BASE64
    }

    # Render template using Jinja2 (supports loops and conditionals)
    from jinja2 import Template
    template = Template(LANDING_TEMPLATE)
    html = template.render(**template_data)

    return html

def create_landing_directory(lead: dict) -> Path:
    """Create landing page directory structure"""
    slug = lead["slug"]
    landing_dir = PROJECT_DIR / "03-output" / "landings" / slug
    assets_dir = landing_dir / "assets"
    images_dir = assets_dir / "images"

    landing_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(exist_ok=True)
    images_dir.mkdir(exist_ok=True)

    return landing_dir

def write_landing_files(lead: dict, landing_dir: Path, formspree_id: str = "your-form-id"):
    """Write landing page files"""
    html = generate_landing_page(lead, formspree_id)
    (landing_dir / "index.html").write_text(html, encoding="utf-8")

    # Netlify config
    netlify_toml = f"""[build]
  publish = "."
  command = "echo 'Static site - no build'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Cache-Control = "public, max-age=3600"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://formspree.io;"

[[redirects]]
  from = "/privacy"
  to = "https://{lead['domain']}/privacy"
  status = 302
  [[redirects]]
  from = "/cookie-policy"
  to = "https://{lead['domain']}/cookie-policy"
  status = 302
  [[redirects]]
  from = "/termini"
  to = "https://{lead['domain']}/termini"
  status = 302
"""
    (landing_dir / "netlify.toml").write_text(netlify_toml, encoding="utf-8")

    # Deploy manifest
    deploy_manifest = {
        "company": lead["company"],
        "domain": lead["domain"],
        "slug": lead["slug"],
        "sector": lead["sector"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "landing_url": f"https://{lead['slug']}.zakstudio.com",
        "type": "company_presentation_landing",
        "purpose": "Professional digital business card / company presentation",
        "features": ["schema_org", "formspree_form", "multilang_ready", "95_pagespeed_target"],
        "formspree_id": formspree_id,
        "estimated_price_eur": 2500  # to be confirmed with user
    }
    (landing_dir / "deploy.json").write_text(json.dumps(deploy_manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    # README for delivery
    readme = f"""# Landing Page: {lead['company']}

## Consegnato a: {lead['company']} ({lead['domain']})
## Data: {datetime.now().strftime('%Y-%m-%d')}

## URL Live: https://{lead['slug']}.zakstudio.com

## Cosa include questa landing page:
- ✅ Presentazione aziendale professionale (Chi Siamo, Prodotti, Certificazioni, Export, Referenze, Contatti)
- ✅ Schema.org Organization + Product structured data per SEO
- ✅ Form contatti funzionante (Formspree) → email a info@{lead['domain']}
- ✅ PageSpeed 95+ target (statico, zero JS pesante)
- ✅ Mobile-first, responsive, accessibile (WCAG 2.1 AA)
- ✅ Multilingua ready (IT/EN - basta duplicare cartella)
- ✅ Deploy statico su Netlify (subdomain zakstudio.com) o su vostro dominio

## Come usarla:
1. **Link diretto**: Condividete https://{lead['slug']}.zakstudio.com su LinkedIn, email signature, biglietti da visita
2. **Embed iframe**: `<iframe src="https://{lead['slug']}.zakstudio.com" width="100%" height="800" frameborder="0"></iframe>`
3. **Sottodominio vostro**: Chiedete al vostro IT di creare CNAME `presentazione.{lead['domain']}` → `{lead['slug']}.zakstudio.com`
4. **QR Code**: Generate QR per biglietti da visita / brochure → punta a https://{lead['slug']}.zakstudio.com

## Form contatti:
- Invii a: info@{lead['domain']} (configurato in Formspree)
- Campi: Nome, Azienda, Email, Telefono, Messaggio, Prodotto di interesse
- GDPR compliant: link privacy policy in footer

## Manutenzione:
- **ZERO manutenzione richiesta** - sito statico, no CMS, no database, no aggiornamenti sicurezza
- Modifiche contenuti: richiedere a ZAK Studio Web (servizio separato) o modificare HTML direttamente
- Scadenza hosting: inclusa per 12 mesi, poi rinnovo € 50/anno se su subdomain zakstudio.com

## Fatturazione:
- Prezzo concordato: € {{landing_price}} + IVA
- Pagamento: Bonifico su IBAN comunicato nel preventivo
- Fattura elettronica: emessa alla ricezione pagamento da ZAK Studio Web (Libero Professionista)

---
Generato automaticamente da ZAK Studio Web Pipeline — Step 6
Progetto: ZAK Studio Web Cold Outreach Automation
"""
    (landing_dir / "README_CONSEGNA.md").write_text(readme, encoding="utf-8")

def deploy_to_netlify(landing_dir: Path, slug: str) -> dict:
    """Deploy landing page to Netlify"""
    site_name = slug  # e.g., nrcm-it.zakstudio.com

    try:
        result = subprocess.run(
            ["netlify", "deploy", "--dir", str(landing_dir), "--site", site_name, "--prod", "--json"],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "NETLIFY_AUTH_TOKEN": NETLIFY_AUTH_TOKEN}
        )

        if result.returncode == 0:
            deploy_data = json.loads(result.stdout)
            return {
                "success": True,
                "url": deploy_data.get("url", f"https://{site_name}.netlify.app"),
                "deploy_id": deploy_data.get("id", ""),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            print(f"  Netlify deploy failed: {result.stderr[:200]}")
            return {
                "success": False,
                "error": result.stderr[:500],
                "url": f"https://{site_name}.netlify.app"
            }
    except FileNotFoundError:
        print("  Netlify CLI not found, skipping deploy")
        return {
            "success": False,
            "error": "Netlify CLI not installed",
            "url": f"https://{slug}.netlify.app"
        }
    except Exception as e:
        print(f"  Deploy error: {e}")
        return {
            "success": False,
            "error": str(e),
            "url": f"https://{slug}.netlify.app"
        }

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate prospect company landing page")
    parser.add_argument("--lead-slug", required=True, help="Lead slug from leads_enriched.json")
    parser.add_argument("--formspree-id", default="your-form-id", help="Formspree form ID for contact form")
    parser.add_argument("--deploy", action="store_true", help="Deploy to Netlify after generation")
    parser.add_argument("--all-interested", action="store_true", help="Generate for all leads with 'interested' status")
    args = parser.parse_args()

    print("="*60)
    print("STEP 6: PROSPECT COMPANY LANDING PAGE GENERATOR")
    print("="*60)

    # Load leads
    leads_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(leads_path, "r", encoding="utf-8") as f:
        leads = json.load(f)

    # Load lead states to find interested ones
    states_path = PROJECT_DIR / "02-data" / "lead_states.json"
    interested_slugs = set()
    if states_path.exists():
        with open(states_path, "r", encoding="utf-8") as f:
            states = json.load(f)
        for slug, state in states.items():
            if state.get("last_classification") == "interested":
                interested_slugs.add(slug)

    if args.all_interested:
        target_slugs = interested_slugs
        print(f"Generating landings for {len(target_slugs)} interested leads...")
    elif args.lead_slug:
        target_slugs = {args.lead_slug}
        if args.lead_slug not in interested_slugs:
            print(f"[WARN] Lead {args.lead_slug} not marked as 'interested' - generating anyway")
    else:
        print("Error: specify --lead-slug OR --all-interested")
        return

    for slug in target_slugs:
        lead = next((l for l in leads if l["slug"] == slug), None)
        if not lead:
            print(f"[FAIL] Lead not found: {slug}")
            continue

        print(f"\n{'='*60}")
        print(f"Generating landing for: {lead['company']} ({slug})")
        print(f"Sector: {lead['sector']} | Employees: {lead['employees']}")
        print(f"{'='*60}")

        try:
            # Create directory
            landing_dir = create_landing_directory(lead)

            # Write files
            write_landing_files(lead, landing_dir, args.formspree_id)
            print(f"  [OK] Files written to {landing_dir}")

            # Deploy if requested
            if args.deploy:
                print(f"  [DEPLOY] Deploying to Netlify...")
                deploy_result = deploy_to_netlify(landing_dir, slug)
                if deploy_result["success"]:
                    print(f"  [OK] Deployed: {deploy_result['url']}")
                else:
                    print(f"  [WARN] Deploy failed: {deploy_result.get('error')}")
                    print(f"  Expected URL: {deploy_result['url']}")

            print(f"  [README] {landing_dir / 'README_CONSEGNA.md'}")

        except Exception as e:
            print(f"  [FAIL] ERROR: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print("STEP 6 COMPLETATO")
    print("="*60)

if __name__ == "__main__":
    main()