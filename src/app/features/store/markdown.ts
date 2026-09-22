/** Escape then convert a small Markdown subset to HTML. */
export function renderMarkdown(source: string): string {
  const text = (source || '').replace(/\r\n/g, '\n').trim();
  if (!text) {
    return '';
  }

  const escaped = escapeHtml(text);
  const chunks: string[] = [];
  const lines = escaped.split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim() === '```' || line.startsWith('```')) {
      const fence = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== '```') {
        fence.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      chunks.push(`<pre><code>${fence.join('\n')}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      chunks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^[-*]{3,}$/.test(line.trim())) {
      chunks.push('<hr />');
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(`<li>${inline(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
        index += 1;
      }
      chunks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${inline(lines[index].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        index += 1;
      }
      chunks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      if (
        /^(#{1,6})\s+/.test(lines[index]) ||
        /^\s*[-*]\s+/.test(lines[index]) ||
        /^\s*\d+\.\s+/.test(lines[index]) ||
        lines[index].trim() === '```' ||
        lines[index].startsWith('```')
      ) {
        break;
      }
      paragraph.push(lines[index]);
      index += 1;
    }
    chunks.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return chunks.join('');
}

export function productBlurb(product: {
  short_description?: string;
  description?: string;
}): string {
  return (product.short_description || product.description || '').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(value: string): string {
  let out = value;
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt, href) => {
    const safe = safeHref(unescapeAttr(href));
    return safe ? `<img src="${escapeAttr(safe)}" alt="${alt}" />` : alt;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
    const safe = safeHref(unescapeAttr(href));
    return safe ? `<a href="${escapeAttr(safe)}">${label}</a>` : label;
  });
  return out;
}

function unescapeAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return null;
}
