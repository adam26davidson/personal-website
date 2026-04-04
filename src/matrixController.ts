import MatrixView from "./matrixView";
import { Page } from "./Pages/Page";
import { NavigateFunction } from "react-router";
import { BlogPostPage } from "./Pages/BlogPostPage";
import { ReactPage } from "./Pages/ReactPage";

// Declarative page components
import { TitleContent } from "./Pages/declarative/TitlePage";
import { AboutContent } from "./Pages/declarative/AboutPage";
import { ProjectsContent } from "./Pages/declarative/ProjectsPage";
import { ProfessionalExperienceContent } from "./Pages/declarative/ProfessionalExperiencePage";
import { AboutThisSiteContent } from "./Pages/declarative/AboutThisSitePage";
import { ContactContent } from "./Pages/declarative/ContactPage";
import { MobileNavContent } from "./Pages/declarative/MobileNavPage";
import { BlogContent } from "./Pages/declarative/BlogPage";

export type PageKey =
  | "about"
  | "projects"
  | "contact"
  | "title"
  | "professionalExperience"
  | "aboutThisSite"
  | "mobileNav"
  | "blog"
  | "blogPost";

export const PAGE_ROUTES = {
  about: "/about/",
  projects: "/projects/",
  contact: "/contact/",
  title: "/",
  professionalExperience: "/professional-experience/",
  aboutThisSite: "/about-this-site/",
  mobileNav: "/mobile-nav/",
  blog: "/blog/",
  blogPost: "/blog-post/",
};

export const PAGE_KEYS: { [key: string]: PageKey } = {
  "/about/": "about",
  "/professional-experience/": "professionalExperience",
  "/about-this-site/": "aboutThisSite",
  "/projects/": "projects",
  "/contact/": "contact",
  "/": "title",
  "/mobile-nav/": "mobileNav",
  "/blog/": "blog",
  "/blog-post/": "blogPost",
};

class MatrixController {
  private currentPage: PageKey = "title";
  private pages: { [key: string]: Page } = {};
  private navigate: NavigateFunction = () => {};

  constructor(view: MatrixView) {
    const setPage = this.setPage.bind(this);

    this.pages = {
      // Declarative pages (React components via reconciler)
      title: new ReactPage(view, setPage, TitleContent),
      about: new ReactPage(view, setPage, AboutContent),
      projects: new ReactPage(view, setPage, ProjectsContent),
      professionalExperience: new ReactPage(view, setPage, ProfessionalExperienceContent),
      aboutThisSite: new ReactPage(view, setPage, AboutThisSiteContent),
      contact: new ReactPage(view, setPage, ContactContent),
      mobileNav: new ReactPage(view, setPage, MobileNavContent),
      blog: new ReactPage(view, setPage, BlogContent),
      // Imperative page (uses ReactComponentElement for MDX overlay)
      blogPost: new BlogPostPage(view, setPage),
    };
  }

  public initialize() {
    const currentRoute = window.location.pathname;
    //add / to the end of the pathname if it's not there
    if (currentRoute[currentRoute.length - 1] !== "/") {
      this.navigate(currentRoute + "/");
      return;
    }
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

  public setPage(toPage: PageKey, queryString: string = "") {
    if (this.pages[toPage] && toPage !== this.currentPage) {
      console.log("setting page", toPage);
      console.log("exiting page", this.currentPage);
      this.pages[this.currentPage].exitPage(() => {
        console.log("exited page", this.currentPage);
        this.navigate(`${PAGE_ROUTES[toPage]}${queryString}`);
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
