import { ContentPage } from "./ContentPage";
import { DOT_CHAR, SPACE_CHAR, toBold, Element, ContainerElement, TextElement } from "@adam26davidson/char-matrix";
import { HeaderElement } from "../MatrixElement/HeaderElement";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { BLOG_POST_LIST } from "../blogPosts/post-list";

export class BlogPage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "BlogHeader",
      "Blog Posts",
      this.view
    );

    const postLinks: ContainerElement[] = BLOG_POST_LIST.map((post) => {
      const postHeader = new TextElement({
        key: `postHeader-${post.metaData.id}`,
        text: `\u2219 ${toBold(post.metaData.title)}`,
        view: this.view,
        cursor: "pointer",
      });

      const postDescription = new TextElement({
        key: `postDescription-${post.metaData.id}`,
        text: `${post.metaData.description}`,
        view: this.view,
        widthType: "relative",
        width: 1,
        backgroundChar: SPACE_CHAR,
        paddingLeft: 2,
      });

      const postDate = new TextElement({
        key: `postDate-${post.metaData.id}`,
        text: `  ${post.metaData.published}`,
        view: this.view,
      });

      const postSummaryContainerElement = new ContainerElement({
        key: `postLinkContainer-${post.metaData.id}`,
        view: this.view,
        mainAxis: "y",
        bordered: true,
        backgroundChar: SPACE_CHAR,
        paddingX: 1,
        spacing: 1,
        widthType: "relative",
        width: 1,
      });
      postSummaryContainerElement.setChildren([
        postHeader,
        postDescription,
        postDate,
      ]);
      postSummaryContainerElement.setOnClick(() => {
        this.setPage("blogPost", `?postId=${post.metaData.id}`);
      });
      return postSummaryContainerElement;
    });

    const postLinksContainer = new ContainerElement({
      key: "postLinksContainer",
      view: this.view,
      mainAxis: "y",
      width: 1.0,
      widthType: "relative",
      backgroundChar: DOT_CHAR,
      spacing: 1,
    });
    postLinksContainer.setChildren(postLinks);

    const content = new ContentContainerElement("aboutContent", this.view);

    content.setChildren([headerElement, postLinksContainer]);

    return content;
  }
}
