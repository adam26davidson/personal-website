import MatrixView from "./matrixView";
import { Page } from "./Pages/Page";
import { AboutPage } from "./Pages/AboutPage";
import { TitlePage } from "./Pages/TitlePage";
import { NavigateFunction } from "react-router";
import { ProjectsPage } from "./Pages/ProjectsPage";
import { ProfessionalExperiencePage } from "./Pages/ProfessionalExperiencePage";
import { AboutThisSitePage } from "./Pages/AboutThisSitePage";
import { ContactPage } from "./Pages/ContactPage";
import { MobileNavPage } from "./Pages/MobileNavPage";

export type PageKey =
  | "about"
  | "projects"
  | "contact"
  | "title"
  | "professionalExperience"
  | "aboutThisSite"
  | "mobileNav";

export const PAGE_ROUTES = {
  about: "/about",
  projects: "/projects",
  contact: "/contact",
  title: "/",
  professionalExperience: "/professional-experience",
  aboutThisSite: "/about-this-site",
  mobileNav: "/mobile-nav",
};

export const PAGE_KEYS: { [key: string]: PageKey } = {
  "/about": "about",
  "/professional-experience": "professionalExperience",
  "/about-this-site": "aboutThisSite",
  "/projects": "projects",
  "/contact": "contact",
  "/": "title",
  "/mobile-nav": "mobileNav",
};

class MatrixController {
  private currentPage: PageKey = "title";
  private pages: { [key: string]: Page } = {};
  private navigate: NavigateFunction = () => {};

  constructor(view: MatrixView) {
    this.pages = {
      title: new TitlePage(view, this.setPage.bind(this)),
      about: new AboutPage(view, this.setPage.bind(this)),
      projects: new ProjectsPage(view, this.setPage.bind(this)),
      professionalExperience: new ProfessionalExperiencePage(
        view,
        this.setPage.bind(this)
      ),
      aboutThisSite: new AboutThisSitePage(view, this.setPage.bind(this)),
      contact: new ContactPage(view, this.setPage.bind(this)),
      mobileNav: new MobileNavPage(view, this.setPage.bind(this)),
    };
  }

  public initialize() {
    const currentRoute = window.location.pathname;
    const pageKey = PAGE_KEYS[currentRoute] as PageKey;
    console.log("initializing MatrixController, currentRoute", pageKey);
    this.currentPage = pageKey;
    this.pages[this.currentPage].enterPage(true);
  }

  public setRoute(route: string) {
    const pageKey = PAGE_KEYS[route] as PageKey;
    console.log("setting route", pageKey);
    this.setPage(pageKey);
  }

  public setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  public setPage(toPage: PageKey) {
    if (this.pages[toPage] && toPage !== this.currentPage) {
      console.log("setting page", toPage);
      console.log("exiting page", this.currentPage);
      this.pages[this.currentPage].exitPage(() => {
        console.log("exited page", this.currentPage);
        this.navigate(PAGE_ROUTES[toPage]);
        const page = this.pages[toPage];
        page.enterPage(
          this.currentPage === "title" || this.currentPage === "mobileNav"
        );
        this.currentPage = toPage;
      }, toPage === "title" || toPage === "mobileNav");
    }
  }

  public handleMobileChange() {
    this.pages[this.currentPage].enterPage(true);
  }
}

export default MatrixController;
