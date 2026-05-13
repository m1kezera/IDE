/**
 * Lumina IDE — Music Panel (v2.2)
 * Lo-fi radio + Spotify Now Playing + YouTube Music embed.
 * Fixes: YT iframe preserved on panel toggle, taller embed, volume label.
 */

import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

interface Station { name: string; icon: string; url: string; color: string; }

const STATIONS: Station[] = [
  { name: 'Lofi Hip Hop',  icon: '🎧', url: 'https://play.streamafrica.net/lofiradio', color: '#a6e3a1' },
  { name: 'Chillhop',      icon: '☕', url: 'https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/', color: '#89b4fa' },
  { name: 'Jazz Radio',    icon: '🎷', url: 'https://jazz-wr04.ice.infomaniak.ch/jazz-wr04-128.mp3', color: '#f9e2af' },
  { name: 'Ambient',       icon: '🌙', url: 'https://ice5.somafm.com/dronezone-128-mp3', color: '#cba6f7' },
  { name: 'Deep House',    icon: '🎶', url: 'https://ice2.somafm.com/groovesalad-128-mp3', color: '#f38ba8' },
  { name: 'Classical',     icon: '🎻', url: 'https://ycradio.stream.publicradio.org/ycradio.mp3', color: '#fab387' },
];

let audio: HTMLAudioElement | null = null;
let currentStation: Station | null = null;
let isPlaying = false;
let volume = 0.5;

const SPOTIFY_SCOPES = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
let spotifyToken: string | null = null;
let spotifyNow: { track: string; artist: string; art: string; isPlaying: boolean } | null = null;
let spotifyPoll: ReturnType<typeof setInterval> | null = null;

let ytUrl: string = localStorage.getItem('lumina_ytmusic_url') || '';
let ytIframeNode: HTMLIFrameElement | null = null; // Preserve across re-renders
let ytVolume = 50; // 0-100, separate from radio volume

