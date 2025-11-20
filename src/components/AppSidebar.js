import React from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
} from "@coreui/react";

import CIcon from "@coreui/icons-react";
import { AppSidebarNav } from "./AppSidebarNav";

import navigation from "../_nav"; // <-- already filtered by role
import { sygnet } from "src/assets/brand/sygnet";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);

  return (
    <CSidebar
      className="border-end"
      colorScheme="light"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: "set", sidebarShow: visible });
      }}
    >
      {/* ======== SIDEBAR HEADER ======== */}
      <CSidebarHeader className="border-bottom bg-primary">
        <CSidebarBrand to="/">
          <img src="/images/logo.png" alt="Logo" height={50} />
          <CIcon
            customClassName="sidebar-brand-narrow"
            icon={sygnet}
            height={32}
          />
        </CSidebarBrand>

        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: "set", sidebarShow: false })}
        />
      </CSidebarHeader>

      {/* ======== SIDEBAR NAV ======== */}
      <AppSidebarNav items={navigation} />
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
