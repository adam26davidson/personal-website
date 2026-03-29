import { ContentPage } from "./ContentPage";
import { SPACE_CHAR, getPostIdFromTitle, Element } from "char-matrix";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { ReactComponentElement } from "char-matrix-react";
import { BLOG_POST_LIST } from "../blogPosts/post-list";

export class BlogPostPage extends ContentPage {
  protected getContent(): Element {
    // get post id from the query string
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("postId");
    const post = BLOG_POST_LIST.find(
      (post) => getPostIdFromTitle(post.metaData.id) === postId
    );
    if (!post) {
      console.error("Post not found");
      return new ContentContainerElement("errorContent", this.view);
    }

    // const headerElement = new HeaderElement(
    //   "BlogPostHeader",
    //   post.title,
    //   this.view
    // );

    const postContentElement = new ReactComponentElement({
      key: postId || "",
      type: "BlogComponent",
      view: this.view,
      backgroundChar: SPACE_CHAR,
      width: 1,
      widthType: "relative",
      heightType: "expand",
      bordered: this.view.getIsMobile() ? true : false,
      content: post.content,
    });

    const content = new ContentContainerElement(
      "aboutContent",
      this.view,
      true
    );

    content.setChildren([postContentElement]);

    return content;
  }
}
