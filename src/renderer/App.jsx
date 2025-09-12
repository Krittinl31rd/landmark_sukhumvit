import { createRoot } from "react-dom/client";
import "./index.css";
import AppRoutes from "../routes/AppRoutes";
import { UserProvider } from "../contexts/UserContext";
import { ToastContainer } from "react-toastify";

const App = () => {
  return <AppRoutes />;
};

const root = createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <ToastContainer theme="dark" autoClose={2500} />
    <App />
  </UserProvider>
);
