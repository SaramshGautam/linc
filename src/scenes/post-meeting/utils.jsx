export const convertMarkdownToHTML = (markdown) => {
  let html = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/- (.*?)\n/g, "<li>$1</li>");
  html = html.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");
  html = html.replace(/([^\n])\n([^\n])/g, "$1<br>$2");
  return html;
};
