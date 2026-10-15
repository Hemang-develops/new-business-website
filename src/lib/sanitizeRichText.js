const stripDangerousHtml = (html) => {
  const input = String(html ?? '').trim();
  if (!input) {
    return '';
  }

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|xlink:href)\s*=\s*(?:"|')?\s*(?:javascript:|data:text\/html)/gi, '');
};

export const sanitizeRichText = (value) => {
  const html = String(value ?? '').trim();
  if (!html) {
    return '';
  }

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    ['script', 'iframe', 'object', 'embed', 'svg', 'math', 'style', 'link', 'meta', 'base', 'form', 'input', 'button']
      .forEach((tagName) => {
        doc.querySelectorAll(tagName).forEach((node) => node.remove());
      });

    doc.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        const attributeName = attribute.name.toLowerCase();

        if (attributeName.startsWith('on')) {
          node.removeAttribute(attribute.name);
          return;
        }

        if ((attributeName === 'href' || attributeName === 'src' || attributeName === 'xlink:href')
          && /^javascript:/i.test(String(attribute.value || '').trim())) {
          node.removeAttribute(attribute.name);
        }
      });
    });

    return doc.body.innerHTML;
  }

  return stripDangerousHtml(html);
};
