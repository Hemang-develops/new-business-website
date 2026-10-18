import { sanitizeRichText } from '../../lib/sanitizeRichText';
import '../tiptap-node/blockquote-node/blockquote-node.scss';
import '../tiptap-node/code-block-node/code-block-node.scss';
import '../tiptap-node/heading-node/heading-node.scss';
import '../tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '../tiptap-node/image-node/image-node.scss';
import '../tiptap-node/list-node/list-node.scss';
import '../tiptap-node/paragraph-node/paragraph-node.scss';

const RichTextContent = ({ value, className = "" }) => {
  const html = sanitizeRichText(value);
  if (!html) {
    return null;
  }

  return <div className={`tiptap ProseMirror ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
};

export { sanitizeRichText };
export default RichTextContent;
