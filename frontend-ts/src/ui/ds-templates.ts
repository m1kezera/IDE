/**
 * Design Studio — Template Gallery
 * Pre-built page templates that users can apply with one click.
 */

export interface DSTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  /** Element definitions to insert into the artboard */
  elements: { componentId: string; props: Record<string, string> }[];
}

// ─── Template Definitions ───────────────────────────────────────────

export const TEMPLATES: DSTemplate[] = [
  {
    id: 'landing-hero', name: 'Landing Page — Hero', category: 'Landing Page', icon: '🚀',
    description: 'Bold hero section with CTA button and gradient background',
    elements: [
      { componentId: 'nav-bar', props: {} },
      { componentId: 'hero-split', props: {} },
      { componentId: 'feature-grid', props: {} },
      { componentId: 'image-banner', props: { title: 'Powerful Features', subtitle: 'Everything you need to build amazing products.', imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80' } },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'landing-saas', name: 'SaaS Product', category: 'Landing Page', icon: '💼',
    description: 'Professional SaaS landing with pricing and features',
    elements: [
      { componentId: 'nav-bar', props: {} },
      { componentId: 'hero-centered', props: { headline: 'The Platform for Modern Teams', subheadline: 'Streamline your workflow with our all-in-one solution.' } },
      { componentId: 'logo-cloud', props: {} },
      { componentId: 'feature-grid', props: {} },
      { componentId: 'pricing-table', props: {} },
      { componentId: 'cta-section', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio', category: 'Portfolio', icon: '🎨',
    description: 'Creative portfolio with image gallery and split hero',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Portfolio' } },
      { componentId: 'hero-split', props: {} },
      { componentId: 'image-gallery', props: {} },
      { componentId: 'testimonial-card', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'blog-layout', name: 'Blog Post', category: 'Blog', icon: '📝',
    description: 'Clean blog layout with hero image and content sections',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Blog' } },
      { componentId: 'image-banner', props: { title: 'How to Build Amazing Websites', subtitle: 'A comprehensive guide to modern web development', ratio: '21/9' } },
      { componentId: 'text-block', props: {} },
      { componentId: 'blockquote', props: {} },
      { componentId: 'text-block', props: { text: 'Continue reading the rest of the article here. Add more content sections as needed.' } },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'e-commerce', name: 'E-Commerce', category: 'E-Commerce', icon: '🛒',
    description: 'Product showcase with cards and pricing',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Shop' } },
      { componentId: 'hero-centered', props: { headline: 'New Collection', subheadline: 'Discover our latest arrivals' } },
      { componentId: 'carousel', props: {} },
      { componentId: 'feature-grid', props: {} },
      { componentId: 'stats-bar', props: {} },
      { componentId: 'cta-section', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'dashboard', name: 'Dashboard', category: 'Dashboard', icon: '📊',
    description: 'Analytics dashboard with stats and data display',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Dashboard' } },
      { componentId: 'stats-bar', props: {} },
      { componentId: 'data-table', props: {} },
      { componentId: 'progress-bar', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'coming-soon', name: 'Coming Soon', category: 'Landing Page', icon: '⏰',
    description: 'Minimalist coming soon page with countdown',
    elements: [
      { componentId: 'hero-centered', props: { headline: 'Coming Soon', subheadline: 'We are working on something amazing. Stay tuned!' } },
      { componentId: 'countdown-timer', props: {} },
      { componentId: 'login-form', props: {} },
    ],
  },
  {
    id: 'about-page', name: 'About Us', category: 'Landing Page', icon: '👥',
    description: 'Company about page with team and mission',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Company' } },
      { componentId: 'hero-centered', props: { headline: 'About Us', subheadline: 'We are a team of passionate developers building the future.' } },
      { componentId: 'feature-grid', props: {} },
      { componentId: 'testimonial-card', props: {} },
      { componentId: 'stats-bar', props: {} },
      { componentId: 'cta-section', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'pricing-page', name: 'Pricing Page', category: 'SaaS', icon: '💰',
    description: 'Dedicated pricing page with comparison table',
    elements: [
      { componentId: 'nav-bar', props: {} },
      { componentId: 'hero-centered', props: { headline: 'Simple, Transparent Pricing', subheadline: 'Choose the plan that works for you.' } },
      { componentId: 'pricing-table', props: {} },
      { componentId: 'accordion', props: {} },
      { componentId: 'cta-section', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'contact-page', name: 'Contact Page', category: 'Landing Page', icon: '📧',
    description: 'Contact page with form and info',
    elements: [
      { componentId: 'nav-bar', props: {} },
      { componentId: 'hero-centered', props: { headline: 'Get in Touch', subheadline: 'We would love to hear from you.' } },
      { componentId: 'login-form', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'gallery-page', name: 'Photo Gallery', category: 'Portfolio', icon: '📸',
    description: 'Full photo gallery with masonry layout',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Gallery' } },
      { componentId: 'image-banner', props: { title: 'Photo Gallery', subtitle: 'A collection of beautiful moments' } },
      { componentId: 'image-gallery', props: {} },
      { componentId: 'image-gallery', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
  {
    id: 'docs-page', name: 'Documentation', category: 'SaaS', icon: '📖',
    description: 'Clean documentation page layout',
    elements: [
      { componentId: 'nav-bar', props: { brand: 'Docs' } },
      { componentId: 'breadcrumb', props: {} },
      { componentId: 'text-block', props: { text: '# Getting Started\n\nWelcome to the documentation. This guide will help you get started quickly.' } },
      { componentId: 'accordion', props: {} },
      { componentId: 'footer', props: {} },
    ],
  },
];

// ─── Template Modal Renderer ────────────────────────────────────────

export function renderTemplateModal(onSelect: (template: DSTemplate) => void, onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);';

  const content = document.createElement('div');
  content.style.cssText = 'background:#1e1e2e;border:1px solid #313244;border-radius:16px;width:90%;max-width:900px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.5);';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'padding:20px 24px;border-bottom:1px solid #313244;display:flex;align-items:center;justify-content:space-between;';
  header.innerHTML = `<div><h2 style="margin:0;font-size:18px;color:#cdd6f4;font-weight:700;">📚 Template Gallery</h2><p style="margin:4px 0 0;font-size:12px;color:#585b70;">Choose a template to get started quickly</p></div>`;
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background:none;border:none;color:#585b70;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:4px;';
  closeBtn.addEventListener('click', onClose);
  header.appendChild(closeBtn);
  content.appendChild(header);

  // Category filter
  const categories = [...new Set(TEMPLATES.map(t => t.category))];
  const filterRow = document.createElement('div');
  filterRow.style.cssText = 'padding:12px 24px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #313244;';
  let activeCategory = 'all';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'ds-template-filter-btn active';
  allBtn.style.cssText = 'padding:4px 12px;border-radius:20px;border:1px solid #7c3aed;background:rgba(124,58,237,0.15);color:#7c3aed;font-size:11px;cursor:pointer;';
  allBtn.addEventListener('click', () => { activeCategory = 'all'; renderGrid(); updateFilterBtns(); });
  filterRow.appendChild(allBtn);

  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'ds-template-filter-btn';
    btn.style.cssText = 'padding:4px 12px;border-radius:20px;border:1px solid #313244;background:transparent;color:#585b70;font-size:11px;cursor:pointer;';
    btn.addEventListener('click', () => { activeCategory = cat; renderGrid(); updateFilterBtns(); });
    filterRow.appendChild(btn);
  }
  content.appendChild(filterRow);

  function updateFilterBtns() {
    filterRow.querySelectorAll('button').forEach(b => {
      const isActive = (b.textContent === 'All' && activeCategory === 'all') || b.textContent === activeCategory;
      (b as HTMLElement).style.borderColor = isActive ? '#7c3aed' : '#313244';
      (b as HTMLElement).style.background = isActive ? 'rgba(124,58,237,0.15)' : 'transparent';
      (b as HTMLElement).style.color = isActive ? '#7c3aed' : '#585b70';
    });
  }

  // Grid
  const grid = document.createElement('div');
  grid.style.cssText = 'padding:20px 24px;overflow-y:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;';
  content.appendChild(grid);

  function renderGrid() {
    grid.innerHTML = '';
    const filtered = activeCategory === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCategory);
    for (const tmpl of filtered) {
      const card = document.createElement('div');
      card.style.cssText = 'background:#11111b;border:1px solid #313244;border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.2s;';
      card.innerHTML = `
        <div style="height:100px;background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;align-items:center;justify-content:center;font-size:36px;">${tmpl.icon}</div>
        <div style="padding:12px;">
          <div style="font-size:13px;font-weight:600;color:#cdd6f4;">${tmpl.name}</div>
          <div style="font-size:11px;color:#585b70;margin-top:4px;line-height:1.4;">${tmpl.description}</div>
          <div style="font-size:10px;color:#7c3aed;margin-top:6px;">${tmpl.elements.length} components</div>
        </div>`;
      card.addEventListener('mouseenter', () => { card.style.borderColor = '#7c3aed'; card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 8px 24px rgba(124,58,237,0.2)'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = '#313244'; card.style.transform = ''; card.style.boxShadow = ''; });
      card.addEventListener('click', () => { onSelect(tmpl); onClose(); });
      grid.appendChild(card);
    }
  }
  renderGrid();

  // Close on backdrop click
  modal.addEventListener('click', (e) => { if (e.target === modal) onClose(); });

  modal.appendChild(content);
  return modal;
}
