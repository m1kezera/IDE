/**
 * Design Studio — Asset Manager
 * Manages uploaded images and videos for reuse across the design.
 */

export interface DSAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'icon';
  dataUrl: string;
  thumbnailUrl: string;
  size: string; // human-readable
  addedAt: number;
}

let assets: DSAsset[] = [];

/** Add an asset to the library */
export function addAsset(name: string, dataUrl: string, type: 'image' | 'video' = 'image'): DSAsset {
  const existing = assets.find(a => a.name === name);
  if (existing) return existing;

  const asset: DSAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    type,
    dataUrl,
    thumbnailUrl: type === 'video' ? '' : dataUrl,
    size: formatSize(dataUrl.length * 0.75), // approximate base64 decoded size
    addedAt: Date.now(),
  };
  assets.push(asset);
  return asset;
}

/** Get all assets */
export function getAssets(): DSAsset[] { return assets; }

/** Get assets by type */
export function getAssetsByType(type: 'image' | 'video' | 'icon'): DSAsset[] {
  return assets.filter(a => a.type === type);
}

/** Remove an asset */
export function removeAsset(id: string): void {
  assets = assets.filter(a => a.id !== id);
}

/** Search assets by name */
export function searchAssets(query: string): DSAsset[] {
  const q = query.toLowerCase();
  return assets.filter(a => a.name.toLowerCase().includes(q));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Scan artboards for existing image/video data URLs and auto-register them */
export function scanArtboardsForAssets(artboards: any[]): void {
  for (const ab of artboards) {
    for (const el of ab.elements || []) {
      for (const [key, val] of Object.entries(el.props || {})) {
        if (typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('data:video'))) {
          addAsset(`${el.componentId}-${key}`, val, val.startsWith('data:video') ? 'video' : 'image');
        }
      }
    }
  }
}

// ─── Asset Panel Renderer ───────────────────────────────────────────

export function renderAssetPanel(onInsert: (dataUrl: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:8px;';

  // Upload button
  const uploadRow = document.createElement('div');
  uploadRow.style.cssText = 'display:flex;gap:4px;';
  uploadRow.innerHTML = `
    <button class="ds-project-btn" id="ds-asset-upload-img" style="flex:1;font-size:10px;">📤 Upload Image</button>
    <button class="ds-project-btn" id="ds-asset-upload-vid" style="flex:1;font-size:10px;">🎬 Upload Video</button>`;
  container.appendChild(uploadRow);

  // Search
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = '🔍 Search assets...';
  search.style.cssText = 'width:100%;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:6px;padding:6px 10px;font-size:11px;box-sizing:border-box;';
  container.appendChild(search);

  // Filter tabs
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:4px;';
  let activeFilter = 'all';
  const filters = ['all', 'image', 'video'];
  for (const f of filters) {
    const btn = document.createElement('button');
    btn.textContent = f === 'all' ? 'All' : f === 'image' ? '🖼️ Images' : '🎬 Videos';
    btn.style.cssText = `padding:3px 8px;border-radius:10px;border:1px solid ${f === activeFilter ? '#7c3aed' : '#313244'};background:${f === activeFilter ? 'rgba(124,58,237,0.15)' : 'transparent'};color:${f === activeFilter ? '#7c3aed' : '#585b70'};font-size:9px;cursor:pointer;`;
    btn.addEventListener('click', () => { activeFilter = f; renderGrid(); });
    tabs.appendChild(btn);
  }
  container.appendChild(tabs);

  // Asset grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;overflow-y:auto;max-height:calc(100vh - 300px);';
  container.appendChild(grid);

  function renderGrid() {
    grid.innerHTML = '';
    let filtered = activeFilter === 'all' ? getAssets() : getAssetsByType(activeFilter as any);
    const q = search.value.trim();
    if (q) filtered = filtered.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#585b70;font-size:11px;">No assets yet.<br>Upload images or videos to get started.</div>';
      return;
    }

    for (const asset of filtered) {
      const card = document.createElement('div');
      card.style.cssText = 'background:#11111b;border:1px solid #313244;border-radius:8px;overflow:hidden;cursor:pointer;transition:all 0.15s;';
      card.innerHTML = `
        <div style="height:60px;background:url('${asset.thumbnailUrl}') center/cover no-repeat, #0d0d15;"></div>
        <div style="padding:6px;">
          <div style="font-size:9px;color:#cdd6f4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asset.name}</div>
          <div style="font-size:8px;color:#585b70;">${asset.size} · ${asset.type}</div>
        </div>`;
      card.addEventListener('mouseenter', () => { card.style.borderColor = '#7c3aed'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = '#313244'; });
      card.addEventListener('click', () => onInsert(asset.dataUrl));
      grid.appendChild(card);
    }
  }

  search.addEventListener('input', () => renderGrid());
  renderGrid();

  // Wire upload buttons
  const imgBtn = uploadRow.querySelector('#ds-asset-upload-img');
  const vidBtn = uploadRow.querySelector('#ds-asset-upload-vid');

  imgBtn?.addEventListener('click', async () => {
    const eAPI = (window as any).electronAPI;
    if (eAPI?.selectImage) {
      const result = await eAPI.selectImage();
      if (result?.dataUrl) {
        addAsset(result.name || 'image', result.dataUrl, 'image');
        renderGrid();
      }
    } else {
      // Browser fallback
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => {
        const file = inp.files?.[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = () => {
          addAsset(file.name, r.result as string, 'image');
          renderGrid();
        };
        r.readAsDataURL(file);
      };
      inp.click();
    }
  });

  vidBtn?.addEventListener('click', async () => {
    const eAPI = (window as any).electronAPI;
    if (eAPI?.selectVideo) {
      const result = await eAPI.selectVideo();
      if (result?.dataUrl) {
        addAsset(result.name || 'video', result.dataUrl, 'video');
        renderGrid();
      }
    } else {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'video/*';
      inp.onchange = () => {
        const file = inp.files?.[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = () => {
          addAsset(file.name, r.result as string, 'video');
          renderGrid();
        };
        r.readAsDataURL(file);
      };
      inp.click();
    }
  });

  return container;
}
