import { Frown } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const Page404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200">
      <h1 className="text-7xl font-semibold">404</h1>
      <p className="text-2xl opacity-50">Oops, This Page Not Found!</p>
      <Link className="mt-2 btn btn-md btn-primary btn-active" to={"/rooms"}>
        Go back to home
      </Link>
    </div>
  );
};

export default Page404;
