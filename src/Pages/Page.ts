import { PageKey } from "../matrixController";
import MatrixView from "../matrixView";

export const LINKS: { title: string; key: PageKey }[] = [
  { title: "ABOUT", key: "about" },
  { title: "PROJECTS", key: "projects" },
  { title: "CONTACT", key: "contact" },
  { title: "BLOG", key: "blog" },
];

export abstract class Page {
  // abstract methods ---------------------------------------------------------
  public abstract enterPage(fromTitle: boolean): void;
  public abstract exitPage(onExit: () => void, toTitle: boolean): void;

  // class members ------------------------------------------------------------
  protected setPage: (pageKey: PageKey, queryString?: string) => void;
  protected view: MatrixView;

  constructor(
    view: MatrixView,
    setPage: (pageKey: PageKey, queryString?: string) => void
  ) {
    this.view = view;
    this.setPage = setPage;
  }
}
