export type ReportFigure = {
  src: string;
  when: string;
  place: string;
  note: string;
};

export type ReportDocument = {
  propertyName: string;
  propertyAddress: string;
  title: string;
  generatedLabel: string;
  watermark: boolean;
  rooms: { name: string; figures: ReportFigure[]; companion?: ReportFigure[] }[];
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function figureHtml(figure: ReportFigure): string {
  const note = figure.note.trim()
    ? `<figcaption class="note">${escapeHtml(figure.note.trim())}</figcaption>`
    : '';
  return `<figure>
    <img src="${escapeHtml(figure.src)}" alt="" />
    <figcaption>${escapeHtml(figure.when)} · ${escapeHtml(figure.place)}</figcaption>
    ${note}
  </figure>`;
}

function roomHtml(room: ReportDocument['rooms'][number], compare: boolean): string {
  if (!compare) {
    const figures = room.figures.map(figureHtml).join('');
    return `<section><h2>${escapeHtml(room.name)}</h2>${figures}</section>`;
  }
  const rows = Math.max(room.figures.length, room.companion?.length ?? 0);
  const cells: string[] = [];
  for (let index = 0; index < rows; index += 1) {
    const left = room.figures[index];
    const right = room.companion?.[index];
    cells.push(`<div class="pair">
      <div>${left ? figureHtml(left) : '<p class="empty">No move-in photo</p>'}</div>
      <div>${right ? figureHtml(right) : '<p class="empty">No move-out photo</p>'}</div>
    </div>`);
  }
  return `<section><h2>${escapeHtml(room.name)}</h2>
    <div class="pair labels"><p>Move-in</p><p>Move-out</p></div>
    ${cells.join('')}
  </section>`;
}

export function buildReportHtml(document: ReportDocument, compare: boolean): string {
  const watermark = document.watermark ? '<div class="watermark">PREVIEW</div>' : '';
  const rooms = document.rooms.map((room) => roomHtml(room, compare)).join('');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 28px; }
    body { margin: 0; color: #1C1915; font-family: Georgia, "Times New Roman", serif; }
    .watermark {
      position: fixed; left: 0; right: 0; top: 38%;
      text-align: center; font-size: 84px; letter-spacing: 14px;
      color: rgba(143, 45, 42, 0.18); transform: rotate(-18deg);
    }
    header { border-bottom: 2px solid #1C1915; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { letter-spacing: 2px; font-size: 12px; margin: 0 0 8px; }
    h1 { font-size: 32px; font-weight: normal; margin: 0; }
    .address { font-size: 16px; margin: 6px 0 0; }
    .meta { color: #5E584E; font-size: 13px; margin-top: 8px; }
    h2 { font-size: 20px; font-weight: normal; border-top: 1px solid #D0C7B8; padding-top: 14px; }
    figure { margin: 0 0 16px; break-inside: avoid; }
    img { width: 100%; height: auto; display: block; }
    figcaption { font-family: -apple-system, Helvetica, sans-serif; font-size: 12px; margin-top: 6px; }
    .note { font-style: italic; }
    .pair { display: flex; gap: 12px; }
    .pair > div { width: 50%; }
    .labels p { margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
    .empty { color: #5E584E; font-size: 13px; }
    footer { margin-top: 28px; border-top: 1px solid #D0C7B8; padding-top: 10px; color: #5E584E; font-size: 11px; font-family: -apple-system, Helvetica, sans-serif; }
  </style>
</head>
<body>
  ${watermark}
  <header>
    <p class="brand">OCEANINK LTD · RENTPROOF</p>
    <h1>${escapeHtml(document.propertyName)}</h1>
    <p class="address">${escapeHtml(document.propertyAddress)}</p>
    <p class="meta">${escapeHtml(document.title)} · ${escapeHtml(document.generatedLabel)}</p>
  </header>
  ${rooms || '<p class="empty">No photos in this report.</p>'}
  <footer>
    Generated on this device. Photos were not uploaded. This is a personal record, not legal advice.
    Oceanink Ltd, 124 City Road, London EC1V 2NX. Company number 16684370.
  </footer>
</body>
</html>`;
}
