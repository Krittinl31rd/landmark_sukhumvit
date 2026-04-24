import {
  createBrowserRouter,
  RouterProvider,
  createHashRouter,
} from "react-router-dom";
import Login from "../renderer/pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../renderer/pages/Dashboard";
import Layout from "../renderer/components/Layout";
import Room from "../renderer/pages/Room";
import Setting from "../renderer/pages/Setting";
import SettingRoom from "../renderer/pages/SettingRoom";
import RoomControl from "../renderer/pages/RoomControl";
import RoomsList from "../renderer/pages/RoomsList";
import Page404 from "../renderer/pages/Page404";

// const router = createHashRouter([
//   {
//     path: "/",
//     element: <Login />,
//   },
//   {
//     path: "/",
//     element: (
//       <ProtectedRoute>
//         <Layout />
//       </ProtectedRoute>
//     ),
//     errorElement: <Page404 />,
//     children: [
//       {
//         path: "/setting",
//         element: <Setting />,
//       },
//       {
//         path: "/setting_room",
//         element: <SettingRoom />,
//       },
//       {
//         path: "/rooms",
//         element: <Room />,
//       },
//       {
//         path: "/rooms_control",
//         element: <RoomsList />,
//       },
//       {
//         path: "/rooms_control/:room_id",
//         element: <RoomControl />,
//       },
//       { path: "*", element: <Page404 /> },
//     ],
//   },
// ]);

const router = createHashRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <Page404 />,
    children: [
      {
        path: "/setting",
        element: (
          <ProtectedRoute allowRoles={[1]}>
            <Setting />
          </ProtectedRoute>
        ),
      },
      {
        path: "/setting_room",
        element: (
          <ProtectedRoute allowRoles={[1]}>
            <SettingRoom />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rooms",
        element: (
          <ProtectedRoute allowRoles={[1, 2]}>
            <Room />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rooms_control",
        element: (
          <ProtectedRoute allowRoles={[1, 2]}>
            <RoomsList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rooms_control/:room_id",
        element: (
          <ProtectedRoute allowRoles={[1, 2]}>
            <RoomControl />
          </ProtectedRoute>
        ),
      },
      {
        path: "/403",
        element: <div className="text-center text-red-500">403 Forbidden</div>,
      },
      { path: "*", element: <Page404 /> },
    ],
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
