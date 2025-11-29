const API_BASE = (() => {
  const metaBase = document.querySelector('meta[name="movieku-api-base"]')?.content?.trim()
  if (metaBase) return metaBase.replace(/\/$/, '')

  // Ketika file HTML dibuka langsung (origin "null"), fallback ke host default Adonis
  if (window.location.origin === 'null') return 'http://localhost:3333'

  // Default: same origin (kosong berarti relative)
  return ''
})()

function normalizePath(path) {
  if (path.startsWith('http')) return path

  const prefixed = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`
  return prefixed
}

function buildUrl(path) {
  const normalizedBase = API_BASE.replace(/\/$/, '')
  const normalizedPath = normalizePath(path)

  if (!normalizedBase) return normalizedPath

  // Hindari duplikasi prefix ketika path sudah memuat base
  if (normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath
  }

  return `${normalizedBase}${normalizedPath}`
}

export function getToken() {
  return localStorage.getItem('movieku_token');
}

export function setToken(token) {
  localStorage.setItem('movieku_token', token);
}

export function clearToken() {
  localStorage.removeItem('movieku_token');
}

export async function fetchJSON(path, options = {}) {
  const url = buildUrl(path)
  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan dan tidak diblokir CORS atau jaringan.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || res.statusText)
  }
  return data
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ensureAuth(statusEl) {
  if (!getToken()) {
    statusEl.textContent = 'Token tidak ditemukan. Silakan login terlebih dahulu.';
    statusEl.className = 'status';
    return false;
  }
  return true;
}

export function renderMovieDetail(container, movie) {
  if (!movie) {
    container.innerHTML = '<p class="muted">Belum ada data ditampilkan.</p>';
    return;
  }
  const genres = (movie.genres || []).join(', ');
  container.innerHTML = `
    <div class="detail-panel">
      <div class="movie-header">
        <div>
          <strong>${movie.title || 'Tanpa judul'}</strong><br />
          <span class="muted">${movie.release_date || 'Tanggal tidak ada'}</span>
        </div>
        <span class="badge">⭐ ${movie.rating ?? '-'} • ${movie.duration || '-'} menit</span>
      </div>
      <p>${movie.description || 'Tidak ada deskripsi'}</p>
      <div class="chips"><span class="badge">Genre: ${genres || '-'}</span></div>
      <p class="muted">Director: ${movie.director || '-'} | Cast: ${(movie.cast || []).join(', ') || '-'}</p>
      <p class="muted">TMDb ID: ${movie.tmdb_id || '-'} | Trailer: ${movie.trailer_id || '-'}</p>
    </div>
  `;
}

export function renderMoviesList(container, movies = [], onSelect) {
  if (!movies.length) {
    container.innerHTML = '<p class="muted">Tidak ada hasil.</p>';
    return;
  }
  container.innerHTML = movies
    .map(
      (m) => `
      <article class="movie-card">
        <div class="movie-header">
          <div>
            <strong>${m.title}</strong><br />
            <span class="muted">${m.release_date || '-'} • ${m.duration || '-'} menit</span>
          </div>
          <span class="badge">⭐ ${m.rating ?? '-'}</span>
        </div>
        <p>${m.description || 'Tidak ada deskripsi'}</p>
        <div class="chips">
          ${(m.genres || []).map((g) => `<span class="badge">${g}</span>`).join('')}
        </div>
        <button class="inline" data-id="${m.id}">Lihat detail</button>
      </article>
    `
    )
    .join('');
  if (onSelect) {
    container.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => onSelect(btn.dataset.id));
    });
  }
}

export function statusSuccess(el, msg) {
  el.textContent = msg;
  el.className = 'alert success';
}

export function statusError(el, msg) {
  el.textContent = msg;
  el.className = 'alert error';
}

export function statusInfo(el, msg) {
  el.textContent = msg;
  el.className = 'status';
}

export async function checkBackend(statusEl) {
  const baseInfo = API_BASE || window.location.origin
  statusEl.textContent = `Memeriksa koneksi ke backend (${baseInfo || 'relative origin'})...`
  statusEl.className = 'status'

  try {
    await fetchJSON('/api/movies?limit=1')
    statusSuccess(statusEl, 'Backend terhubung dan siap dipakai.')
  } catch (err) {
    statusError(statusEl, `Backend tidak dapat dihubungi: ${err.message}`)
  }
}

export { API_BASE }
