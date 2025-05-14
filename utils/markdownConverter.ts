interface MarkContent {
  content?: any[];
  type?: string;
  attrs?: Record<string, any>;
  marks?: any[];
  text?: string;
}

const convertInlineContent = (node: MarkContent): string => {
  if (!node.content) return "";
  
  let text = "";
  
  node.content.forEach((inline: MarkContent) => {
    if (inline.type === "text") {
      let content = inline.text || "";
      
      if (inline.marks) {
        inline.marks.forEach((mark: MarkContent) => {
          switch (mark.type) {
            case "bold":
              content = `**${content}**`;
              break;
            case "italic":
              content = `*${content}*`;
              break;
            case "strike":
              content = `~~${content}~~`;
              break;
            case "underline":
              content = `__${content}__`;
              break;
            case "code":
              content = `\`${content}\``;
              break;
            case "link":
              content = `[${content}](${mark.attrs?.href})`;
              break;
          }
        });
      }
      
      text += content;
    }
  });
  
  return text;
};

const processBulletList = (node: MarkContent, level: number): string => {
  if (!node.content) return "";
  
  let result = "";
  const indent = "   ".repeat(level);
  
  node.content.forEach((item: MarkContent) => {
    if (item.type === "listItem") {
      let itemContent = "";
      let nestedList = "";
      
      if (item.content) {
        item.content.forEach((content: MarkContent) => {
          if (content.type === "paragraph") {
            itemContent += convertInlineContent(content);
          } else if (content.type === "bulletList") {
            nestedList += processBulletList(content, level + 1);
          } else if (content.type === "orderedList") {
            nestedList += processOrderedList(content, level + 1);
          }
        });
      }
      
      result += `${indent}- ${itemContent.trimStart()}`;
      if (nestedList) {
        result += `\n${nestedList}`;
      }
      result += "\n";
    }
  });
  
  return result;
};

const processOrderedList = (node: MarkContent, level: number): string => {
  if (!node.content) return "";
  
  let result = "";
  const indent = "    ".repeat(level);
  
  let itemNumber = 1;
  node.content.forEach((item: MarkContent) => {
    if (item.type === "listItem") {
      let itemContent = "";
      let nestedList = "";
      
      if (item.content) {
        item.content.forEach((content: MarkContent) => {
          if (content.type === "paragraph") {
            itemContent += convertInlineContent(content);
          } else if (content.type === "orderedList") {
            nestedList += processOrderedList(content, level + 1);
          } else if (content.type === "bulletList") {
            nestedList += processBulletList(content, level + 1);
          }
        });
      }
      
      result += `${indent}${itemNumber}. ${itemContent.trimStart()}`;
      if (nestedList) {
        result += `\n${nestedList}`;
      }
      result += "\n";
      itemNumber++;
    }
  });
  
  return result;
};

export const convertToMarkdown = (content: MarkContent): string => {
  if (!content || !content.content) return "";
  
  let result = "";
  
  content.content.forEach((node: MarkContent) => {
    switch (node.type) {
      case "paragraph":
        result += convertInlineContent(node) + "\n\n";
        break;
        
      case "heading":
        const level = node.attrs?.level || 1;
        const headingText = convertInlineContent(node);
        result += `${"#".repeat(level)} ${headingText}\n\n`;
        break;
        
      case "bulletList":
        result += processBulletList(node, 0) + "\n";
        break;
        
      case "orderedList":
        result += processOrderedList(node, 0) + "\n";
        break;
        
      case "blockquote":
        const quoteContent = node.content ? convertToMarkdown(node) : "";
        result += quoteContent.split("\n").map((line: string) => `> ${line}`).join("\n") + "\n\n";
        break;
        
      case "codeBlock":
        const code = node.content ? convertInlineContent(node) : "";
        const lang = node.attrs?.language || "";
        result += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
        break;
    }
  });
  
  return result;
}; 