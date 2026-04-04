import { DOT_CHAR } from "@adam26davidson/char-matrix";
import { useMatrixView } from "./MatrixViewContext";
import { CMLink } from "./CMLink";
import { CMMediumTitle, CMSmallTitle } from "./CMTitle";
import { LINKS } from "../../Pages/Page";

export function CMContentLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { view } = useMatrixView();
  const isMobile = view.getIsMobile();

  if (isMobile) {
    return <CMContentLayoutMobile>{children}</CMContentLayoutMobile>;
  }
  return <CMContentLayoutDesktop>{children}</CMContentLayoutDesktop>;
}

function CMContentLayoutDesktop({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { setPage } = useMatrixView();

  return (
    <cm-container
      elementKey="mainContainer"
      mainAxis="x"
      width={1}
      height={1}
      widthType="relative"
      heightType="relative"
      backgroundChar={DOT_CHAR}
      justifyContent="start"
      alignItems="start"
    >
      {/* Sidebar */}
      <cm-container
        elementKey="sideContainer"
        mainAxis="y"
        backgroundChar={DOT_CHAR}
        spacing={1}
        paddingX={2}
        paddingY={1}
        entranceTiming="parallel"
        exitTiming="parallel"
      >
        <CMMediumTitle onClick={() => setPage("title")} />
        <cm-container
          elementKey="linkContainer"
          mainAxis="y"
          spacing={1}
          backgroundChar={DOT_CHAR}
          entranceTiming="series"
          exitTiming="series"
        >
          {LINKS.map((link) => (
            <CMLink
              key={link.key}
              elementKey={link.key}
              text={link.title}
              onClick={() => setPage(link.key)}
            />
          ))}
        </cm-container>
      </cm-container>

      {/* Content area */}
      <cm-container
        elementKey="contentContainer"
        mainAxis="x"
        backgroundChar={DOT_CHAR}
        spacing={1}
        widthType="expand"
        height={1}
        heightType="relative"
        entranceTiming="parallel"
        exitTiming="parallel"
        justifyContent="center"
        alignItems="start"
      >
        {children}
      </cm-container>
    </cm-container>
  );
}

function CMContentLayoutMobile({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { setPage } = useMatrixView();

  return (
    <cm-container
      elementKey="mainContainer"
      mainAxis="y"
      width={1}
      height={1}
      paddingLeft={2}
      paddingRight={1}
      paddingY={1}
      widthType="relative"
      heightType="relative"
      backgroundChar={DOT_CHAR}
      justifyContent="start"
      alignItems="start"
    >
      {/* Header */}
      <cm-container
        elementKey="headerContainer"
        mainAxis="x"
        width={1}
        spacing={2}
        widthType="relative"
        backgroundChar={DOT_CHAR}
        justifyContent="start"
        alignItems="start"
      >
        <CMLink
          elementKey="navButton"
          text="☰"
          onClick={() => setPage("mobileNav")}
        />
        <CMSmallTitle onClick={() => setPage("title")} />
      </cm-container>

      {/* Content area */}
      <cm-container
        elementKey="contentContainer"
        mainAxis="y"
        backgroundChar={DOT_CHAR}
        spacing={1}
        width={1}
        widthType="relative"
        heightType="expand"
        paddingTop={1}
        entranceTiming="parallel"
        exitTiming="parallel"
        justifyContent="center"
        alignItems="start"
      >
        {children}
      </cm-container>
    </cm-container>
  );
}
