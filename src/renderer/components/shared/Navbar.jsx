import React from "react";
import { useAuth } from "../../../contexts/UserContext";
import DateTime from "./DateTime";
import imageProfile from "../../../../public/images/any.png";

const Navbar = ({ toggleDrawer }) => {
  const { auth, logout } = useAuth();
  return (
    <div className="navbar bg-base-100 border-b border-base-300 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex-none lg:hidden">
        <label
          htmlFor="main-drawer"
          className="btn btn-square btn-ghost"
          onClick={toggleDrawer}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
      </div>
      <div className="flex-1 px-2">
        <h1 className="text-xl font-bold text-primary-content">
          Landmark Sukhumvit
        </h1>
        <DateTime />
      </div>

      {/* profileDropdown */}
      <div className="flex  items-center justify-end px-0 gap-2">
        <div className="flex items-stretch">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="cursor-pointer">
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={imageProfile} />
                </div>
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content bg-base-200 rounded-box z-1 mt-0 w-52 p-2 shadow-sm"
            >
              <div className="w-full border-b  mb-2 py-1 px-2.5">
                <h1 className="font-semibold truncate">
                  {auth?.user?.username}
                </h1>
              </div>
              <li>
                <a onClick={logout}>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
