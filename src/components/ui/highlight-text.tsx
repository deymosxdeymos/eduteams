interface HighlightTextProps {
  text: string;
  highlightClassName?: string;
  className?: string;
}

export function HighlightText({
  text,
  highlightClassName = 'text-blue-background',
  className = '',
}: HighlightTextProps) {
  const parseText = (input: string) => {
    const parts = input.split(/(<mark>.*?<\/mark>)/g);

    return parts.map((part, index) => {
      if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
        const content = part.replace(/<\/?mark>/g, '');
        return (
          <span key={index} className={highlightClassName}>
            {content}
          </span>
        );
      }
      return part;
    });
  };

  return <span className={className}>{parseText(text)}</span>;
}
