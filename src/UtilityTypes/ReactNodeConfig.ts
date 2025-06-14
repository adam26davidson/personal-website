import { ComponentType } from "react";

export interface ReactNodeConfig {
  type: ReactComponentType;
  key: string;
  height: number;
  width: number;
  top: number;
  left: number;
  content?: ComponentType
}

export type ReactComponentType =
  | "BlogComponent"
  | "ImageComponent"
  | "TextComponent";
