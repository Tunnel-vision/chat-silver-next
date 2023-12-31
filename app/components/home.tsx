"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { useAccessStore } from "../store/access";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const LoginPage = dynamic(async () => (await import("./login")).LoginPage, {
  loading: () => <Loading noLogo />,
});

const ResetPage = dynamic(async () => (await import("./reset")).ResetPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=Noto+Sans+SC:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function RequireAuth({ children }: { children: any }) {
  const access = useAccessStore();
  let location = useLocation();
  if (!access?.user && !localStorage.getItem("user")) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  return (
    <div
      className={
        ![Path.Login, Path.Reset].includes(location.pathname as Path)
          ? styles.container +
            ` ${
              config.tightBorder && !isMobileScreen
                ? styles["tight-container"]
                : styles.container
            }`
          : ""
      }
    >
      {![Path.Login, Path.Reset].includes(location.pathname as Path) ? (
        <SideBar className={isHome ? styles["sidebar-show"] : ""} />
      ) : null}

      <div
        className={
          ![Path.Login, Path.Reset].includes(location.pathname as Path)
            ? styles["window-content"]
            : ""
        }
        id={SlotID.AppBody}
      >
        <Routes>
          <Route
            path={Path.Home}
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path={Path.NewChat}
            element={
              <RequireAuth>
                <NewChat />
              </RequireAuth>
            }
          />
          <Route
            path={Path.Masks}
            element={
              <RequireAuth>
                <MaskPage />
              </RequireAuth>
            }
          />
          <Route
            path={Path.Chat}
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path={Path.Settings}
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path={Path.Login} element={<LoginPage />} />
          <Route path={Path.Reset} element={<ResetPage />} />
          <Route path={"/healthCheck"} element={<div>hello world</div>} />
        </Routes>
      </div>

      {/* {isAuth ? (
        <>
          <AuthPage />
        </>
      ) : (
       <></>
      )} */}
    </div>
  );
}

export function Home() {
  useSwitchTheme();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
