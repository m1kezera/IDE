/**
 * Lumina Design Studio — Component Library v3.0
 * 40+ professional components inspired by Google Stitch, Figma, Framer.
 * Categories: sections, navigation, content, data, form, media, interactive, effects
 */

export interface ComponentDef {
  id: string;
  name: string;
  icon: string;
  category: 'sections' | 'navigation' | 'content' | 'data' | 'form' | 'media' | 'interactive' | 'effects';
  html: string;
  defaultProps: Record<string, string>;
}

export const COMPONENTS: ComponentDef[] = [

  // ═══════════════════════════════════════════════════════════════
  //  SECTIONS — Full-width page blocks
  // ═══════════════════════════════════════════════════════════════

  { id: 'hero-gradient', name: 'Hero Gradient', icon: '🌄', category: 'sections',
    html: `<section style="background:linear-gradient({{angle}},{{bg1}},{{bg2}},{{bg3}});padding:{{padding}};text-align:center;border-radius:16px;position:relative;overflow:hidden;">
  <div style="position:relative;z-index:1;">
    <span style="display:inline-block;padding:6px 16px;background:rgba(255,255,255,0.1);border-radius:20px;font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:16px;backdrop-filter:blur(8px);">{{badge}}</span>
    <h1 style="font-size:{{titleSize}};color:#fff;margin:0 0 16px;font-weight:800;letter-spacing:-0.03em;line-height:1.1;">{{title}}</h1>
    <p style="font-size:18px;color:rgba(255,255,255,0.7);max-width:560px;margin:0 auto 32px;line-height:1.6;">{{subtitle}}</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <a href="#" style="padding:14px 36px;background:#fff;color:{{bg1}};border-radius:{{btnRadius}};text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,0.15);">{{btnPrimary}}</a>
      <a href="#" style="padding:14px 36px;background:rgba(255,255,255,0.1);color:#fff;border-radius:{{btnRadius}};text-decoration:none;font-weight:600;font-size:15px;border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(4px);">{{btnSecondary}}</a>
    </div>
  </div>
</section>`,
    defaultProps: { title: 'Build Something\nAmazing', subtitle: 'The modern platform for creating stunning web experiences with zero friction.', badge: '✨ Now in Public Beta', btnPrimary: 'Get Started Free', btnSecondary: 'Watch Demo', bg1: '#7c3aed', bg2: '#4f46e5', bg3: '#0ea5e9', angle: '135deg', padding: '80px 32px', titleSize: '52px', btnRadius: '12px' } },

  { id: 'hero-split', name: 'Hero Split', icon: '◧', category: 'sections',
    html: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:{{gap}};padding:{{padding}};align-items:center;background:{{bg}};border-radius:16px;">
  <div>
    <span style="display:inline-block;padding:5px 14px;background:{{accentBg}};color:{{accent}};border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">{{badge}}</span>
    <h1 style="font-size:{{titleSize}};color:{{titleColor}};margin:0 0 16px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;">{{title}}</h1>
    <p style="font-size:16px;color:{{textColor}};line-height:1.7;margin:0 0 28px;max-width:480px;">{{desc}}</p>
    <div style="display:flex;gap:12px;align-items:center;">
      <a href="#" style="padding:12px 28px;background:{{accent}};color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">{{btnText}}</a>
      <a href="#" style="color:{{accent}};text-decoration:none;font-size:14px;font-weight:500;display:flex;align-items:center;gap:4px;">{{linkText}} →</a>
    </div>
  </div>
  <div style="border-radius:12px;aspect-ratio:4/3;overflow:hidden;border:1px solid {{border}};background:{{imgBg}};display:flex;align-items:center;justify-content:center;">
    <img src="{{imgSrc}}" alt="Hero Image" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;color:#585b70;flex-direction:column;gap:8px;\'><span>🖼️</span><span style=\'font-size:12px;\'>Click Upload in Properties</span></div>'"/>
  </div>
</section>`,
    defaultProps: { title: 'Design faster with AI-powered tools', desc: 'Create professional interfaces in minutes. Our intelligent design system understands your brand and builds pixel-perfect layouts.', badge: 'New Release', btnText: 'Start Building', linkText: 'Learn more', bg: '#0d0d15', imgBg: '#1e1e2e', imgSrc: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.12)', titleColor: '#f5f5f5', textColor: '#a6adc8', border: '#313244', gap: '48px', padding: '48px', titleSize: '44px' } },

  { id: 'features-grid', name: 'Features Grid', icon: '🔥', category: 'sections',
    html: `<section style="padding:{{padding}};text-align:center;">
  <h2 style="font-size:36px;font-weight:800;color:{{titleColor}};margin:0 0 8px;letter-spacing:-0.02em;">{{title}}</h2>
  <p style="font-size:16px;color:{{subtitleColor}};margin:0 auto 40px;max-width:500px;">{{subtitle}}</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:{{gap}};">
    <div style="background:{{cardBg}};padding:24px;border-radius:14px;text-align:left;border:1px solid {{border}};"><div style="width:44px;height:44px;background:{{icon1Bg}};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;">{{icon1}}</div><h3 style="font-size:16px;color:{{titleColor}};margin:0 0 8px;font-weight:600;">{{feat1}}</h3><p style="font-size:13px;color:{{subtitleColor}};margin:0;line-height:1.6;">{{desc1}}</p></div>
    <div style="background:{{cardBg}};padding:24px;border-radius:14px;text-align:left;border:1px solid {{border}};"><div style="width:44px;height:44px;background:{{icon2Bg}};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;">{{icon2}}</div><h3 style="font-size:16px;color:{{titleColor}};margin:0 0 8px;font-weight:600;">{{feat2}}</h3><p style="font-size:13px;color:{{subtitleColor}};margin:0;line-height:1.6;">{{desc2}}</p></div>
    <div style="background:{{cardBg}};padding:24px;border-radius:14px;text-align:left;border:1px solid {{border}};"><div style="width:44px;height:44px;background:{{icon3Bg}};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;">{{icon3}}</div><h3 style="font-size:16px;color:{{titleColor}};margin:0 0 8px;font-weight:600;">{{feat3}}</h3><p style="font-size:13px;color:{{subtitleColor}};margin:0;line-height:1.6;">{{desc3}}</p></div>
  </div>
</section>`,
    defaultProps: { title: 'Why choose us', subtitle: 'Everything you need to build modern apps', icon1: '⚡', icon1Bg: 'rgba(250,204,21,0.12)', feat1: 'Lightning Fast', desc1: 'Sub-second load times with optimized rendering.', icon2: '🔒', icon2Bg: 'rgba(34,197,94,0.12)', feat2: 'Secure by Default', desc2: 'Enterprise-grade security built into every layer.', icon3: '🎨', icon3Bg: 'rgba(124,58,237,0.12)', feat3: 'Beautiful Design', desc3: 'Pixel-perfect components that look stunning.', cardBg: '#1e1e2e', border: '#313244', gap: '16px', padding: '48px 24px', titleColor: '#f5f5f5', subtitleColor: '#a6adc8' } },

  { id: 'cta-banner', name: 'CTA Banner', icon: '📢', category: 'sections',
    html: `<section style="background:{{bg}};border:1px solid {{border}};border-radius:16px;padding:{{padding}};display:flex;align-items:center;justify-content:space-between;gap:24px;">
  <div>
    <h2 style="font-size:24px;color:{{titleColor}};margin:0 0 8px;font-weight:700;">{{title}}</h2>
    <p style="font-size:14px;color:{{textColor}};margin:0;">{{desc}}</p>
  </div>
  <a href="#" style="padding:12px 32px;background:{{btnBg}};color:{{btnColor}};border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;white-space:nowrap;flex-shrink:0;">{{btnText}}</a>
</section>`,
    defaultProps: { title: 'Ready to get started?', desc: 'Join thousands of creators building with us.', btnText: 'Start Free Trial', bg: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.1))', border: 'rgba(124,58,237,0.2)', titleColor: '#f5f5f5', textColor: '#a6adc8', btnBg: '#7c3aed', btnColor: '#fff', padding: '40px' } },

  { id: 'testimonials', name: 'Testimonials', icon: '💬', category: 'sections',
    html: `<section style="padding:{{padding}};text-align:center;">
  <h2 style="font-size:28px;font-weight:700;color:{{titleColor}};margin:0 0 32px;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    <div style="background:{{cardBg}};padding:24px;border-radius:12px;text-align:left;border:1px solid {{border}};">
      <div style="display:flex;gap:4px;color:#facc15;margin-bottom:12px;">★★★★★</div>
      <p style="font-size:14px;color:{{textColor}};line-height:1.6;margin:0 0 16px;">"{{quote1}}"</p>
      <div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:{{avatar1Bg}};display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;">{{avatar1}}</div><div><div style="font-size:13px;font-weight:600;color:{{titleColor}};">{{name1}}</div><div style="font-size:11px;color:{{mutedColor}};">{{role1}}</div></div></div>
    </div>
    <div style="background:{{cardBg}};padding:24px;border-radius:12px;text-align:left;border:1px solid {{border}};">
      <div style="display:flex;gap:4px;color:#facc15;margin-bottom:12px;">★★★★★</div>
      <p style="font-size:14px;color:{{textColor}};line-height:1.6;margin:0 0 16px;">"{{quote2}}"</p>
      <div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:{{avatar2Bg}};display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;">{{avatar2}}</div><div><div style="font-size:13px;font-weight:600;color:{{titleColor}};">{{name2}}</div><div style="font-size:11px;color:{{mutedColor}};">{{role2}}</div></div></div>
    </div>
    <div style="background:{{cardBg}};padding:24px;border-radius:12px;text-align:left;border:1px solid {{border}};">
      <div style="display:flex;gap:4px;color:#facc15;margin-bottom:12px;">★★★★★</div>
      <p style="font-size:14px;color:{{textColor}};line-height:1.6;margin:0 0 16px;">"{{quote3}}"</p>
      <div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:{{avatar3Bg}};display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;">{{avatar3}}</div><div><div style="font-size:13px;font-weight:600;color:{{titleColor}};">{{name3}}</div><div style="font-size:11px;color:{{mutedColor}};">{{role3}}</div></div></div>
    </div>
  </div>
</section>`,
    defaultProps: { title: 'What our users say', quote1: 'Absolutely transformed our workflow. 10x faster.', name1: 'Sarah Chen', role1: 'CTO, TechFlow', avatar1: 'SC', avatar1Bg: '#7c3aed', quote2: 'The best design tool I have ever used.', name2: 'Marcus Rivera', role2: 'Lead Designer, Studio', avatar2: 'MR', avatar2Bg: '#0ea5e9', quote3: 'Our conversion rate doubled after redesign.', name3: 'Aiko Tanaka', role3: 'PM, DigitalCo', avatar3: 'AT', avatar3Bg: '#f43f5e', cardBg: '#1e1e2e', border: '#313244', padding: '48px 24px', titleColor: '#f5f5f5', textColor: '#a6adc8', mutedColor: '#585b70' } },

  { id: 'pricing', name: 'Pricing Table', icon: '💰', category: 'sections',
    html: `<section style="padding:{{padding}};text-align:center;">
  <h2 style="font-size:32px;font-weight:800;color:{{titleColor}};margin:0 0 8px;">{{title}}</h2>
  <p style="font-size:15px;color:{{subtitleColor}};margin:0 0 36px;">{{subtitle}}</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:900px;margin:0 auto;">
    <div style="background:{{cardBg}};padding:28px;border-radius:14px;border:1px solid {{border}};text-align:left;">
      <h3 style="font-size:18px;color:{{titleColor}};margin:0 0 4px;">{{plan1Name}}</h3>
      <p style="font-size:12px;color:{{subtitleColor}};margin:0 0 16px;">{{plan1Desc}}</p>
      <div style="font-size:36px;font-weight:800;color:{{titleColor}};margin:0 0 20px;">{{plan1Price}}<span style="font-size:14px;font-weight:400;color:{{subtitleColor}};">/mo</span></div>
      <a href="#" style="display:block;text-align:center;padding:10px;border:1px solid {{border}};border-radius:8px;color:{{titleColor}};text-decoration:none;font-weight:600;font-size:13px;">Get Started</a>
    </div>
    <div style="background:{{accentBg}};padding:28px;border-radius:14px;border:2px solid {{accent}};text-align:left;position:relative;">
      <span style="position:absolute;top:-10px;right:16px;padding:3px 12px;background:{{accent}};color:#fff;border-radius:12px;font-size:10px;font-weight:700;">POPULAR</span>
      <h3 style="font-size:18px;color:{{titleColor}};margin:0 0 4px;">{{plan2Name}}</h3>
      <p style="font-size:12px;color:{{subtitleColor}};margin:0 0 16px;">{{plan2Desc}}</p>
      <div style="font-size:36px;font-weight:800;color:{{titleColor}};margin:0 0 20px;">{{plan2Price}}<span style="font-size:14px;font-weight:400;color:{{subtitleColor}};">/mo</span></div>
      <a href="#" style="display:block;text-align:center;padding:10px;background:{{accent}};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Get Started</a>
    </div>
    <div style="background:{{cardBg}};padding:28px;border-radius:14px;border:1px solid {{border}};text-align:left;">
      <h3 style="font-size:18px;color:{{titleColor}};margin:0 0 4px;">{{plan3Name}}</h3>
      <p style="font-size:12px;color:{{subtitleColor}};margin:0 0 16px;">{{plan3Desc}}</p>
      <div style="font-size:36px;font-weight:800;color:{{titleColor}};margin:0 0 20px;">{{plan3Price}}<span style="font-size:14px;font-weight:400;color:{{subtitleColor}};">/mo</span></div>
      <a href="#" style="display:block;text-align:center;padding:10px;border:1px solid {{border}};border-radius:8px;color:{{titleColor}};text-decoration:none;font-weight:600;font-size:13px;">Contact Sales</a>
    </div>
  </div>
</section>`,
    defaultProps: { title: 'Simple Pricing', subtitle: 'No hidden fees. Cancel anytime.', plan1Name: 'Starter', plan1Desc: 'For individuals', plan1Price: '$9', plan2Name: 'Pro', plan2Desc: 'For teams', plan2Price: '$29', plan3Name: 'Enterprise', plan3Desc: 'Custom solutions', plan3Price: '$99', accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.06)', cardBg: '#1e1e2e', border: '#313244', padding: '48px 24px', titleColor: '#f5f5f5', subtitleColor: '#a6adc8' } },

  { id: 'faq', name: 'FAQ Section', icon: '❓', category: 'sections',
    html: `<section style="padding:{{padding}};max-width:700px;margin:0 auto;">
  <h2 style="font-size:28px;font-weight:700;color:{{titleColor}};margin:0 0 32px;text-align:center;">{{title}}</h2>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <details style="background:{{cardBg}};border:1px solid {{border}};border-radius:10px;padding:16px 20px;"><summary style="font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;">{{q1}}</summary><p style="font-size:13px;color:{{textColor}};line-height:1.6;margin:12px 0 0;">{{a1}}</p></details>
    <details style="background:{{cardBg}};border:1px solid {{border}};border-radius:10px;padding:16px 20px;"><summary style="font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;">{{q2}}</summary><p style="font-size:13px;color:{{textColor}};line-height:1.6;margin:12px 0 0;">{{a2}}</p></details>
    <details style="background:{{cardBg}};border:1px solid {{border}};border-radius:10px;padding:16px 20px;"><summary style="font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;">{{q3}}</summary><p style="font-size:13px;color:{{textColor}};line-height:1.6;margin:12px 0 0;">{{a3}}</p></details>
  </div>
</section>`,
    defaultProps: { title: 'Frequently Asked Questions', q1: 'How do I get started?', a1: 'Simply sign up for a free account and start building immediately.', q2: 'Can I cancel anytime?', a2: 'Yes, you can cancel your subscription at any time. No questions asked.', q3: 'Do you offer support?', a3: 'We offer 24/7 support via chat, email, and phone for all plans.', cardBg: '#1e1e2e', border: '#313244', padding: '48px 24px', titleColor: '#f5f5f5', textColor: '#a6adc8' } },

  // ═══════════════════════════════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  { id: 'navbar-pro', name: 'Navbar Pro', icon: '🧭', category: 'navigation',
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:{{padding}};background:{{bg}};border-radius:12px;border:1px solid {{border}};backdrop-filter:blur(12px);">
  <div style="display:flex;align-items:center;gap:8px;"><span style="font-size:20px;">{{logoIcon}}</span><span style="font-weight:800;font-size:17px;color:{{brandColor}};letter-spacing:-0.02em;">{{brand}}</span></div>
  <div style="display:flex;gap:28px;"><a href="#" style="color:{{linkColor}};text-decoration:none;font-size:13px;font-weight:500;">Features</a><a href="#" style="color:{{linkColor}};text-decoration:none;font-size:13px;font-weight:500;">Pricing</a><a href="#" style="color:{{linkColor}};text-decoration:none;font-size:13px;font-weight:500;">Docs</a><a href="#" style="color:{{linkColor}};text-decoration:none;font-size:13px;font-weight:500;">Blog</a></div>
  <div style="display:flex;gap:8px;"><a href="#" style="padding:8px 16px;color:{{linkColor}};text-decoration:none;font-size:13px;font-weight:500;">Sign In</a><a href="#" style="padding:8px 20px;background:{{accent}};color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">{{ctaText}}</a></div>
</nav>`,
    defaultProps: { brand: 'Lumina', logoIcon: '✦', ctaText: 'Get Started', bg: 'rgba(17,17,27,0.85)', accent: '#7c3aed', brandColor: '#f5f5f5', linkColor: '#a6adc8', border: 'rgba(49,50,68,0.6)', padding: '10px 20px' } },

  { id: 'breadcrumb', name: 'Breadcrumb', icon: '📍', category: 'navigation',
    html: `<nav style="display:flex;align-items:center;gap:8px;padding:{{padding}};font-size:13px;">
  <a href="#" style="color:{{mutedColor}};text-decoration:none;">Home</a>
  <span style="color:{{mutedColor}};">›</span>
  <a href="#" style="color:{{mutedColor}};text-decoration:none;">{{parent}}</a>
  <span style="color:{{mutedColor}};">›</span>
  <span style="color:{{activeColor}};font-weight:500;">{{current}}</span>
</nav>`,
    defaultProps: { parent: 'Products', current: 'Design Studio', padding: '8px 0', mutedColor: '#585b70', activeColor: '#cdd6f4' } },

  { id: 'tabs', name: 'Tab Bar', icon: '📑', category: 'navigation',
    html: `<div style="display:flex;border-bottom:1px solid {{border}};gap:0;">
  <button style="padding:{{padding}};background:none;border:none;border-bottom:2px solid {{accent}};color:{{activeColor}};font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">{{tab1}}</button>
  <button style="padding:{{padding}};background:none;border:none;border-bottom:2px solid transparent;color:{{mutedColor}};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">{{tab2}}</button>
  <button style="padding:{{padding}};background:none;border:none;border-bottom:2px solid transparent;color:{{mutedColor}};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">{{tab3}}</button>
</div>`,
    defaultProps: { tab1: 'Overview', tab2: 'Features', tab3: 'API', accent: '#7c3aed', activeColor: '#cdd6f4', mutedColor: '#585b70', border: '#313244', padding: '10px 20px' } },

  { id: 'sidebar-nav', name: 'Sidebar Nav', icon: '📋', category: 'navigation',
    html: `<nav style="width:{{width}};background:{{bg}};border-right:1px solid {{border}};padding:16px 0;border-radius:12px;">
  <div style="padding:0 16px 16px;"><span style="font-size:16px;font-weight:700;color:{{titleColor}};">{{brand}}</span></div>
  <div style="padding:2px 8px;"><span style="font-size:9px;color:{{mutedColor}};text-transform:uppercase;letter-spacing:1.5px;padding:0 8px;">Main</span></div>
  <a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:{{activeColor}};background:rgba(124,58,237,0.1);border-left:2px solid {{accent}};text-decoration:none;font-size:13px;font-weight:500;">🏠 Dashboard</a>
  <a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:{{mutedColor}};text-decoration:none;font-size:13px;border-left:2px solid transparent;">📊 Analytics</a>
  <a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:{{mutedColor}};text-decoration:none;font-size:13px;border-left:2px solid transparent;">👥 Users</a>
  <a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:{{mutedColor}};text-decoration:none;font-size:13px;border-left:2px solid transparent;">⚙️ Settings</a>
</nav>`,
    defaultProps: { brand: 'Dashboard', width: '220px', bg: '#11111b', border: '#1e1e2e', accent: '#7c3aed', titleColor: '#f5f5f5', activeColor: '#b4befe', mutedColor: '#585b70' } },

  // ═══════════════════════════════════════════════════════════════
  //  CONTENT — Basic building blocks
  // ═══════════════════════════════════════════════════════════════

  { id: 'heading', name: 'Heading', icon: 'H', category: 'content',
    html: `<h2 style="font-size:{{fontSize}};color:{{color}};font-weight:{{weight}};margin:0;letter-spacing:-0.02em;line-height:1.2;">{{text}}</h2>`,
    defaultProps: { text: 'Section Heading', fontSize: '32px', color: '#f5f5f5', weight: '700' } },

  { id: 'paragraph', name: 'Paragraph', icon: '¶', category: 'content',
    html: `<p style="font-size:{{fontSize}};line-height:{{lineHeight}};color:{{color}};max-width:{{maxWidth}};margin:0;">{{text}}</p>`,
    defaultProps: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.', fontSize: '15px', lineHeight: '1.7', color: '#a6adc8', maxWidth: '640px' } },

  { id: 'card', name: 'Card', icon: '🃏', category: 'content',
    html: `<div style="background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};padding:{{padding}};max-width:{{maxWidth}};transition:all 0.2s;">
  <h3 style="margin:0 0 8px;color:{{headColor}};font-size:17px;font-weight:600;">{{title}}</h3>
  <p style="margin:0 0 16px;color:{{textColor}};font-size:14px;line-height:1.6;">{{desc}}</p>
  <a href="#" style="color:{{linkColor}};font-size:13px;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:4px;">{{linkText}} →</a>
</div>`,
    defaultProps: { title: 'Beautiful Card', desc: 'A polished card component with hover effects.', linkText: 'Learn more', bg: '#1e1e2e', border: '#313244', radius: '14px', padding: '24px', maxWidth: '380px', headColor: '#f5f5f5', textColor: '#a6adc8', linkColor: '#7c3aed' } },

  { id: 'image-card', name: 'Image Card', icon: '🖼️', category: 'content',
    html: `<div style="background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};overflow:hidden;max-width:{{maxWidth}};">
  <div style="aspect-ratio:16/9;overflow:hidden;background:{{imgBg}};">
    <img src="{{imgSrc}}" alt="Card Image" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;opacity:0.5;\'>📸</div>'"/>
  </div>
  <div style="padding:20px;">
    <span style="display:inline-block;padding:3px 10px;background:{{tagBg}};color:{{tagColor}};border-radius:12px;font-size:10px;font-weight:600;text-transform:uppercase;margin-bottom:10px;">{{tag}}</span>
    <h3 style="margin:0 0 6px;color:{{headColor}};font-size:16px;font-weight:600;">{{title}}</h3>
    <p style="margin:0;color:{{textColor}};font-size:13px;line-height:1.5;">{{desc}}</p>
  </div>
</div>`,
    defaultProps: { title: 'Featured Article', desc: 'Discover the latest in design innovation.', tag: 'Design', imgSrc: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', imgBg: 'linear-gradient(135deg,#1a1a2e,#2d1b69)', bg: '#1e1e2e', border: '#313244', radius: '14px', maxWidth: '340px', headColor: '#f5f5f5', textColor: '#a6adc8', tagBg: 'rgba(124,58,237,0.12)', tagColor: '#b4befe' } },

  { id: 'button', name: 'Button', icon: '🔘', category: 'content',
    html: `<button style="padding:{{padding}};background:{{bg}};color:{{color}};border:{{borderStyle}};border-radius:{{radius}};font-size:{{fontSize}};font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:0.01em;">{{text}}</button>`,
    defaultProps: { text: 'Get Started', bg: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', padding: '12px 28px', radius: '10px', fontSize: '14px', borderStyle: 'none' } },

  { id: 'button-group', name: 'Button Group', icon: '🎛️', category: 'content',
    html: `<div style="display:flex;gap:10px;flex-wrap:wrap;">
  <button style="padding:{{padding}};background:{{primaryBg}};color:{{primaryColor}};border:none;border-radius:{{radius}};font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">{{primary}}</button>
  <button style="padding:{{padding}};background:{{secondaryBg}};color:{{secondaryColor}};border:1px solid {{border}};border-radius:{{radius}};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">{{secondary}}</button>
  <button style="padding:{{padding}};background:transparent;color:{{linkColor}};border:none;border-radius:{{radius}};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:underline;">{{link}}</button>
</div>`,
    defaultProps: { primary: 'Save Changes', secondary: 'Cancel', link: 'Delete', primaryBg: '#7c3aed', primaryColor: '#fff', secondaryBg: 'transparent', secondaryColor: '#cdd6f4', linkColor: '#f38ba8', border: '#313244', radius: '8px', padding: '10px 20px' } },

  { id: 'badge', name: 'Badge', icon: '🏷️', category: 'content',
    html: `<div style="display:flex;gap:8px;flex-wrap:wrap;">
  <span style="padding:{{padding}};background:rgba(124,58,237,0.12);color:#b4befe;border-radius:{{radius}};font-size:{{fontSize}};font-weight:600;">Default</span>
  <span style="padding:{{padding}};background:rgba(34,197,94,0.12);color:#a6e3a1;border-radius:{{radius}};font-size:{{fontSize}};font-weight:600;">Success</span>
  <span style="padding:{{padding}};background:rgba(250,204,21,0.12);color:#f9e2af;border-radius:{{radius}};font-size:{{fontSize}};font-weight:600;">Warning</span>
  <span style="padding:{{padding}};background:rgba(244,63,94,0.12);color:#f38ba8;border-radius:{{radius}};font-size:{{fontSize}};font-weight:600;">Error</span>
</div>`,
    defaultProps: { padding: '4px 12px', radius: '20px', fontSize: '11px' } },

  { id: 'divider', name: 'Divider', icon: '—', category: 'content',
    html: `<hr style="border:none;height:{{height}};background:{{color}};margin:{{margin}} 0;border-radius:2px;" />`,
    defaultProps: { height: '1px', color: '#313244', margin: '16px' } },

  { id: 'alert', name: 'Alert Box', icon: '⚠️', category: 'content',
    html: `<div style="display:flex;gap:12px;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:10px;border-left:3px solid {{accentBorder}};">
  <span style="font-size:18px;flex-shrink:0;">{{icon}}</span>
  <div>
    <div style="font-size:14px;font-weight:600;color:{{titleColor}};margin-bottom:4px;">{{title}}</div>
    <div style="font-size:13px;color:{{textColor}};line-height:1.5;">{{message}}</div>
  </div>
</div>`,
    defaultProps: { icon: 'ℹ️', title: 'Information', message: 'This is an informational alert with important details.', bg: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.15)', accentBorder: '#0ea5e9', titleColor: '#89b4fa', textColor: '#a6adc8', padding: '16px' } },

  // ═══════════════════════════════════════════════════════════════
  //  DATA DISPLAY
  // ═══════════════════════════════════════════════════════════════

  { id: 'stats-row', name: 'Stats Row', icon: '📊', category: 'data',
    html: `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:{{gap}};">
  <div style="background:{{bg}};padding:{{padding}};border-radius:12px;border:1px solid {{border}};"><div style="font-size:11px;color:{{labelColor}};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">{{label1}}</div><div style="font-size:28px;font-weight:800;color:{{valColor}};">{{val1}}</div><div style="font-size:11px;color:#a6e3a1;margin-top:4px;">{{change1}}</div></div>
  <div style="background:{{bg}};padding:{{padding}};border-radius:12px;border:1px solid {{border}};"><div style="font-size:11px;color:{{labelColor}};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">{{label2}}</div><div style="font-size:28px;font-weight:800;color:{{valColor}};">{{val2}}</div><div style="font-size:11px;color:#a6e3a1;margin-top:4px;">{{change2}}</div></div>
  <div style="background:{{bg}};padding:{{padding}};border-radius:12px;border:1px solid {{border}};"><div style="font-size:11px;color:{{labelColor}};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">{{label3}}</div><div style="font-size:28px;font-weight:800;color:{{valColor}};">{{val3}}</div><div style="font-size:11px;color:#f38ba8;margin-top:4px;">{{change3}}</div></div>
  <div style="background:{{bg}};padding:{{padding}};border-radius:12px;border:1px solid {{border}};"><div style="font-size:11px;color:{{labelColor}};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">{{label4}}</div><div style="font-size:28px;font-weight:800;color:{{valColor}};">{{val4}}</div><div style="font-size:11px;color:#a6e3a1;margin-top:4px;">{{change4}}</div></div>
</div>`,
    defaultProps: { val1: '24.5K', label1: 'Total Users', change1: '↑ 12.5%', val2: '$48.2K', label2: 'Revenue', change2: '↑ 8.3%', val3: '3.2%', label3: 'Bounce Rate', change3: '↓ 2.1%', val4: '98.5%', label4: 'Uptime', change4: '↑ 0.2%', bg: '#1e1e2e', border: '#313244', gap: '12px', padding: '20px', valColor: '#f5f5f5', labelColor: '#585b70' } },

  { id: 'table', name: 'Data Table', icon: '📋', category: 'data',
    html: `<div style="background:{{bg}};border:1px solid {{border}};border-radius:12px;overflow:hidden;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:{{headerBg}};"><th style="padding:10px 16px;text-align:left;color:{{headerColor}};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Name</th><th style="padding:10px 16px;text-align:left;color:{{headerColor}};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Role</th><th style="padding:10px 16px;text-align:left;color:{{headerColor}};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Status</th><th style="padding:10px 16px;text-align:right;color:{{headerColor}};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Actions</th></tr></thead>
    <tbody>
      <tr style="border-top:1px solid {{border}};"><td style="padding:10px 16px;color:{{textColor}};">Sarah Chen</td><td style="padding:10px 16px;color:{{mutedColor}};">Engineer</td><td style="padding:10px 16px;"><span style="padding:3px 10px;background:rgba(34,197,94,0.1);color:#a6e3a1;border-radius:10px;font-size:11px;">Active</span></td><td style="padding:10px 16px;text-align:right;color:{{mutedColor}};">⋯</td></tr>
      <tr style="border-top:1px solid {{border}};"><td style="padding:10px 16px;color:{{textColor}};">Marcus Rivera</td><td style="padding:10px 16px;color:{{mutedColor}};">Designer</td><td style="padding:10px 16px;"><span style="padding:3px 10px;background:rgba(250,204,21,0.1);color:#f9e2af;border-radius:10px;font-size:11px;">Away</span></td><td style="padding:10px 16px;text-align:right;color:{{mutedColor}};">⋯</td></tr>
      <tr style="border-top:1px solid {{border}};"><td style="padding:10px 16px;color:{{textColor}};">Aiko Tanaka</td><td style="padding:10px 16px;color:{{mutedColor}};">PM</td><td style="padding:10px 16px;"><span style="padding:3px 10px;background:rgba(34,197,94,0.1);color:#a6e3a1;border-radius:10px;font-size:11px;">Active</span></td><td style="padding:10px 16px;text-align:right;color:{{mutedColor}};">⋯</td></tr>
    </tbody>
  </table>
</div>`,
    defaultProps: { bg: '#1e1e2e', headerBg: '#181825', border: '#313244', headerColor: '#585b70', textColor: '#cdd6f4', mutedColor: '#585b70' } },

  { id: 'avatar-group', name: 'Avatar Group', icon: '👥', category: 'data',
    html: `<div style="display:flex;align-items:center;gap:16px;">
  <div style="display:flex;">
    <div style="width:36px;height:36px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;border:2px solid #0d0d15;">SC</div>
    <div style="width:36px;height:36px;border-radius:50%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;border:2px solid #0d0d15;margin-left:-8px;">MR</div>
    <div style="width:36px;height:36px;border-radius:50%;background:#f43f5e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;border:2px solid #0d0d15;margin-left:-8px;">AT</div>
    <div style="width:36px;height:36px;border-radius:50%;background:#313244;display:flex;align-items:center;justify-content:center;color:#a6adc8;font-size:10px;font-weight:600;border:2px solid #0d0d15;margin-left:-8px;">+{{count}}</div>
  </div>
  <span style="font-size:13px;color:{{textColor}};">{{label}}</span>
</div>`,
    defaultProps: { count: '5', label: 'team members online', textColor: '#a6adc8' } },

  { id: 'progress', name: 'Progress Bar', icon: '📶', category: 'data',
    html: `<div style="max-width:{{maxWidth}};">
  <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:{{labelColor}};font-weight:500;">{{label}}</span><span style="font-size:12px;color:{{valColor}};font-weight:600;">{{value}}%</span></div>
  <div style="width:100%;height:{{height}};background:{{trackBg}};border-radius:{{radius}};overflow:hidden;"><div style="width:{{value}}%;height:100%;background:{{fillBg}};border-radius:{{radius}};transition:width 0.6s ease;"></div></div>
</div>`,
    defaultProps: { label: 'Upload Progress', value: '73', maxWidth: '400px', height: '8px', trackBg: '#313244', fillBg: 'linear-gradient(90deg,#7c3aed,#6366f1)', labelColor: '#a6adc8', valColor: '#cdd6f4', radius: '8px' } },

  // ═══════════════════════════════════════════════════════════════
  //  FORM
  // ═══════════════════════════════════════════════════════════════

  { id: 'input', name: 'Text Input', icon: '📝', category: 'form',
    html: `<div style="max-width:{{maxWidth}};">
  <label style="display:block;font-size:13px;color:{{labelColor}};margin-bottom:6px;font-weight:500;">{{label}}</label>
  <input type="text" placeholder="{{placeholder}}" style="width:100%;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};color:{{color}};font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;" />
  <span style="display:block;font-size:11px;color:{{hintColor}};margin-top:4px;">{{hint}}</span>
</div>`,
    defaultProps: { label: 'Email Address', placeholder: 'you@example.com', hint: 'We will never share your email.', bg: '#11111b', border: '#313244', color: '#cdd6f4', padding: '11px 14px', radius: '8px', maxWidth: '380px', labelColor: '#a6adc8', hintColor: '#585b70' } },

  { id: 'textarea', name: 'Textarea', icon: '📄', category: 'form',
    html: `<div style="max-width:{{maxWidth}};">
  <label style="display:block;font-size:13px;color:{{labelColor}};margin-bottom:6px;font-weight:500;">{{label}}</label>
  <textarea placeholder="{{placeholder}}" rows="4" style="width:100%;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};color:{{color}};font-size:14px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
</div>`,
    defaultProps: { label: 'Message', placeholder: 'Type your message...', bg: '#11111b', border: '#313244', color: '#cdd6f4', padding: '11px 14px', radius: '8px', maxWidth: '380px', labelColor: '#a6adc8' } },

  { id: 'select', name: 'Select Dropdown', icon: '📜', category: 'form',
    html: `<div style="max-width:{{maxWidth}};">
  <label style="display:block;font-size:13px;color:{{labelColor}};margin-bottom:6px;font-weight:500;">{{label}}</label>
  <select style="width:100%;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};color:{{color}};font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;12&quot; height=&quot;12&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;%23585b70&quot; stroke-width=&quot;2&quot;><polyline points=&quot;6 9 12 15 18 9&quot;/></svg>');background-repeat:no-repeat;background-position:right 12px center;">
    <option>{{opt1}}</option><option>{{opt2}}</option><option>{{opt3}}</option>
  </select>
</div>`,
    defaultProps: { label: 'Country', opt1: 'United States', opt2: 'Brazil', opt3: 'Japan', bg: '#11111b', border: '#313244', color: '#cdd6f4', padding: '11px 14px', radius: '8px', maxWidth: '380px', labelColor: '#a6adc8' } },

  { id: 'checkbox-group', name: 'Checkbox Group', icon: '☑️', category: 'form',
    html: `<div style="display:flex;flex-direction:column;gap:10px;max-width:{{maxWidth}};">
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:{{color}};"><input type="checkbox" checked style="accent-color:{{accent}};width:16px;height:16px;" /> {{opt1}}</label>
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:{{color}};"><input type="checkbox" style="accent-color:{{accent}};width:16px;height:16px;" /> {{opt2}}</label>
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:{{color}};"><input type="checkbox" style="accent-color:{{accent}};width:16px;height:16px;" /> {{opt3}}</label>
</div>`,
    defaultProps: { opt1: 'Email notifications', opt2: 'SMS alerts', opt3: 'Push notifications', color: '#cdd6f4', accent: '#7c3aed', maxWidth: '300px' } },

  { id: 'login-form', name: 'Login Form', icon: '🔐', category: 'form',
    html: `<div style="background:{{bg}};border:1px solid {{border}};border-radius:16px;padding:32px;max-width:380px;">
  <h2 style="font-size:22px;color:{{titleColor}};margin:0 0 4px;font-weight:700;">{{title}}</h2>
  <p style="font-size:13px;color:{{mutedColor}};margin:0 0 24px;">{{subtitle}}</p>
  <div style="margin-bottom:14px;"><label style="display:block;font-size:12px;color:{{labelColor}};margin-bottom:4px;font-weight:500;">Email</label><input type="email" placeholder="you@example.com" style="width:100%;padding:10px 14px;background:{{inputBg}};border:1px solid {{border}};border-radius:8px;color:{{titleColor}};font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;" /></div>
  <div style="margin-bottom:8px;"><label style="display:block;font-size:12px;color:{{labelColor}};margin-bottom:4px;font-weight:500;">Password</label><input type="password" placeholder="••••••••" style="width:100%;padding:10px 14px;background:{{inputBg}};border:1px solid {{border}};border-radius:8px;color:{{titleColor}};font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;" /></div>
  <div style="text-align:right;margin-bottom:20px;"><a href="#" style="font-size:12px;color:{{accent}};text-decoration:none;">Forgot password?</a></div>
  <button style="width:100%;padding:11px;background:{{accent}};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Sign In</button>
  <p style="text-align:center;font-size:12px;color:{{mutedColor}};margin:16px 0 0;">Don't have an account? <a href="#" style="color:{{accent}};text-decoration:none;font-weight:600;">Sign Up</a></p>
</div>`,
    defaultProps: { title: 'Welcome Back', subtitle: 'Sign in to your account', bg: '#1e1e2e', inputBg: '#11111b', border: '#313244', accent: '#7c3aed', titleColor: '#f5f5f5', labelColor: '#a6adc8', mutedColor: '#585b70' } },

  // ═══════════════════════════════════════════════════════════════
  //  MEDIA
  // ═══════════════════════════════════════════════════════════════

  { id: 'image-placeholder', name: 'Image', icon: '🖼️', category: 'media',
    html: `<div style="aspect-ratio:{{ratio}};max-width:{{maxWidth}};border-radius:{{radius}};overflow:hidden;border:2px dashed {{border}};background:{{bg}};">
  <img src="{{imgSrc}}" alt="Image" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;flex-direction:column;gap:8px;color:#585b70;\'>🖼️<span style=\'font-size:11px;\'>Upload an image via Properties panel</span></div>'"/>
</div>`,
    defaultProps: { ratio: '16/9', maxWidth: '100%', bg: '#181825', border: '#313244', radius: '12px', imgSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' } },

  { id: 'video-embed', name: 'Video Embed', icon: '🎬', category: 'media',
    html: `<div style="aspect-ratio:16/9;max-width:{{maxWidth}};border-radius:{{radius}};position:relative;overflow:hidden;border:1px solid {{border}};background:#0d0d15;">
  <div style="position:absolute;inset:0;background:url('{{thumbUrl}}') center/cover no-repeat;"></div>
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);">
    <a href="{{videoUrl}}" target="_blank" style="text-decoration:none;">
      <div style="width:64px;height:64px;background:rgba(124,58,237,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,0.3);transition:transform 0.2s;">▶</div>
    </a>
  </div>
  <div style="position:absolute;bottom:12px;left:12px;right:12px;display:flex;align-items:center;gap:8px;"><div style="flex:1;height:3px;background:#313244;border-radius:2px;"><div style="width:35%;height:100%;background:#7c3aed;border-radius:2px;"></div></div><span style="font-size:11px;color:#585b70;">{{duration}}</span></div>
</div>`,
    defaultProps: { thumbUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '2:47', maxWidth: '100%', radius: '12px', border: '#313244' } },

  { id: 'avatar', name: 'Avatar', icon: '👤', category: 'media',
    html: `<div style="display:flex;align-items:center;gap:12px;">
  <div style="width:{{size}};height:{{size}};border-radius:50%;background:{{bg}};display:flex;align-items:center;justify-content:center;font-size:{{fontSize}};color:{{color}};font-weight:700;">{{initials}}</div>
  <div><div style="font-size:14px;font-weight:600;color:{{nameColor}};">{{name}}</div><div style="font-size:12px;color:{{roleColor}};">{{role}}</div></div>
</div>`,
    defaultProps: { initials: 'JD', name: 'John Doe', role: 'Senior Developer', size: '44px', bg: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', fontSize: '16px', nameColor: '#f5f5f5', roleColor: '#585b70' } },

  { id: 'logo-cloud', name: 'Logo Cloud', icon: '🏢', category: 'media',
    html: `<section style="padding:{{padding}};text-align:center;">
  <p style="font-size:12px;color:{{labelColor}};text-transform:uppercase;letter-spacing:2px;margin:0 0 24px;font-weight:600;">{{label}}</p>
  <div style="display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap;opacity:0.5;">
    <span style="font-size:20px;font-weight:700;color:{{logoColor}};">Google</span>
    <span style="font-size:20px;font-weight:700;color:{{logoColor}};">Apple</span>
    <span style="font-size:20px;font-weight:700;color:{{logoColor}};">Meta</span>
    <span style="font-size:20px;font-weight:700;color:{{logoColor}};">Stripe</span>
    <span style="font-size:20px;font-weight:700;color:{{logoColor}};">Vercel</span>
  </div>
</section>`,
    defaultProps: { label: 'Trusted by leading companies', logoColor: '#cdd6f4', labelColor: '#585b70', padding: '32px 24px' } },

  // ═══════════════════════════════════════════════════════════════
  //  INTERACTIVE
  // ═══════════════════════════════════════════════════════════════

  { id: 'toast', name: 'Toast / Snackbar', icon: '🍞', category: 'interactive',
    html: `<div style="display:flex;align-items:center;gap:12px;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:12px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
  <span style="font-size:18px;">{{icon}}</span>
  <div style="flex:1;"><div style="font-size:13px;font-weight:600;color:{{titleColor}};">{{title}}</div><div style="font-size:12px;color:{{textColor}};">{{message}}</div></div>
  <button style="background:none;border:none;color:{{mutedColor}};cursor:pointer;font-size:14px;padding:4px;">✕</button>
</div>`,
    defaultProps: { icon: '✅', title: 'Success!', message: 'Your changes have been saved.', bg: '#1e1e2e', border: '#313244', titleColor: '#f5f5f5', textColor: '#a6adc8', mutedColor: '#585b70', padding: '14px 16px' } },

  { id: 'modal', name: 'Modal Dialog', icon: '🪟', category: 'interactive',
    html: `<div style="background:rgba(0,0,0,0.6);padding:40px;display:flex;align-items:center;justify-content:center;border-radius:12px;">
  <div style="background:{{bg}};border:1px solid {{border}};border-radius:14px;padding:28px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="font-size:18px;font-weight:700;color:{{titleColor}};margin:0;">{{title}}</h3>
      <button style="background:none;border:none;color:{{mutedColor}};cursor:pointer;font-size:16px;padding:4px;">✕</button>
    </div>
    <p style="font-size:14px;color:{{textColor}};line-height:1.6;margin:0 0 24px;">{{message}}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button style="padding:9px 20px;background:transparent;border:1px solid {{border}};border-radius:8px;color:{{textColor}};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Cancel</button>
      <button style="padding:9px 20px;background:{{accent}};border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">{{confirmText}}</button>
    </div>
  </div>
</div>`,
    defaultProps: { title: 'Confirm Action', message: 'Are you sure you want to proceed? This action cannot be undone.', confirmText: 'Confirm', bg: '#1e1e2e', border: '#313244', accent: '#7c3aed', titleColor: '#f5f5f5', textColor: '#a6adc8', mutedColor: '#585b70' } },

  { id: 'notification', name: 'Notification', icon: '🔔', category: 'interactive',
    html: `<div style="display:flex;gap:12px;padding:{{padding}};background:{{bg}};border:1px solid {{border}};border-radius:12px;max-width:380px;">
  <div style="width:40px;height:40px;border-radius:10px;background:{{iconBg}};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">{{icon}}</div>
  <div style="flex:1;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="font-size:13px;font-weight:600;color:{{titleColor}};">{{title}}</span>
      <span style="font-size:10px;color:{{mutedColor}};">{{time}}</span>
    </div>
    <p style="font-size:12px;color:{{textColor}};line-height:1.5;margin:0;">{{message}}</p>
  </div>
</div>`,
    defaultProps: { icon: '📬', title: 'New Message', message: 'You received a new message from Sarah Chen.', time: '2m ago', iconBg: 'rgba(124,58,237,0.12)', bg: '#1e1e2e', border: '#313244', titleColor: '#f5f5f5', textColor: '#a6adc8', mutedColor: '#585b70', padding: '14px' } },

  { id: 'search-bar', name: 'Search Bar', icon: '🔍', category: 'interactive',
    html: `<div style="max-width:{{maxWidth}};position:relative;">
  <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:{{iconColor}};">🔍</span>
  <input type="text" placeholder="{{placeholder}}" style="width:100%;padding:{{padding}};padding-left:40px;background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};color:{{color}};font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;" />
  <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:10px;color:{{mutedColor}};background:{{shortcutBg}};padding:3px 8px;border-radius:4px;font-family:monospace;">⌘K</span>
</div>`,
    defaultProps: { placeholder: 'Search anything...', maxWidth: '480px', bg: '#11111b', border: '#313244', color: '#cdd6f4', padding: '12px 14px', radius: '10px', iconColor: '#585b70', mutedColor: '#585b70', shortcutBg: '#1e1e2e' } },

  // ═══════════════════════════════════════════════════════════════
  //  EFFECTS — Visual / Decorative
  // ═══════════════════════════════════════════════════════════════

  { id: 'glass-card', name: 'Glass Card', icon: '🪟', category: 'effects',
    html: `<div style="background:{{bg}};backdrop-filter:blur({{blur}});border:1px solid {{border}};border-radius:{{radius}};padding:{{padding}};max-width:{{maxWidth}};">
  <h3 style="font-size:18px;color:#fff;margin:0 0 8px;font-weight:600;">{{title}}</h3>
  <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0;line-height:1.6;">{{desc}}</p>
</div>`,
    defaultProps: { title: 'Glassmorphism', desc: 'A beautiful frosted glass effect with backdrop blur.', bg: 'rgba(255,255,255,0.05)', blur: '16px', border: 'rgba(255,255,255,0.08)', radius: '16px', padding: '28px', maxWidth: '380px' } },

  { id: 'gradient-text', name: 'Gradient Text', icon: '🌈', category: 'effects',
    html: `<h1 style="font-size:{{fontSize}};font-weight:900;background:linear-gradient({{angle}},{{color1}},{{color2}},{{color3}});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0;letter-spacing:-0.03em;line-height:1.1;">{{text}}</h1>`,
    defaultProps: { text: 'Beautiful Gradient', fontSize: '56px', color1: '#7c3aed', color2: '#ec4899', color3: '#f97316', angle: '135deg' } },

  { id: 'glow-button', name: 'Glow Button', icon: '✨', category: 'effects',
    html: `<button style="padding:{{padding}};background:{{bg}};color:#fff;border:none;border-radius:{{radius}};font-size:{{fontSize}};font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 0 20px {{glowColor}},0 0 60px {{glowColor2}};letter-spacing:0.02em;">{{text}}</button>`,
    defaultProps: { text: 'Launch Now ✨', bg: 'linear-gradient(135deg,#7c3aed,#ec4899)', padding: '16px 40px', radius: '12px', fontSize: '16px', glowColor: 'rgba(124,58,237,0.4)', glowColor2: 'rgba(236,72,153,0.15)' } },

  { id: 'grid-pattern', name: 'Grid Pattern BG', icon: '▦', category: 'effects',
    html: `<div style="background:{{bg}};background-image:linear-gradient({{gridColor}} 1px,transparent 1px),linear-gradient(90deg,{{gridColor}} 1px,transparent 1px);background-size:{{size}} {{size}};padding:{{padding}};border-radius:12px;text-align:center;position:relative;">
  <h2 style="font-size:32px;font-weight:800;color:#f5f5f5;margin:0 0 12px;position:relative;">{{title}}</h2>
  <p style="font-size:15px;color:#a6adc8;margin:0;position:relative;">{{subtitle}}</p>
</div>`,
    defaultProps: { title: 'Grid Background', subtitle: 'A subtle grid pattern for visual depth.', bg: '#0d0d15', gridColor: 'rgba(49,50,68,0.4)', size: '32px', padding: '64px 32px' } },

  { id: 'spotlight', name: 'Spotlight Effect', icon: '💡', category: 'effects',
    html: `<div style="background:radial-gradient(circle at {{spotX}} {{spotY}},{{spotColor}},transparent 50%),{{bg}};padding:{{padding}};border-radius:16px;text-align:center;border:1px solid {{border}};">
  <h2 style="font-size:36px;font-weight:800;color:#f5f5f5;margin:0 0 12px;">{{title}}</h2>
  <p style="font-size:15px;color:#a6adc8;margin:0 auto;max-width:500px;line-height:1.6;">{{subtitle}}</p>
</div>`,
    defaultProps: { title: 'Spotlight Section', subtitle: 'A radial gradient spotlight draws attention to key content.', spotX: '50%', spotY: '30%', spotColor: 'rgba(124,58,237,0.15)', bg: '#0d0d15', border: '#1e1e2e', padding: '72px 32px' } },

  { id: 'footer-pro', name: 'Footer Pro', icon: '🦶', category: 'sections',
    html: `<footer style="padding:{{padding}};background:{{bg}};border-top:1px solid {{border}};border-radius:12px;">
  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;margin-bottom:32px;">
    <div><div style="font-size:18px;font-weight:800;color:{{titleColor}};margin-bottom:8px;">{{brand}}</div><p style="font-size:13px;color:{{mutedColor}};line-height:1.6;margin:0;">{{brandDesc}}</p></div>
    <div><div style="font-size:12px;font-weight:700;color:{{titleColor}};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Product</div><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">Features</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">Pricing</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;">Changelog</a></div>
    <div><div style="font-size:12px;font-weight:700;color:{{titleColor}};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Company</div><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">About</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">Blog</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;">Careers</a></div>
    <div><div style="font-size:12px;font-weight:700;color:{{titleColor}};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Legal</div><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">Privacy</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;margin-bottom:8px;">Terms</a><a href="#" style="display:block;font-size:13px;color:{{linkColor}};text-decoration:none;">Cookies</a></div>
  </div>
  <div style="border-top:1px solid {{border}};padding-top:16px;text-align:center;"><p style="font-size:12px;color:{{mutedColor}};margin:0;">{{copyright}}</p></div>
</footer>`,
    defaultProps: { brand: 'Lumina', brandDesc: 'Building the future of web development.', copyright: '© 2026 Lumina. All rights reserved.', bg: '#11111b', border: '#1e1e2e', padding: '40px 32px', titleColor: '#f5f5f5', linkColor: '#585b70', mutedColor: '#45475a' } },

  // ═══════════════════════════════════════════════════════════════
  //  INTERACTIVE — Advanced / Dynamic Components
  // ═══════════════════════════════════════════════════════════════

  { id: 'carousel', name: 'Image Carousel', icon: '🎠', category: 'interactive',
    html: `<div style="max-width:{{maxWidth}};position:relative;border-radius:{{radius}};overflow:hidden;">
  <div style="display:flex;transition:transform 0.5s ease;">
    <div style="min-width:100%;aspect-ratio:{{ratio}};background:url('{{slide1Img}}') center/cover no-repeat, {{slide1Bg}};position:relative;">
      <div style="position:absolute;inset:0;background:{{overlayBg}};display:flex;flex-direction:column;justify-content:{{contentAlign}};align-items:{{textAlign}};padding:{{contentPadding}};">
        <h3 style="margin:0 0 8px;color:{{titleColor}};font-size:{{titleSize}};font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,0.5);">{{slide1Title}}</h3>
        <p style="margin:0;color:{{textColor}};font-size:14px;max-width:480px;text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{slide1Desc}}</p>
      </div>
    </div>
    <div style="min-width:100%;aspect-ratio:{{ratio}};background:url('{{slide2Img}}') center/cover no-repeat, {{slide2Bg}};position:relative;">
      <div style="position:absolute;inset:0;background:{{overlayBg}};display:flex;flex-direction:column;justify-content:{{contentAlign}};align-items:{{textAlign}};padding:{{contentPadding}};">
        <h3 style="margin:0 0 8px;color:{{titleColor}};font-size:{{titleSize}};font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,0.5);">{{slide2Title}}</h3>
        <p style="margin:0;color:{{textColor}};font-size:14px;max-width:480px;text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{slide2Desc}}</p>
      </div>
    </div>
    <div style="min-width:100%;aspect-ratio:{{ratio}};background:url('{{slide3Img}}') center/cover no-repeat, {{slide3Bg}};position:relative;">
      <div style="position:absolute;inset:0;background:{{overlayBg}};display:flex;flex-direction:column;justify-content:{{contentAlign}};align-items:{{textAlign}};padding:{{contentPadding}};">
        <h3 style="margin:0 0 8px;color:{{titleColor}};font-size:{{titleSize}};font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,0.5);">{{slide3Title}}</h3>
        <p style="margin:0;color:{{textColor}};font-size:14px;max-width:480px;text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{slide3Desc}}</p>
      </div>
    </div>
  </div>
  <div style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;">
    <div style="width:24px;height:4px;border-radius:2px;background:{{accent}};"></div>
    <div style="width:24px;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);"></div>
    <div style="width:24px;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);"></div>
  </div>
  <button style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:1px solid rgba(255,255,255,0.1);font-size:18px;cursor:pointer;backdrop-filter:blur(8px);transition:all 0.2s;">‹</button>
  <button style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:1px solid rgba(255,255,255,0.1);font-size:18px;cursor:pointer;backdrop-filter:blur(8px);transition:all 0.2s;">›</button>
</div>`,
    defaultProps: { slide1Img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', slide1Title: 'Explore the Universe', slide1Desc: 'Discover infinite possibilities with our platform', slide1Bg: 'linear-gradient(135deg,#1a1a2e,#2d1b69)', slide2Img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', slide2Title: 'Advanced Technology', slide2Desc: 'Built with cutting-edge tools and frameworks', slide2Bg: 'linear-gradient(135deg,#0d1117,#1a3a5c)', slide3Img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', slide3Title: 'Secure & Reliable', slide3Desc: 'Enterprise-grade security for your peace of mind', slide3Bg: 'linear-gradient(135deg,#0a1a0f,#1a3a2a)', titleColor: '#fff', textColor: 'rgba(255,255,255,0.85)', accent: '#7c3aed', overlayBg: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', maxWidth: '100%', ratio: '16/9', radius: '14px', titleSize: '28px', contentAlign: 'flex-end', textAlign: 'flex-start', contentPadding: '40px' } },

  { id: 'image-gallery', name: 'Image Gallery', icon: '🖼️', category: 'interactive',
    html: `<div style="max-width:{{maxWidth}};">
  <div style="display:grid;grid-template-columns:repeat({{cols}},1fr);gap:{{gap}};">
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img1}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};"></div>
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img2}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};"></div>
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img3}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};"></div>
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img4}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};"></div>
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img5}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};"></div>
    <div style="aspect-ratio:{{ratio}};border-radius:{{radius}};overflow:hidden;background:url('{{img6}}') center/cover no-repeat, {{fallbackBg}};cursor:pointer;transition:all 0.3s;border:1px solid {{border}};position:relative;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700;backdrop-filter:blur(2px);">+{{moreCount}}</div>
    </div>
  </div>
</div>`,
    defaultProps: { img1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', img2: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80', img3: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', img4: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80', img5: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', img6: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80', moreCount: '12', cols: '3', gap: '8px', ratio: '1/1', radius: '10px', border: '#313244', fallbackBg: '#1e1e2e', maxWidth: '100%' } },

  { id: 'image-banner', name: 'Image Banner', icon: '🏞️', category: 'media',
    html: `<div style="position:relative;border-radius:{{radius}};overflow:hidden;aspect-ratio:{{ratio}};">
  <div style="position:absolute;inset:0;background:url('{{imgUrl}}') center/cover no-repeat, {{fallbackBg}};"></div>
  <div style="position:absolute;inset:0;background:{{overlay}};"></div>
  <div style="position:relative;height:100%;display:flex;flex-direction:column;justify-content:{{vAlign}};align-items:{{hAlign}};padding:{{padding}};">
    <span style="display:inline-block;padding:5px 14px;background:rgba(255,255,255,0.1);border-radius:20px;font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:12px;backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.1);">{{badge}}</span>
    <h2 style="font-size:{{titleSize}};font-weight:800;color:#fff;margin:0 0 8px;text-shadow:0 2px 12px rgba(0,0,0,0.5);line-height:1.2;">{{title}}</h2>
    <p style="font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 20px;max-width:500px;text-shadow:0 1px 6px rgba(0,0,0,0.3);">{{subtitle}}</p>
    <a href="#" style="display:inline-block;padding:12px 28px;background:{{btnBg}};color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,0.2);">{{btnText}}</a>
  </div>
</div>`,
    defaultProps: { imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80', fallbackBg: 'linear-gradient(135deg,#1a1a2e,#2d1b69)', overlay: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', badge: '🚀 New Feature', title: 'Beautiful Imagery', subtitle: 'Add stunning background images to your designs with full control.', btnText: 'Learn More', btnBg: '#7c3aed', ratio: '21/9', radius: '16px', titleSize: '36px', vAlign: 'flex-end', hAlign: 'flex-start', padding: '40px' } },

  { id: 'accordion', name: 'Accordion', icon: '📂', category: 'interactive',
    html: `<div style="max-width:{{maxWidth}};display:flex;flex-direction:column;gap:4px;">
  <details open style="background:{{bg}};border:1px solid {{border}};border-radius:10px;overflow:hidden;">
    <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">{{section1}} <span style="color:{{mutedColor}};font-size:12px;">▼</span></summary>
    <div style="padding:0 18px 16px;font-size:13px;color:{{textColor}};line-height:1.6;">{{content1}}</div>
  </details>
  <details style="background:{{bg}};border:1px solid {{border}};border-radius:10px;overflow:hidden;">
    <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">{{section2}} <span style="color:{{mutedColor}};font-size:12px;">▶</span></summary>
    <div style="padding:0 18px 16px;font-size:13px;color:{{textColor}};line-height:1.6;">{{content2}}</div>
  </details>
  <details style="background:{{bg}};border:1px solid {{border}};border-radius:10px;overflow:hidden;">
    <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:{{titleColor}};cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">{{section3}} <span style="color:{{mutedColor}};font-size:12px;">▶</span></summary>
    <div style="padding:0 18px 16px;font-size:13px;color:{{textColor}};line-height:1.6;">{{content3}}</div>
  </details>
</div>`,
    defaultProps: { section1: 'Getting Started', content1: 'Follow our quick-start guide to set up your project in under 5 minutes.', section2: 'Configuration', content2: 'Customize your setup with our flexible configuration options.', section3: 'Deployment', content3: 'Deploy to production with a single command.', bg: '#1e1e2e', border: '#313244', maxWidth: '600px', titleColor: '#f5f5f5', textColor: '#a6adc8', mutedColor: '#585b70' } },

  { id: 'toggle-switch', name: 'Toggle Switch', icon: '🔀', category: 'interactive',
    html: `<div style="display:flex;flex-direction:column;gap:14px;max-width:{{maxWidth}};">
  <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
    <div><div style="font-size:14px;font-weight:500;color:{{titleColor}};">{{label1}}</div><div style="font-size:11px;color:{{mutedColor}};">{{desc1}}</div></div>
    <div style="width:44px;height:24px;background:{{accent}};border-radius:12px;position:relative;"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;right:2px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div></div>
  </label>
  <div style="height:1px;background:{{border}};"></div>
  <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
    <div><div style="font-size:14px;font-weight:500;color:{{titleColor}};">{{label2}}</div><div style="font-size:11px;color:{{mutedColor}};">{{desc2}}</div></div>
    <div style="width:44px;height:24px;background:{{offBg}};border-radius:12px;position:relative;"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div></div>
  </label>
  <div style="height:1px;background:{{border}};"></div>
  <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
    <div><div style="font-size:14px;font-weight:500;color:{{titleColor}};">{{label3}}</div><div style="font-size:11px;color:{{mutedColor}};">{{desc3}}</div></div>
    <div style="width:44px;height:24px;background:{{accent}};border-radius:12px;position:relative;"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;right:2px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div></div>
  </label>
</div>`,
    defaultProps: { label1: 'Dark Mode', desc1: 'Toggle dark mode theme', label2: 'Notifications', desc2: 'Receive push notifications', label3: 'Auto-save', desc3: 'Automatically save changes', accent: '#7c3aed', offBg: '#313244', border: '#1e1e2e', maxWidth: '380px', titleColor: '#f5f5f5', mutedColor: '#585b70' } },

  { id: 'marquee', name: 'Marquee Banner', icon: '📜', category: 'interactive',
    html: `<div style="overflow:hidden;background:{{bg}};padding:{{padding}};border-radius:8px;border:1px solid {{border}};">
  <div style="display:flex;gap:{{gap}};animation:ds-marquee {{speed}} linear infinite;white-space:nowrap;">
    <span style="font-size:{{fontSize}};color:{{color}};font-weight:{{weight}};">{{text1}}</span>
    <span style="font-size:{{fontSize}};color:{{mutedColor}};">{{separator}}</span>
    <span style="font-size:{{fontSize}};color:{{color}};font-weight:{{weight}};">{{text2}}</span>
    <span style="font-size:{{fontSize}};color:{{mutedColor}};">{{separator}}</span>
    <span style="font-size:{{fontSize}};color:{{color}};font-weight:{{weight}};">{{text3}}</span>
    <span style="font-size:{{fontSize}};color:{{mutedColor}};">{{separator}}</span>
    <span style="font-size:{{fontSize}};color:{{color}};font-weight:{{weight}};">{{text4}}</span>
    <span style="font-size:{{fontSize}};color:{{mutedColor}};">{{separator}}</span>
  </div>
</div>
<style>@keyframes ds-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}</style>`,
    defaultProps: { text1: '✨ Now Available', text2: '🚀 Lightning Fast', text3: '🔒 Enterprise Ready', text4: '🎨 Beautiful Design', separator: '•', bg: 'linear-gradient(90deg,rgba(124,58,237,0.08),rgba(99,102,241,0.08))', border: 'rgba(124,58,237,0.15)', color: '#b4befe', mutedColor: '#585b70', fontSize: '14px', weight: '600', gap: '32px', speed: '20s', padding: '12px 0' } },

  { id: 'countdown', name: 'Countdown Timer', icon: '⏳', category: 'interactive',
    html: `<div style="text-align:center;padding:{{padding}};">
  <h3 style="margin:0 0 24px;color:{{titleColor}};font-size:20px;font-weight:700;">{{title}}</h3>
  <div style="display:flex;gap:12px;justify-content:center;">
    <div style="background:{{cardBg}};border:1px solid {{border}};border-radius:12px;padding:16px 20px;min-width:72px;">
      <div style="font-size:32px;font-weight:800;color:{{valueColor}};font-family:'JetBrains Mono',monospace;">{{days}}</div>
      <div style="font-size:10px;color:{{labelColor}};text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Days</div>
    </div>
    <div style="background:{{cardBg}};border:1px solid {{border}};border-radius:12px;padding:16px 20px;min-width:72px;">
      <div style="font-size:32px;font-weight:800;color:{{valueColor}};font-family:'JetBrains Mono',monospace;">{{hours}}</div>
      <div style="font-size:10px;color:{{labelColor}};text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Hours</div>
    </div>
    <div style="background:{{cardBg}};border:1px solid {{border}};border-radius:12px;padding:16px 20px;min-width:72px;">
      <div style="font-size:32px;font-weight:800;color:{{valueColor}};font-family:'JetBrains Mono',monospace;">{{minutes}}</div>
      <div style="font-size:10px;color:{{labelColor}};text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Min</div>
    </div>
    <div style="background:{{cardBg}};border:1px solid {{border}};border-radius:12px;padding:16px 20px;min-width:72px;">
      <div style="font-size:32px;font-weight:800;color:{{valueColor}};font-family:'JetBrains Mono',monospace;">{{seconds}}</div>
      <div style="font-size:10px;color:{{labelColor}};text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Sec</div>
    </div>
  </div>
</div>`,
    defaultProps: { title: 'Launch in', days: '07', hours: '14', minutes: '32', seconds: '58', cardBg: '#1e1e2e', border: '#313244', padding: '32px', titleColor: '#f5f5f5', valueColor: '#b4befe', labelColor: '#585b70' } },

  // ═══════════════════════════════════════════════════════════════
  //  EFFECTS — Advanced Visual
  // ═══════════════════════════════════════════════════════════════

  { id: 'animated-border', name: 'Animated Border', icon: '💫', category: 'effects',
    html: `<div style="background:{{bg}};border-radius:{{radius}};padding:3px;background-image:conic-gradient(from var(--ds-angle,0deg),{{color1}},{{color2}},{{color3}},{{color4}},{{color1}});animation:ds-border-spin 3s linear infinite;">
  <div style="background:{{innerBg}};border-radius:calc({{radius}} - 3px);padding:{{padding}};">
    <h3 style="margin:0 0 8px;color:#f5f5f5;font-size:18px;font-weight:700;">{{title}}</h3>
    <p style="margin:0;color:#a6adc8;font-size:14px;line-height:1.6;">{{desc}}</p>
  </div>
</div>
<style>@property --ds-angle{syntax:'<angle>';initial-value:0deg;inherits:false}@keyframes ds-border-spin{to{--ds-angle:360deg}}</style>`,
    defaultProps: { title: 'Animated Border', desc: 'A stunning conic-gradient border that spins continuously.', color1: '#7c3aed', color2: '#ec4899', color3: '#0ea5e9', color4: '#22c55e', bg: 'transparent', innerBg: '#0d0d15', radius: '16px', padding: '24px' } },

  { id: 'neon-text', name: 'Neon Text', icon: '💡', category: 'effects',
    html: `<div style="text-align:center;padding:{{padding}};background:{{bg}};border-radius:12px;">
  <h1 style="font-size:{{fontSize}};font-weight:900;color:{{color}};margin:0;text-shadow:0 0 10px {{glow1}},0 0 40px {{glow2}},0 0 80px {{glow3}};letter-spacing:{{letterSpacing}};">{{text}}</h1>
  <p style="margin:12px 0 0;color:rgba(255,255,255,0.4);font-size:14px;">{{subtitle}}</p>
</div>`,
    defaultProps: { text: 'NEON GLOW', subtitle: 'Cyberpunk-inspired text effects', fontSize: '48px', color: '#fff', glow1: 'rgba(124,58,237,0.8)', glow2: 'rgba(124,58,237,0.4)', glow3: 'rgba(124,58,237,0.1)', bg: '#0a0a0f', padding: '48px 32px', letterSpacing: '8px' } },

  { id: 'parallax-card', name: '3D Card', icon: '🃏', category: 'effects',
    html: `<div style="perspective:1000px;max-width:{{maxWidth}};">
  <div style="background:{{bg}};border:1px solid {{border}};border-radius:{{radius}};padding:{{padding}};transform:rotateY({{rotateY}}) rotateX({{rotateX}});transition:transform 0.4s;box-shadow:{{shadow}};">
    <div style="width:48px;height:48px;background:{{iconBg}};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;">{{icon}}</div>
    <h3 style="margin:0 0 8px;color:{{titleColor}};font-size:18px;font-weight:700;">{{title}}</h3>
    <p style="margin:0;color:{{textColor}};font-size:14px;line-height:1.6;">{{desc}}</p>
  </div>
</div>`,
    defaultProps: { icon: '⚡', title: '3D Perspective', desc: 'A card with 3D transform and perspective, perfect for interactive hover effects.', rotateY: '-5deg', rotateX: '5deg', shadow: '20px 20px 60px rgba(0,0,0,0.3), -5px -5px 20px rgba(124,58,237,0.05)', bg: '#1e1e2e', border: '#313244', iconBg: 'rgba(124,58,237,0.12)', radius: '16px', padding: '28px', maxWidth: '380px', titleColor: '#f5f5f5', textColor: '#a6adc8' } },

  { id: 'shimmer', name: 'Shimmer Loader', icon: '✨', category: 'effects',
    html: `<div style="max-width:{{maxWidth}};display:flex;flex-direction:column;gap:12px;">
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
      <div style="height:12px;border-radius:4px;width:60%;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
      <div style="height:10px;border-radius:4px;width:40%;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
    </div>
  </div>
  <div style="height:160px;border-radius:10px;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
  <div style="height:12px;border-radius:4px;width:90%;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
  <div style="height:12px;border-radius:4px;width:70%;background:linear-gradient(90deg,{{bg}} 25%,{{shimmer}} 50%,{{bg}} 75%);background-size:200% 100%;animation:ds-shimmer 1.5s infinite;"></div>
</div>
<style>@keyframes ds-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>`,
    defaultProps: { bg: '#1e1e2e', shimmer: '#313244', maxWidth: '400px' } },

  { id: 'spacer', name: 'Spacer', icon: '↕️', category: 'content',
    html: `<div style="height:{{height}};"></div>`,
    defaultProps: { height: '40px' } },

  { id: 'container', name: 'Container', icon: '📦', category: 'content',
    html: `<div style="max-width:{{maxWidth}};margin:0 auto;padding:{{padding}};background:{{bg}};border:{{borderStyle}};border-radius:{{radius}};"></div>`,
    defaultProps: { maxWidth: '1200px', padding: '40px', bg: 'transparent', borderStyle: '1px dashed #313244', radius: '12px' } },

  { id: 'columns-3', name: '3 Columns', icon: '☰', category: 'content',
    html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:{{gap}};">
  <div style="background:{{colBg}};padding:{{padding}};border-radius:10px;border:1px solid {{border}};">
    <h4 style="margin:0 0 8px;color:{{titleColor}};font-size:15px;">{{col1Title}}</h4>
    <p style="margin:0;color:{{textColor}};font-size:13px;line-height:1.6;">{{col1Text}}</p>
  </div>
  <div style="background:{{colBg}};padding:{{padding}};border-radius:10px;border:1px solid {{border}};">
    <h4 style="margin:0 0 8px;color:{{titleColor}};font-size:15px;">{{col2Title}}</h4>
    <p style="margin:0;color:{{textColor}};font-size:13px;line-height:1.6;">{{col2Text}}</p>
  </div>
  <div style="background:{{colBg}};padding:{{padding}};border-radius:10px;border:1px solid {{border}};">
    <h4 style="margin:0 0 8px;color:{{titleColor}};font-size:15px;">{{col3Title}}</h4>
    <p style="margin:0;color:{{textColor}};font-size:13px;line-height:1.6;">{{col3Text}}</p>
  </div>
</div>`,
    defaultProps: { col1Title: 'Column 1', col1Text: 'First column content.', col2Title: 'Column 2', col2Text: 'Second column content.', col3Title: 'Column 3', col3Text: 'Third column content.', colBg: '#1e1e2e', border: '#313244', gap: '16px', padding: '20px', titleColor: '#f5f5f5', textColor: '#a6adc8' } },

  { id: 'user-image', name: 'Upload Image', icon: '📤', category: 'media',
    html: `<div style="max-width:{{maxWidth}};position:relative;">
  <img src="{{src}}" alt="{{alt}}" style="width:{{width}};height:{{height}};object-fit:{{objectFit}};border-radius:{{radius}};display:block;border:{{borderStyle}};" />
</div>`,
    defaultProps: { src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23181825%22 width=%22400%22 height=%22300%22 rx=%228%22/%3E%3Crect x=%22150%22 y=%2280%22 width=%22100%22 height=%22100%22 rx=%2212%22 fill=%22%23313244%22/%3E%3Cpath d=%22M185 115 L200 135 L215 120 L230 140 L170 140Z%22 fill=%22%23585b70%22/%3E%3Ccircle cx=%22190%22 cy=%22110%22 r=%228%22 fill=%22%23585b70%22/%3E%3Ctext x=%2250%25%22 y=%22220%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23585b70%22 font-family=%22Inter,sans-serif%22 font-size=%2213%22%3EUse Replace Image button%3C/text%3E%3C/svg%3E', alt: 'Uploaded image', width: '100%', height: 'auto', maxWidth: '100%', objectFit: 'cover', radius: '8px', borderStyle: 'none' } },
];

// ═══════════════════════════════════════════════════════════════════════
// PHASE 7 — COMPONENT SYSTEM (Figma-style)
// ═══════════════════════════════════════════════════════════════════════

import type { DSElement } from './ds-types';

// ─── Component Registry ──────────────────────────────────────────────

interface ComponentRegistryEntry {
  id: string;
  name: string;
  description: string;
  sourceElementId: string;
  variantProps?: Record<string, string[]>; // prop name → possible values
  created: number;
}

const componentRegistry = new Map<string, ComponentRegistryEntry>();

/** Create a component from an element (Ctrl+Alt+K) */
export function createComponent(el: DSElement): string {
  const compId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  el.isComponent = true;
  el.componentId = compId;
  componentRegistry.set(compId, {
    id: compId,
    name: el.name,
    description: el.componentDescription || '',
    sourceElementId: el.id,
    created: Date.now(),
  });
  return compId;
}

/** Create an instance of a component */
export function createInstance(
  mainEl: DSElement,
  x: number,
  y: number,
  generateId: () => string,
): DSElement {
  const instance: DSElement = JSON.parse(JSON.stringify(mainEl));
  instance.id = generateId();
  instance.x = x;
  instance.y = y;
  instance.isComponent = false;
  instance.instanceOf = mainEl.componentId;
  instance.overrides = {};
  instance.name = `${mainEl.name} (Instance)`;
  return instance;
}

/** Apply overrides from instance onto element props */
export function applyOverrides(instance: DSElement, overrides: Record<string, any>): void {
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split('.');
    let target: any = instance;
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] === undefined) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }
}

/** Reset all overrides on an instance */
export function resetOverrides(instance: DSElement): void {
  instance.overrides = {};
}

/** Detach instance — becomes independent group */
export function detachInstance(instance: DSElement): void {
  delete instance.instanceOf;
  delete instance.overrides;
  delete instance.componentId;
  instance.isComponent = false;
  instance.name = instance.name.replace(' (Instance)', '');
}

/** Update all instances when main component changes */
export function updateInstances(
  mainEl: DSElement,
  allElements: DSElement[],
): void {
  const compId = mainEl.componentId;
  if (!compId) return;
  for (const el of allElements) {
    if (el.instanceOf === compId && el.id !== mainEl.id) {
      const saved = {
        id: el.id, x: el.x, y: el.y, name: el.name,
        overrides: el.overrides, instanceOf: el.instanceOf,
      };
      Object.assign(el, JSON.parse(JSON.stringify(mainEl)));
      Object.assign(el, saved);
      el.isComponent = false;
      if (el.overrides) applyOverrides(el, el.overrides);
    }
  }
}

/** Get component entry */
export function getComponentEntry(compId: string): ComponentRegistryEntry | undefined {
  return componentRegistry.get(compId);
}

/** Navigate to main component (Ctrl+Click on instance icon) */
export function findMainComponent(compId: string, allElements: DSElement[]): DSElement | undefined {
  return allElements.find(el => el.componentId === compId && el.isComponent);
}

/** List all registered components */
export function listComponents(): ComponentRegistryEntry[] {
  return Array.from(componentRegistry.values());
}

/** Search components by name */
export function searchComponents(query: string): ComponentRegistryEntry[] {
  const q = query.toLowerCase();
  return listComponents().filter(c => c.name.toLowerCase().includes(q));
}

/** Set component description */
export function setComponentDescription(compId: string, desc: string): void {
  const entry = componentRegistry.get(compId);
  if (entry) entry.description = desc;
}

/** Set variant properties on a component */
export function setVariantProperties(compId: string, props: Record<string, string[]>): void {
  const entry = componentRegistry.get(compId);
  if (entry) entry.variantProps = props;
}

/** Check if element is a nested component */
export function isNestedComponent(el: DSElement, allElements: DSElement[]): boolean {
  if (!el.isComponent) return false;
  // Check if any parent (frame/group) is also a component
  return allElements.some(
    parent => parent.isComponent && parent.id !== el.id &&
    (parent as any).children?.some((c: any) => c.id === el.id)
  );
}

// ─── Named Design Styles ─────────────────────────────────────────────

export interface DesignStyle {
  id: string;
  name: string;       // supports "/" for categories: "Brand/Primary"
  type: 'color' | 'text' | 'effect' | 'grid';
  properties: Record<string, any>;
}

const styleRegistry = new Map<string, DesignStyle>();

/** Create a named style */
export function createStyle(
  name: string,
  type: DesignStyle['type'],
  properties: Record<string, any>,
): string {
  const id = `style-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  styleRegistry.set(id, { id, name, type, properties });
  return id;
}

/** Apply a named style to an element */
export function applyStyle(el: DSElement, styleId: string): void {
  const style = styleRegistry.get(styleId);
  if (!style) return;
  switch (style.type) {
    case 'color':
      el.colorStyleId = styleId;
      if (style.properties.fill) el.fill = { ...el.fill, ...style.properties.fill };
      break;
    case 'text':
      el.textStyleId = styleId;
      for (const [k, v] of Object.entries(style.properties)) (el as any)[k] = v;
      break;
    case 'effect':
      el.effectStyleId = styleId;
      if (style.properties.effects) (el as any).effects = style.properties.effects;
      break;
    case 'grid':
      // Grid styles apply to artboard layout grids
      break;
  }
}

/** Detach style — make local */
export function detachStyle(el: DSElement, type: DesignStyle['type']): void {
  switch (type) {
    case 'color': delete el.colorStyleId; break;
    case 'text': delete el.textStyleId; break;
    case 'effect': delete el.effectStyleId; break;
  }
}

/** Update all elements using a style */
export function updateStyleConsumers(styleId: string, allElements: DSElement[]): void {
  const style = styleRegistry.get(styleId);
  if (!style) return;
  for (const el of allElements) {
    const match =
      (style.type === 'color' && el.colorStyleId === styleId) ||
      (style.type === 'text' && el.textStyleId === styleId) ||
      (style.type === 'effect' && el.effectStyleId === styleId);
    if (match) applyStyle(el, styleId);
  }
}

/** Edit an existing style's properties */
export function editStyle(styleId: string, newProps: Record<string, any>): void {
  const style = styleRegistry.get(styleId);
  if (style) Object.assign(style.properties, newProps);
}

/** Get style by ID */
export function getStyle(id: string): DesignStyle | undefined {
  return styleRegistry.get(id);
}

/** List all styles, optionally filtered by type */
export function listStyles(type?: DesignStyle['type']): DesignStyle[] {
  const all = Array.from(styleRegistry.values());
  return type ? all.filter(s => s.type === type) : all;
}

/** Create a style from an existing element */
export function createStyleFromElement(name: string, type: DesignStyle['type'], el: DSElement): string {
  const props: Record<string, any> = {};
  switch (type) {
    case 'color': props.fill = { ...el.fill }; break;
    case 'text':
      props.fontFamily = el.fontFamily; props.fontSize = el.fontSize;
      props.fontWeight = el.fontWeight; props.letterSpacing = el.letterSpacing;
      props.lineHeight = el.lineHeight;
      break;
    case 'effect': props.effects = (el as any).effects ? [...(el as any).effects] : []; break;
  }
  return createStyle(name, type, props);
}

/** Style naming: uses "/" for categories */
export function getStyleCategories(type?: DesignStyle['type']): Map<string, DesignStyle[]> {
  const styles = listStyles(type);
  const cats = new Map<string, DesignStyle[]>();
  for (const s of styles) {
    const cat = s.name.includes('/') ? s.name.split('/')[0] : 'Uncategorized';
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat)!.push(s);
  }
  return cats;
}

// ─── Design Variables (Figma Variables) ──────────────────────────────

export interface DesignVariable {
  id: string;
  name: string;
  type: 'color' | 'number' | 'string' | 'boolean';
  collection: string;
  values: Record<string, any>;  // mode name → value
}

const variableRegistry = new Map<string, DesignVariable>();
let activeMode = 'Default';

/** Create a design variable */
export function createVariable(
  name: string,
  type: DesignVariable['type'],
  collection: string,
  values: Record<string, any>,
): string {
  const id = `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  variableRegistry.set(id, { id, name, type, collection, values });
  return id;
}

/** Get variable value for current or specified mode */
export function getVariableValue(varId: string, mode?: string): any {
  const v = variableRegistry.get(varId);
  const m = mode || activeMode;
  return v?.values[m] ?? v?.values[Object.keys(v!.values)[0]];
}

/** Set active variable mode */
export function setActiveMode(mode: string): void {
  activeMode = mode;
}

/** Get active variable mode */
export function getActiveMode(): string {
  return activeMode;
}

/** List all variables */
export function listVariables(collection?: string): DesignVariable[] {
  const all = Array.from(variableRegistry.values());
  return collection ? all.filter(v => v.collection === collection) : all;
}

/** List all collections */
export function listCollections(): string[] {
  const collections = new Set<string>();
  variableRegistry.forEach(v => collections.add(v.collection));
  return Array.from(collections);
}

/** List modes available across variables */
export function listModes(): string[] {
  const modes = new Set<string>();
  variableRegistry.forEach(v => {
    for (const m of Object.keys(v.values)) modes.add(m);
  });
  return Array.from(modes);
}

/** Bind a variable to an element property */
export function bindVariable(el: DSElement, propPath: string, varId: string, mode?: string): void {
  const value = getVariableValue(varId, mode);
  if (value === undefined) return;
  const parts = propPath.split('.');
  let target: any = el;
  for (let i = 0; i < parts.length - 1; i++) {
    if (target[parts[i]] === undefined) target[parts[i]] = {};
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
}

// ─── Assets Panel Renderer ──────────────────────────────────────────

/** Render the assets panel HTML for the sidebar */
export function renderAssetsPanel(searchQuery = ''): string {
  const comps = searchQuery ? searchComponents(searchQuery) : listComponents();
  const grouped = new Map<string, ComponentRegistryEntry[]>();

  for (const c of comps) {
    // Group by first segment of name (Category/Name)
    const cat = c.name.includes('/') ? c.name.split('/')[0] : 'Local';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(c);
  }

  let html = `<div class="nds-prop-section">
    <div class="nds-prop-title">Assets</div>
    <input type="text" id="nds-assets-search" placeholder="Search components…" value="${searchQuery}"
      class="nds-prop-input" style="width:100%;margin-bottom:8px;">`;

  if (comps.length === 0) {
    html += `<div style="color:#585b70;font-size:11px;text-align:center;padding:16px;">
      No components yet. Select an element and press Ctrl+Alt+K to create one.
    </div>`;
  }

  for (const [cat, items] of grouped) {
    html += `<div style="margin-top:6px;">
      <div style="font-size:9px;color:#6c7086;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${cat}</div>`;
    for (const item of items) {
      html += `<div class="nds-asset-item" data-comp-id="${item.id}"
        style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:4px;cursor:grab;font-size:11px;color:#cdd6f4;"
        draggable="true">
        <span style="color:#b4befe;">◆</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</span>
        <span style="color:#585b70;font-size:9px;">↗</span>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;

  // Styles section
  const colorStyles = listStyles('color');
  const textStyles = listStyles('text');
  const effectStyles = listStyles('effect');

  if (colorStyles.length + textStyles.length + effectStyles.length > 0) {
    html += `<div class="nds-prop-section">
      <div class="nds-prop-title">Styles</div>`;

    if (colorStyles.length > 0) {
      html += `<div style="font-size:9px;color:#6c7086;text-transform:uppercase;margin-bottom:2px;">Colors</div>`;
      for (const s of colorStyles) {
        const c = s.properties.fill?.color || '#6366f1';
        html += `<div class="nds-style-item" data-style-id="${s.id}" style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:11px;color:#cdd6f4;">
          <div style="width:14px;height:14px;border-radius:3px;background:${c};border:1px solid rgba(255,255,255,0.1);"></div>
          <span>${s.name}</span>
        </div>`;
      }
    }

    if (textStyles.length > 0) {
      html += `<div style="font-size:9px;color:#6c7086;text-transform:uppercase;margin:4px 0 2px;">Text</div>`;
      for (const s of textStyles) {
        html += `<div class="nds-style-item" data-style-id="${s.id}" style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:11px;color:#cdd6f4;">
          <span style="font-size:12px;color:#b4befe;">Aa</span>
          <span>${s.name}</span>
          <span style="color:#585b70;font-size:9px;">${s.properties.fontSize || ''}/${s.properties.fontWeight || ''}</span>
        </div>`;
      }
    }

    html += `</div>`;
  }

  // Variables section
  const collections = listCollections();
  if (collections.length > 0) {
    html += `<div class="nds-prop-section">
      <div class="nds-prop-title">Variables</div>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        ${listModes().map(m => `<button class="nds-prop-btn nds-var-mode" data-mode="${m}"
          style="font-size:9px;padding:2px 8px;${m === activeMode ? 'background:#6366f1;color:#fff;' : ''}">${m}</button>`).join('')}
      </div>`;
    for (const col of collections) {
      html += `<div style="font-size:9px;color:#6c7086;text-transform:uppercase;margin-bottom:2px;">${col}</div>`;
      for (const v of listVariables(col)) {
        const val = getVariableValue(v.id);
        const preview = v.type === 'color'
          ? `<div style="width:12px;height:12px;border-radius:2px;background:${val};border:1px solid rgba(255,255,255,0.1);"></div>`
          : `<span style="color:#585b70;font-size:9px;">${val}</span>`;
        html += `<div class="nds-var-item" data-var-id="${v.id}" style="display:flex;align-items:center;gap:6px;padding:3px 6px;font-size:11px;color:#cdd6f4;">
          ${preview}
          <span style="flex:1;">${v.name}</span>
          <span style="color:#585b70;font-size:9px;">${v.type}</span>
        </div>`;
      }
    }
    html += `</div>`;
  }

  return html;
}