function toYTEmbed(url: string): string {
  const list = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const vid = url.match(/[?&]v=([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (list) return 'https://www.youtube.com/embed/videoseries?list=' + list[1] + '&autoplay=1&enablejsapi=1';
  if (vid) return 'https://www.youtube.com/embed/' + vid[1] + '?autoplay=1&enablejsapi=1';
  return url;
}

export function initMusicPanel(): void {
  // Only create Audio + register events on first init
  if (!audio) {
    audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';

    checkSpotifyCallback();
    const saved = localStorage.getItem('lumina_spotify_token');
    if (saved) { spotifyToken = saved; startSpotifyPoll(); }

    PubSub.on('panel:toggle', (id) => {
      if (id === 'music') updateRadioUI();
    });
  }

  renderPanel();
  renderMiniPlayer();
}

// Only update the radio/spotify sections without touching YT iframe
function updateRadioUI(): void {
  const p = document.getElementById('projecty-panel-music');
  if (!p) return;
  // Update play/pause button text
  const pp = p.querySelector('#m-pp') as HTMLButtonElement;
  if (pp) {
    pp.textContent = isPlaying ? `⏸ ${t('music.pause_radio')}` : `▶ ${t('music.play_radio')}`;
    pp.style.background = isPlaying ? 'var(--accent-red,#f38ba8)' : 'var(--accent-green,#a6e3a1)';
    pp.style.color = isPlaying ? '#fff' : '#000';
  }
  // Update station highlights
  p.querySelectorAll('.ms').forEach((el) => {
    const i = parseInt((el as HTMLElement).dataset.i || '-1');
    const s = STATIONS[i];
    if (!s) return;
    const active = currentStation === s;
    (el as HTMLElement).style.background = active ? 'rgba(255,255,255,0.07)' : 'transparent';
    (el as HTMLElement).style.borderLeft = '2px solid ' + (active ? s.color : 'transparent');
    const note = (el as HTMLElement).querySelector('.ms-note');
    if (note) note.textContent = (active && isPlaying) ? '♪' : '';
  });
}

function renderPanel(): void {
  const p = document.getElementById('projecty-panel-music');
  if (!p) return;

  // Save YT iframe before clearing
  const existingIframe = p.querySelector('#yt-iframe') as HTMLIFrameElement;
  if (existingIframe) {
    ytIframeNode = existingIframe;
    existingIframe.remove(); // detach from DOM but keep in memory
  }

  const stationsHtml = STATIONS.map((s, i) => {
    const active = currentStation === s;
    return '<div class="ms" data-i="' + i + '" style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-radius:4px;margin-bottom:2px;background:' + (active ? 'rgba(255,255,255,0.07)' : 'transparent') + ';border-left:2px solid ' + (active ? s.color : 'transparent') + ';">'
      + '<span style="font-size:14px;">' + s.icon + '</span>'
      + '<span style="flex:1;font-size:11px;color:var(--text);' + (active ? 'font-weight:600' : '') + ';">' + s.name + '</span>'
      + '<span class="ms-note" style="font-size:9px;color:' + s.color + ';">' + ((active && isPlaying) ? '♪' : '') + '</span>'
      + '</div>';
  }).join('');

  // Spotify section
  let spHtml = '';
  if (spotifyToken) {
    spHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
      + '<span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;"><span style="color:#1DB954;">●</span> Spotify ' + t('music.connected') + '</span>'
      + '<button id="sp-dc" style="background:none;border:none;color:#f38ba8;cursor:pointer;font-size:9px;opacity:0.7;">✕ ' + t('music.disconnect') + '</button></div>';
    if (spotifyNow) {
      spHtml += '<div style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(29,185,84,0.06);border-radius:8px;border:1px solid rgba(29,185,84,0.12);margin-bottom:8px;'
        + (spotifyNow.isPlaying ? 'box-shadow:0 0 12px rgba(29,185,84,0.08);' : '') + '">'
        + (spotifyNow.art ? '<img src="' + spotifyNow.art + '" style="width:44px;height:44px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);" />' : '<div style="width:44px;height:44px;border-radius:6px;background:rgba(29,185,84,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;">🎵</div>')
        + '<div style="flex:1;overflow:hidden;">'
        + '<div style="font-size:12px;color:var(--text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + spotifyNow.track + '</div>'
        + '<div style="font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;">' + spotifyNow.artist + '</div>'
        + (spotifyNow.isPlaying ? '<div style="font-size:8px;color:#1DB954;margin-top:2px;">♪ ' + t('music.playing_now') + '</div>' : '<div style="font-size:8px;color:var(--text-muted);margin-top:2px;">⏸ ' + t('music.paused') + '</div>')
        + '</div></div>'
        + '<div style="display:flex;gap:4px;margin-bottom:4px;">'
        + '<button id="sp-prev" style="flex:1;padding:6px;border:none;border-radius:4px;background:rgba(29,185,84,0.1);color:#1DB954;cursor:pointer;font-size:12px;transition:background 0.2s;">⏮</button>'
        + '<button id="sp-tog" style="flex:2;padding:6px;border:none;border-radius:4px;background:#1DB954;color:#000;cursor:pointer;font-size:13px;font-weight:bold;transition:transform 0.1s;">' + (spotifyNow.isPlaying ? '⏸' : '▶') + '</button>'
        + '<button id="sp-next" style="flex:1;padding:6px;border:none;border-radius:4px;background:rgba(29,185,84,0.1);color:#1DB954;cursor:pointer;font-size:12px;transition:background 0.2s;">⏭</button></div>';
    } else {
      spHtml += '<div style="text-align:center;color:var(--text-muted);font-size:10px;padding:12px 6px;background:rgba(29,185,84,0.04);border-radius:6px;border:1px dashed rgba(29,185,84,0.15);"><div style="font-size:18px;margin-bottom:4px;">🎧</div>' + t('music.no_music') + '<br/><span style="font-size:8px;">' + t('music.open_spotify') + '</span></div>';
    }
  } else {
    spHtml = '<span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;"><span style="color:#1DB954;">●</span> Spotify</span>'
      + '<div style="display:flex;gap:4px;margin-bottom:4px;">'
      + '<input id="sp-cid" type="text" placeholder="Spotify Client ID" value="' + (localStorage.getItem('lumina_spotify_client_id') || '') + '" style="flex:1;padding:4px 6px;background:var(--bg-overlay);border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:10px;outline:none;" />'
      + '<button id="sp-conn" style="padding:4px 8px;border:none;border-radius:3px;background:#1DB954;color:#fff;cursor:pointer;font-size:10px;font-weight:bold;">' + t('music.connect') + '</button></div>'
      + '<a href="https://developer.spotify.com/dashboard" target="_blank" style="font-size:8px;color:var(--text-muted);text-decoration:underline;">' + t('music.create_id') + '</a>';
  }

  // YT section
  const ytHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;margin-bottom:6px;">'
    + '<span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;"><span style="color:#FF0000;">▶</span> YouTube Music</span>'
    + (ytUrl ? '<button id="yt-clear" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:9px;">✕ ' + t('music.yt_clear') + '</button>' : '')
    + '</div>'
    + '<div style="display:flex;gap:3px;margin-bottom:6px;">'
    + '<input id="yt-url" type="text" placeholder="' + t('music.yt_paste') + '" value="' + ytUrl + '" style="flex:1;padding:4px 6px;background:var(--bg-overlay);border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:10px;outline:none;" />'
    + '<button id="yt-go" style="padding:4px 8px;border:none;border-radius:3px;background:#FF0000;color:#fff;cursor:pointer;font-size:10px;font-weight:bold;">▶</button></div>'
    + '<div id="yt-embed" style="border-radius:6px;overflow:hidden;"></div>'
    + '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;"><span style="font-size:9px;color:var(--text-muted);">🔊 Vol</span><input type="range" id="yt-vol" min="0" max="100" value="' + ytVolume + '" style="flex:1;height:3px;appearance:none;background:var(--border);border-radius:2px;outline:none;cursor:pointer;" /><span id="yt-vol-l" style="font-size:9px;color:var(--text-muted);min-width:24px;text-align:right;">' + ytVolume + '%</span></div>';

  p.innerHTML = '<div class="panel-header">' + t('music.header') + '</div>'
    + '<div style="padding:6px 10px;font-size:12px;">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'
    + '<span style="font-size:10px;color:var(--text-muted);">🔊 ' + t('music.radio') + '</span>'
    + '<input type="range" id="m-vol" min="0" max="100" value="' + Math.round(volume * 100) + '" style="flex:1;height:3px;appearance:none;background:var(--border);border-radius:2px;outline:none;cursor:pointer;" />'
    + '<span id="m-vol-l" style="font-size:9px;color:var(--text-muted);min-width:24px;text-align:right;">' + Math.round(volume * 100) + '%</span></div>'
    + '<button id="m-pp" style="width:100%;padding:5px;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:bold;margin-bottom:8px;background:' + (isPlaying ? 'var(--accent-red,#f38ba8)' : 'var(--accent-green,#a6e3a1)') + ';color:' + (isPlaying ? '#fff' : '#000') + ';">' + (isPlaying ? '⏸ ' + t('music.pause_radio') : '▶ ' + t('music.play_radio')) + '</button>'
    + '<div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">' + t('music.stations') + '</div>'
    + stationsHtml
    + '<div style="height:1px;background:var(--border);margin:10px 0;"></div>'
    + spHtml
    + '<div style="height:1px;background:var(--border);margin:6px 0;"></div>'
    + ytHtml
    + '</div>'
    + '<style>.ms:hover{background:rgba(255,255,255,0.04)!important}#m-vol::-webkit-slider-thumb{appearance:none;width:10px;height:10px;border-radius:50%;background:var(--accent);cursor:pointer}</style>';

  // Re-attach preserved YT iframe
  const embedDiv = document.getElementById('yt-embed');
  if (embedDiv && ytIframeNode) {
    embedDiv.appendChild(ytIframeNode);
  } else if (embedDiv && ytUrl && !ytIframeNode) {
    // First render with saved URL
    const iframe = document.createElement('iframe');
    iframe.id = 'yt-iframe';
    iframe.src = toYTEmbed(ytUrl);
    iframe.style.cssText = 'width:100%;height:220px;border:none;border-radius:6px;';
    iframe.allow = 'autoplay;encrypted-media';
    iframe.allowFullscreen = true;
    embedDiv.appendChild(iframe);
    ytIframeNode = iframe;
  }

  // Wire events
  p.querySelectorAll('.ms').forEach(el => {
    el.addEventListener('click', () => playStation(STATIONS[parseInt((el as HTMLElement).dataset.i || '0')]));
  });
  p.querySelector('#m-pp')?.addEventListener('click', toggleRadio);

  const vol = p.querySelector('#m-vol') as HTMLInputElement;
  vol?.addEventListener('input', () => {
    volume = parseInt(vol.value) / 100;
    if (audio) audio.volume = volume;
    const l = document.getElementById('m-vol-l');
    if (l) l.textContent = Math.round(volume * 100) + '%';
  });

  p.querySelector('#sp-conn')?.addEventListener('click', connectSpotify);
  p.querySelector('#sp-dc')?.addEventListener('click', disconnectSpotify);
  p.querySelector('#sp-prev')?.addEventListener('click', () => spotifyCmd('previous'));
  p.querySelector('#sp-tog')?.addEventListener('click', () => spotifyCmd('toggle'));
  p.querySelector('#sp-next')?.addEventListener('click', () => spotifyCmd('next'));

  p.querySelector('#yt-go')?.addEventListener('click', () => {
    const inp = document.getElementById('yt-url') as HTMLInputElement;
    if (inp?.value.trim()) {
      ytUrl = inp.value.trim();
      localStorage.setItem('lumina_ytmusic_url', ytUrl);
      const emb = document.getElementById('yt-embed');
      if (emb) {
        const iframe = document.createElement('iframe');
        iframe.id = 'yt-iframe';
        iframe.src = toYTEmbed(ytUrl);
        iframe.style.cssText = 'width:100%;height:220px;border:none;border-radius:6px;';
        iframe.allow = 'autoplay;encrypted-media';
        iframe.allowFullscreen = true;
        emb.innerHTML = '';
        emb.appendChild(iframe);
        ytIframeNode = iframe;
      }
    }
  });

  p.querySelector('#yt-clear')?.addEventListener('click', () => {
    ytUrl = '';
    ytIframeNode = null;
    localStorage.removeItem('lumina_ytmusic_url');
    renderPanel();
  });

  // External YT volume slider
  const ytVol = p.querySelector('#yt-vol') as HTMLInputElement;
  ytVol?.addEventListener('input', () => {
    ytVolume = parseInt(ytVol.value);
    const l = document.getElementById('yt-vol-l');
    if (l) l.textContent = ytVolume + '%';
    // Send volume command to YT iframe via postMessage
    if (ytIframeNode && ytIframeNode.contentWindow) {
      ytIframeNode.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [ytVolume]
      }), '*');
    }
  });
}

