const baseClasses = [
  "[&_p]:my-0",
  "[&_p+p]:mt-4",
  "[&_h2]:mt-6",
  "[&_h2]:text-2xl",
  "[&_h2]:font-semibold",
  "[&_h2:first-child]:mt-0",
  "[&_h3]:mt-5",
  "[&_h3]:text-xl",
  "[&_h3]:font-semibold",
  "[&_h3:first-child]:mt-0",
  "[&_ul]:my-4",
  "[&_ul]:list-disc",
  "[&_ul]:pl-5",
  "[&_ol]:my-4",
  "[&_ol]:list-decimal",
  "[&_ol]:pl-5",
  "[&_li]:my-1.5",
  "[&_blockquote]:my-4",
  "[&_blockquote]:border-l-2",
  "[&_blockquote]:border-white/20",
  "[&_blockquote]:pl-4",
  "[&_blockquote]:italic",
  "[&_pre]:my-4",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:rounded-xl",
  "[&_pre]:bg-black/30",
  "[&_pre]:p-4",
  "[&_pre]:text-sm",
  "[&_code]:rounded",
  "[&_code]:bg-black/25",
  "[&_code]:px-1.5",
  "[&_code]:py-0.5",
  "[&_hr]:my-6",
  "[&_hr]:border-white/10",
  "[&_a]:underline",
  "[&_a]:underline-offset-4",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_s]:line-through",
].join(" ");

const RichTextContent = ({ value, className = "" }) => {
  const html = String(value || "").trim();
  if (!html) {
    return null;
  }

  return <div className={`${baseClasses} ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default RichTextContent;
