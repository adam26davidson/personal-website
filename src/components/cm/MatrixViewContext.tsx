import { createContext, useContext } from "react";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import type { PageKey } from "../../matrixController";

interface MatrixViewContextValue {
  view: RenderTarget;
  setPage: (pageKey: PageKey, queryString?: string) => void;
}

const MatrixViewContext = createContext<MatrixViewContextValue | null>(null);

export function useMatrixView(): MatrixViewContextValue {
  const ctx = useContext(MatrixViewContext);
  if (!ctx) {
    throw new Error("useMatrixView must be used within a MatrixViewProvider");
  }
  return ctx;
}

export const MatrixViewProvider = MatrixViewContext.Provider;