// Radio controls
function playStation(s: Station): void {
  if (!audio) return;
  currentStation = s;
  audio.src = s.url;
  audio.play().then(() => { isPlaying = true; updateRadioUI(); updateMini(); })
    .catch(() => { isPlaying = false; updateRadioUI(); updateMini(); });
}

function toggleRadio(): void {
  if (!audio) return;
  if (isPlaying) { audio.pause(); isPlaying = false; }
  else if (currentStation) { audio.play().catch(() => {}); isPlaying = true; }
  else { playStation(STATIONS[0]); return; }
  updateRadioUI(); updateMini();
}

// Spotify
function connectSpotify(): void {
  const inp = document.getElementById('sp-cid') as HTMLInputElement;
  const cid = inp?.value.trim();
  if (!cid) { alert('Cole seu Spotify Client ID!\n\nhttps://developer.spotify.com/dashboard'); return; }
  localStorage.setItem('lumina_spotify_client_id', cid);
  const redir = window.location.origin + window.location.pathname;
  window.open('https://accounts.spotify.com/authorize?client_id=' + cid + '&response_type=token&redirect_uri=' + encodeURIComponent(redir) + '&scope=' + encodeURIComponent(SPOTIFY_SCOPES) + '&show_dialog=true', '_blank', 'width=500,height=700');
}

