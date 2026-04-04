import { DOT_CHAR, SPACE_CHAR, toBold } from "@adam26davidson/char-matrix";
import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  useMatrixView,
} from "../../components/cm";
import { BLOG_POST_LIST } from "../../blogPosts/post-list";
import type { DeclarativePageProps } from "../ReactPage";

function PostSummary({
  id,
  title,
  description,
  published,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  published: string;
  onClick: () => void;
}) {
  return (
    <cm-container
      elementKey={`postLinkContainer-${id}`}
      mainAxis="y"
      bordered
      backgroundChar={SPACE_CHAR}
      paddingX={1}
      spacing={1}
      widthType="relative"
      width={1}
      onClick={onClick}
    >
      <cm-text
        elementKey={`postHeader-${id}`}
        text={`\u2219 ${toBold(title)}`}
        cursor="pointer"
      />
      <cm-text
        elementKey={`postDescription-${id}`}
        text={description}
        widthType="relative"
        width={1}
        backgroundChar={SPACE_CHAR}
        paddingLeft={2}
      />
      <cm-text
        elementKey={`postDate-${id}`}
        text={`  ${published}`}
      />
    </cm-container>
  );
}

export function BlogContent(_props: DeclarativePageProps) {
  const { setPage } = useMatrixView();

  return (
    <CMContentLayout>
      <CMContentContainer elementKey="aboutContent">
        <CMHeader elementKey="BlogHeader" text="Blog Posts" />
        <cm-container
          elementKey="postLinksContainer"
          mainAxis="y"
          width={1.0}
          widthType="relative"
          backgroundChar={DOT_CHAR}
          spacing={1}
        >
          {BLOG_POST_LIST.map((post) => (
            <PostSummary
              key={post.metaData.id}
              id={post.metaData.id}
              title={post.metaData.title}
              description={post.metaData.description}
              published={post.metaData.published}
              onClick={() =>
                setPage("blogPost", `?postId=${post.metaData.id}`)
              }
            />
          ))}
        </cm-container>
      </CMContentContainer>
    </CMContentLayout>
  );
}
