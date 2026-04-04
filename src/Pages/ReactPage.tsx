import React from "react";
import { render, unmount } from "@adam26davidson/char-matrix-react-renderer";
import { MatrixViewProvider } from "../components/cm/MatrixViewContext";
import { Page } from "./Page";
import type { PageKey } from "../matrixController";
import type MatrixView from "../matrixView";

export interface DeclarativePageProps {
  fromTitle: boolean;
}

/**
 * Adapter that wraps a React functional component for use with the
 * imperative MatrixController page-switching system.
 *
 * The component receives `fromTitle` as a prop and should render its
 * element tree using <cm-container>, <cm-text>, etc. The root element
 * is automatically set on the view via the reconciler's setRoot bridging.
 *
 * Transition lifecycle:
 * - enterPage: renders the component, then starts the root's enter transition
 * - exitPage: starts the root's exit transition, unmounts on completion
 */
export class ReactPage extends Page {
  private Component: React.ComponentType<DeclarativePageProps>;

  constructor(
    view: MatrixView,
    setPage: (pageKey: PageKey, queryString?: string) => void,
    Component: React.ComponentType<DeclarativePageProps>
  ) {
    super(view, setPage);
    this.Component = Component;
  }

  public enterPage(fromTitle: boolean): void {
    const { Component } = this;

    render(
      <MatrixViewProvider value={{ view: this.view, setPage: this.setPage }}>
        <Component fromTitle={fromTitle} />
      </MatrixViewProvider>,
      this.view
    );

    // The reconciler's appendChildToContainer calls view.setRoot(),
    // so the root element is already registered. Start the enter transition.
    const root = this.view.getRoot();
    if (fromTitle) {
      root?.startTransition("enter");
    } else {
      // When navigating between content pages, only the content area
      // transitions. The component should handle this via its own structure.
      // For now, transition the whole root.
      root?.startTransition("enter");
    }
  }

  public exitPage(onExit: () => void, _toTitle?: boolean): void {
    const root = this.view.getRoot();
    if (root) {
      root.startTransition("exit", () => {
        unmount(this.view);
        onExit();
      });
    } else {
      unmount(this.view);
      onExit();
    }
  }
}