function checkSpotifyCallback(): void {
  const h = window.location.hash;
  if (h.includes('access_token=')) {
    const t = new URLSearchParams(h.substring(1)).get('access_token');
    if (t) { spotifyToken = t; localStorage.setItem('lumina_spotify_token', t); window.location.hash = ''; startSpotifyPoll(); }
  }
}

function disconnectSpotify(): void {
  spotifyToken = null; spotifyNow = null;
  localStorage.removeItem('lumina_spotify_token');
  if (spotifyPoll) clearInterval(spotifyPoll);
  renderPanel(); updateMini();
}

function startSpotifyPoll(): void {
  if (spotifyPoll) clearInterval(spotifyPoll);
  pollSpotify();
  spotifyPoll = setInterval(pollSpotify, 5000);
}

async function pollSpotify(): Promise<void> {
  if (!spotifyToken) return;
  try {
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + spotifyToken }
    });
    if (r.status === 401) { disconnectSpotify(); return; }
    if (r.status === 204 || !r.ok) { spotifyNow = null; renderPanel(); updateMini(); return; }
    const d = await r.json();
    if (d.item) {
      spotifyNow = {
        track: d.item.name || '?',
        artist: d.item.artists?.map((a: any) => a.name).join(', ') || '?',
        art: d.item.album?.images?.[2]?.url || d.item.album?.images?.[0]?.url || '',
        isPlaying: d.is_playing || false,
      };
    } else { spotifyNow = null; }
    renderPanel(); updateMini();
  } catch (err) { console.warn('[Music] Spotify poll failed:', err); }
}

async function spotifyCmd(action: 'previous' | 'next' | 'toggle'): Promise<void> {
  if (!spotifyToken) return;
  try {
    if (action === 'toggle') {
      await fetch('https://api.spotify.com/v1/me/player/' + (spotifyNow?.isPlaying ? 'pause' : 'play'), {
        method: 'PUT', headers: { 'Authorization': 'Bearer ' + spotifyToken }
      });
    } else {
      await fetch('https://api.spotify.com/v1/me/player/' + action, {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + spotifyToken }
      });
    }
    setTimeout(pollSpotify, 500);
  } catch (err) { console.warn('[Music] Spotify command failed:', err); }
}

// Mini Player — disabled per user request
function renderMiniPlayer(): void { /* no-op */ }
function updateMini(): void { /* no-op */ }
