import "katex/dist/katex.min.css";
import "./blogPost.css";
import { MDXProvider } from "@mdx-js/react";

export function BlogPost({
  width,
  height,
  top,
  left,
  children,
}: {
  width: number;
  height: number;
  top: number;
  left: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="fade-in-top normal-scrollbar prose prose-invert prose-slate max-w-none"
      style={{
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        width: `${width}px`,
        zIndex: 100,
        padding: "40px",
        overflowY: "auto",
      }}
    >
      <MDXProvider>{children}</MDXProvider>
    </div>
  );
}
