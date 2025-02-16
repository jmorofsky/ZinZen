import { Dropdown, Switch } from "antd";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import type { MenuProps } from "antd/es/menu/menu";
import { useLocation, useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { darkModeState, displayInbox, displayToast, openInbox, searchActive } from "@src/store";

import searchIcon from "@assets/images/searchIcon.svg";
import verticalDots from "@assets/images/verticalDots.svg";

import useGlobalStore from "@src/hooks/useGlobalStore";
import { IHeader } from "@src/Interfaces/ICommon";
import { themeState } from "@src/store/ThemeState";

import Search from "../Search";
import { inboxIcon, openEnvelopeIcon } from "../../assets";

import "./Header.scss";

const HeaderBtn = ({ path, alt }: { path: string, alt: string }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const theme = useRecoilValue(themeState);
  const isInboxOpen = useRecoilValue(openInbox);
  const { handleChangeTheme, handleBackResModal } = useGlobalStore();
  const { t } = useTranslation();

  const setShowToast = useSetRecoilState(displayToast);

  const [darkModeStatus, setDarkModeStatus] = useRecoilState(darkModeState);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const dropdownOptions = [t("donate"), t("feedback"), t("blog"), t("backup"), t("changeTheme")];

  const toggleDarkModeStatus = () => {
    localStorage.setItem("darkMode", darkModeStatus ? "off" : "on");
    setDarkModeStatus(!darkModeStatus);
  };

  const items: MenuProps["items"] = [
    ...[...dropdownOptions, ...(showInstall ? ["Install"] : [])].map((ele, index) => ({
      label: ele,
      key: `${index}`,
      onClick: () => {
        if (ele === t("changeTheme")) {
          handleChangeTheme();
        } else if (ele === t("donate")) {
          window.open("https://donate.stripe.com/6oE4jK1iPcPT1m89AA", "_self");
        } else if (ele === t("feedback")) {
          navigate("/Feedback");
        } else if (ele === t("blog")) {
          window.open("https://blog.zinzen.me", "_self");
        } else if (ele === t("backup")) {
          handleBackResModal();
        } else if (ele === t("Install")) {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
              if (choiceResult.outcome === "accepted") {
                setShowInstall(false);
                setDeferredPrompt(null);
              }
            });
          }
        }
      }
    })),
    {
      label: (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }} onClickCapture={toggleDarkModeStatus}>
          <p>{t("Dark Mode")}</p>
          <Switch checked={darkModeStatus} />
        </div>
      ),
      key: "7",
    },
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleClick = async () => {
    // setLoading(true);
    if (alt === "zinzen hints") {
      setShowToast({ open: true, message: "Coming soon...", extra: "" });
    } else if (alt === "zinzen search") {
      navigate("/MyGoals", { state: { ...state, displaySearch: true } });
    } else if (alt === "zinzen inbox") {
      if (isInboxOpen) {
        window.history.go(-((state?.goalsHistory?.length || 0) + 1));
      } else {
        const newState = { ...state };
        if (newState.goalsHistory) { delete newState.goalsHistory; }
        if (newState.activeGoalId) { delete newState.activeGoalId; }
        navigate("/MyGoals", { state: { ...newState, goalsHistory: [], isInboxOpen: true } });
      }
    }
  };

  return (
    <div style={{ alignSelf: "center", display: "flex" }}>
      {alt === "zinzen settings" ? (
        <Dropdown rootClassName={`header-dropdown${darkModeStatus ? "-dark" : ""} ${darkModeStatus ? "dark" : "light"}-theme${theme[darkModeStatus ? "dark" : "light"]}`} overlayStyle={{ width: 175 }} menu={{ items }} trigger={["click"]}>
          <img className="theme-icon header-icon settings-icon" src={path} alt={alt} />
        </Dropdown>
      ) : (
        <img
          onClickCapture={handleClick}
          className="theme-icon header-icon"
          src={path}
          alt={alt}
        />
      )}
    </div>
  );
};
const Header: React.FC<IHeader> = ({ title, debounceSearch }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [isInboxOpen, setIsInboxOpen] = useRecoilState(openInbox);
  const [displaySearch, setDisplaySearch] = useRecoilState(searchActive);
  const showInbox = useRecoilValue(displayInbox);
  const darkModeStatus = useRecoilValue(darkModeState);

  const handlePopState = () => {
    const locationState = location.state || {};
    if (isInboxOpen || "isInboxOpen" in locationState) {
      setIsInboxOpen(locationState?.isInboxOpen || false);
    }
    if (displaySearch || locationState?.displaySearch) {
      setDisplaySearch(locationState?.displaySearch || false);
    }
  };

  useEffect(() => {
    handlePopState();
  }, [location]);
  return (
    <div className="header" style={{ background: darkModeStatus ? "var(--selection-color)" : "transparent" }}>
      {displaySearch && debounceSearch ?
        <Search debounceSearch={debounceSearch} />
        : (
          <>
            <h6>{isInboxOpen ? "Inbox" : t(title)}</h6>
            <div className="header-items">
              {["mygoals", "Inbox"].includes(title) && !isInboxOpen && <HeaderBtn path={searchIcon} alt="zinzen search" />}
              {["mygoals", "Inbox"].includes(title) && showInbox && <HeaderBtn path={isInboxOpen ? openEnvelopeIcon : inboxIcon} alt="zinzen inbox" />}
              <HeaderBtn path={verticalDots} alt="zinzen settings" />
            </div>
          </>
        )}
    </div>
  );
};
export default Header;
