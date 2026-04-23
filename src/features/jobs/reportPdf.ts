import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { statusToneFor } from '../../components/jobStatus';
import { colors } from '../../design/palette';
import { formatJobId } from '../../utils/formatId';
import { formatIdle } from '../../utils/idle';
import type { JobDetail, PhotoWithUrl } from './jobsApi';

export async function generateAndShareReport(detail: JobDetail): Promise<void> {
  const html = buildReportHtml(detail);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const filename = buildFilename(detail);
  let shareUri = uri;
  try {
    const tmp = new File(uri);
    const named = new File(Paths.cache, filename);
    if (named.exists) named.delete();
    tmp.move(named);
    shareUri = named.uri;
  } catch {
    // Rename is cosmetic — if it fails, fall back to the temp uri.
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Share ${filename}`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

function buildFilename(detail: JobDetail): string {
  const slug = detail.job.machine
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'job';
  return `MendLog-Job-${formatJobId(detail.job.id)}-${slug}.pdf`;
}

export function buildReportHtml(detail: JobDetail): string {
  const { job, photos } = detail;
  const tone = statusToneFor(job.status);

  const generatedAt = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const details: [string, string][] = [
    ['Department', job.dept || '—'],
    ['Machine', job.machine || '—'],
    ['Inventory', job.inv || '—'],
    ['Status', tone.label],
    ['Reported', `${formatDate(job.date)} · ${job.time}`],
    ['Completed', job.completedAt ? formatDateTime(job.completedAt) : '—'],
    ['Idle time', formatIdle(job.idleMinutes)],
    ['Language', job.lang === 'si' ? 'Sinhala' : 'English'],
  ];

  const photosBlock =
    photos.length > 0
      ? `
      <section class="section">
        <div class="section-label">Photos · ${photos.length}</div>
        <div class="photo-grid">
          ${photos.map(renderPhoto).join('')}
        </div>
      </section>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(`MendLog Job #${formatJobId(job.id)}`)}</title>
  <style>${styles(tone.bg, tone.fg)}</style>
</head>
<body>
  <header class="top">
    <div class="brand">
      <div class="brand-mark">MENDLOG</div>
      <div class="brand-sub">Maintenance Report</div>
    </div>
    <div class="top-meta">
      <div class="top-meta-label">Generated</div>
      <div class="top-meta-value">${escapeHtml(generatedAt)}</div>
    </div>
  </header>

  <section class="title-block">
    <div class="title-row">
      <span class="job-id">JOB #${formatJobId(job.id)}</span>
      <span class="pill">${escapeHtml(tone.label)}</span>
    </div>
    <h1 class="title">${escapeHtml(job.machine || 'Untitled job')}</h1>
    <div class="title-meta">${escapeHtml(job.dept || '—')} · ${escapeHtml(formatDate(job.date))} · ${escapeHtml(job.time)}</div>
  </section>

  <section class="section">
    <div class="section-label">Details</div>
    <div class="details-grid">
      ${details.map(([k, v]) => `
        <div class="detail">
          <div class="detail-label">${escapeHtml(k)}</div>
          <div class="detail-value">${escapeHtml(v)}</div>
        </div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="section-label">Failure &amp; fix</div>
    ${longCard('Description of failure', job.desc)}
    ${longCard('Root cause', job.rootCause)}
    ${longCard('Corrective action', job.action)}
    ${longCard('Remarks', job.remarks)}
  </section>

  ${photosBlock}

  <footer class="bottom">
    <span>MendLog · Job #${formatJobId(job.id)}</span>
    <span>${escapeHtml(generatedAt)}</span>
  </footer>
</body>
</html>`;
}

function renderPhoto(photo: PhotoWithUrl): string {
  if (!photo.signed_url) return '';
  const caption = photo.ai_description?.trim();
  const tags = (photo.ai_tags ?? []).slice(0, 4);
  return `
    <figure class="photo-cell">
      <img class="photo-img" src="${escapeAttr(photo.signed_url)}" />
      ${caption ? `<figcaption class="photo-caption">${escapeHtml(caption)}</figcaption>` : ''}
      ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    </figure>`;
}

function longCard(label: string, value: string): string {
  const text = (value ?? '').trim() || '—';
  return `
    <div class="long-card">
      <div class="long-label">${escapeHtml(label)}</div>
      <div class="long-value">${escapeHtml(text)}</div>
    </div>`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function styles(pillBg: string, pillFg: string): string {
  return `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${colors.bg};
      color: ${colors.text};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11.5pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 0 32pt 60pt;
    }
    .top {
      background: ${colors.navy};
      color: #fff;
      padding: 22pt 32pt;
      margin: 0 -32pt 22pt;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 4pt solid ${colors.yellow};
    }
    .brand-mark {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: 3pt;
    }
    .brand-sub {
      font-size: 9.5pt;
      color: rgba(255,255,255,0.72);
      letter-spacing: 1.2pt;
      text-transform: uppercase;
      margin-top: 3pt;
    }
    .top-meta {
      text-align: right;
    }
    .top-meta-label {
      font-size: 8pt;
      color: rgba(255,255,255,0.6);
      letter-spacing: 1pt;
      text-transform: uppercase;
    }
    .top-meta-value {
      font-size: 10pt;
      color: #fff;
      margin-top: 2pt;
    }

    .title-block {
      padding: 6pt 0 14pt;
      border-bottom: 1pt solid ${colors.line};
      margin-bottom: 18pt;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 10pt;
      margin-bottom: 6pt;
    }
    .job-id {
      font-family: 'SFMono-Regular', ui-monospace, 'Menlo', 'Consolas', monospace;
      font-size: 9pt;
      color: ${colors.mute};
      letter-spacing: 1pt;
    }
    .pill {
      display: inline-block;
      padding: 3pt 9pt;
      border-radius: 999pt;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.3pt;
      background: ${pillBg};
      color: ${pillFg};
    }
    .title {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.4pt;
      color: ${colors.text};
      margin: 0 0 4pt;
    }
    .title-meta {
      color: ${colors.mute};
      font-size: 10.5pt;
    }

    .section {
      margin-bottom: 18pt;
      page-break-inside: avoid;
    }
    .section-label {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 1.4pt;
      text-transform: uppercase;
      color: ${colors.muteDeep};
      margin-bottom: 8pt;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border: 1pt solid ${colors.line};
      border-radius: 10pt;
      background: ${colors.surface};
      overflow: hidden;
    }
    .detail {
      padding: 10pt 12pt;
      border-bottom: 1pt solid ${colors.lineSoft};
    }
    .detail:nth-child(odd) {
      border-right: 1pt solid ${colors.lineSoft};
    }
    .detail:nth-last-child(-n+2) {
      border-bottom: none;
    }
    .detail-label {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.8pt;
      text-transform: uppercase;
      color: ${colors.muteDeep};
      margin-bottom: 3pt;
    }
    .detail-value {
      font-size: 11pt;
      color: ${colors.text};
    }

    .long-card {
      border: 1pt solid ${colors.line};
      border-radius: 10pt;
      background: ${colors.surface};
      padding: 11pt 13pt;
      margin-bottom: 8pt;
      page-break-inside: avoid;
    }
    .long-label {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1pt;
      text-transform: uppercase;
      color: ${colors.muteDeep};
      margin-bottom: 4pt;
    }
    .long-value {
      font-size: 11pt;
      color: ${colors.text};
      white-space: pre-wrap;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
    }
    .photo-cell {
      margin: 0;
      border: 1pt solid ${colors.line};
      border-radius: 10pt;
      overflow: hidden;
      background: ${colors.surface};
      page-break-inside: avoid;
    }
    .photo-img {
      width: 100%;
      height: 160pt;
      object-fit: cover;
      display: block;
      background: ${colors.lineSoft};
    }
    .photo-caption {
      padding: 8pt 10pt 2pt;
      font-size: 9.5pt;
      color: ${colors.textDim};
      line-height: 1.35;
    }
    .tags {
      padding: 4pt 10pt 10pt;
      display: flex;
      flex-wrap: wrap;
      gap: 4pt;
    }
    .tag {
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.4pt;
      text-transform: uppercase;
      color: ${colors.muteDeep};
      background: ${colors.lineSoft};
      padding: 2pt 7pt;
      border-radius: 999pt;
    }

    .bottom {
      position: fixed;
      bottom: 16pt;
      left: 32pt;
      right: 32pt;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: ${colors.mute};
      border-top: 1pt solid ${colors.line};
      padding-top: 6pt;
    }
  `;
}
