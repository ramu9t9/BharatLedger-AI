import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (value: unknown, depth: number = 0): React.ReactNode => {
    if (value === null) return <span className="text-muted-foreground">null</span>;
    if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
    
    if (typeof value === "boolean") {
      return <span className={value ? "text-green-600" : "text-red-600"}>{value.toString()}</span>;
    }
    
    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>;
    }
    
    if (typeof value === "string") {
      return <span className="text-amber-600">"{value}"</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>;
      return (
        <span>
          [
          {value.map((item, index) => (
            <div key={index} className="ml-4 border-l border-border pl-2">
              {renderValue(item, depth + 1)}
              {index < value.length - 1 && ","}
            </div>
          ))}
          ]
        </span>
      );
    }
    
    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span>{"{}"}</span>;
      return (
        <span>
          {"{"}
          {entries.map(([key, val], index) => (
            <div key={key} className="ml-4 border-l border-border pl-2">
              <span className="text-primary">"{key}"</span>: {renderValue(val, depth + 1)}
              {index < entries.length - 1 && ","}
            </div>
          ))}
          {"}"}
        </span>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className={cn("relative rounded-lg border bg-muted/50 p-4 font-mono text-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-x-auto pr-10">
        {renderValue(data)}
      </pre>
    </div>
  );
}
