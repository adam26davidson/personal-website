import "katex/dist/katex.min.css";
import "./BlogPost.css";
import { MDXProvider } from "@mdx-js/react";
import { FONT_SIZE, MOBILE_WIDTH } from "@/constants";

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
  const isMobile = window.innerWidth < (MOBILE_WIDTH * FONT_SIZE) / 2;
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
        padding: isMobile ? "20px" : "40px",
        overflowY: "auto",
      }}
    >
      <MDXProvider>{children}</MDXProvider>
    </div>
  );
}
