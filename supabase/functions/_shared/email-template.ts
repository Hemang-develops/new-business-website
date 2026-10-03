const escapeEmailHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const emailText = (value: unknown) => escapeEmailHtml(value);

export const emailButton = (href: string, label: string) => {
  let safeHref: string;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    safeHref = escapeEmailHtml(url.toString());
  } catch {
    return "";
  }

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;"><tr><td align="center" style="border-radius:999px;background:#5eead4;"><a href="${safeHref}" style="display:inline-block;padding:14px 22px;border:1px solid #5eead4;border-radius:999px;color:#042f2e;font-size:13px;font-weight:700;line-height:1.2;text-decoration:none;">${escapeEmailHtml(label)}</a></td></tr></table>`;
};

export const renderBrandedEmail = ({
  title,
  previewText,
  label,
  contentHtml,
  footerText = "With gratitude, Nehal Patel",
}: {
  title: string;
  previewText: string;
  label: string;
  contentHtml: string;
  footerText?: string;
}) => {
  const brandName = escapeEmailHtml(Deno.env.get("BRAND_NAME") || "High Frequencies 11");

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeEmailHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#071311;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeEmailHtml(previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071311;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;">
            <tr>
              <td align="center" style="padding:0 12px 18px;">
                <span style="display:inline-block;padding:9px 16px;border:1px solid #254d47;border-radius:999px;background-color:#10231f;color:#99f6e4;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${brandName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 1px;border:1px solid #24413c;border-radius:20px;background-color:#10201e;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="height:4px;border-radius:20px 20px 0 0;background-color:#5eead4;font-size:0;line-height:0;">&nbsp;</td></tr>
                  <tr>
                    <td style="padding:34px 32px 30px;">
                      <p style="margin:0 0 14px;color:#5eead4;font-size:11px;font-weight:700;letter-spacing:2px;line-height:1.4;text-transform:uppercase;">${escapeEmailHtml(label)}</p>
                      <h1 style="margin:0 0 22px;color:#ffffff;font-size:30px;font-weight:700;line-height:1.2;">${escapeEmailHtml(title)}</h1>
                      <div style="color:#d1d5db;font-size:15px;line-height:1.75;">${contentHtml}</div>
                      <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #29413d;color:#99a9a5;font-size:13px;line-height:1.6;">${escapeEmailHtml(footerText)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 16px 0;color:#778985;font-size:11px;line-height:1.6;">${brandName}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};