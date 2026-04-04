import { DOT_CHAR } from "@adam26davidson/char-matrix";
import { useMatrixView, CMLink, CMLargeTitle, CMMediumTitle } from "../../components/cm";
import { LINKS } from "../Page";
import type { DeclarativePageProps } from "../ReactPage";

export function TitleContent(_props: DeclarativePageProps) {
  const { view, setPage } = useMatrixView();
  const isMobile = view.getIsMobile();

  return (
    <cm-container
      elementKey="mainContainer"
      mainAxis="x"
      widthType="relative"
      heightType="relative"
      width={1}
      height={1}
      alignItems="center"
      justifyContent="center"
      backgroundChar={DOT_CHAR}
    >
      <cm-container
        elementKey="contentContainer"
        mainAxis="y"
        backgroundChar={DOT_CHAR}
        spacing={1}
        alignItems="center"
        entranceTiming="series"
        exitTiming="parallel"
      >
        {isMobile ? <CMMediumTitle /> : <CMLargeTitle />}
        <cm-container
          elementKey="linkContainer"
          mainAxis={isMobile ? "y" : "x"}
          spacing={isMobile ? 1 : 3}
          alignItems="center"
          justifyContent="center"
          backgroundChar={DOT_CHAR}
          entranceTiming="series"
          exitTiming={isMobile ? "parallel" : "series"}
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
    </cm-container>
  );
}
