import { ContentPage } from "./ContentPage";
import { Element } from "../MatrixElement/Element";
import { HeaderElement } from "../MatrixElement/HeaderElement";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { ContainerElement } from "../MatrixElement/ContainerElement";
import { DOT_CHAR, SPACE_CHAR } from "../constants";
import { BLOG_POST_LIST } from "../blogPosts/post-list";
import { toBold } from "../Utilities/MiscUtils";
import TextElement from "../MatrixElement/TextElement";

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
        text: `  ${post.metaData.description}`,
        view: this.view,
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
