import { Navigate, createHashRouter } from "react-router-dom";
import Plan from "@/pages/plan";
import PlanDetail from "@/pages/plan-detail";
import SignUp from "./pages/signup";
import SignIn from "./pages/signin";

export const routes = [
  {
    path: "/",
    element: <Navigate to="/signin" replace />,  // 默认重定向到 /signin
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/plan",
    element: <Plan />,
  },
  {
    path: "/plan/:id",
    element: <PlanDetail />,
  },
  {
    path: "*",
    element: <div>404</div>,
  }
];

export const router = createHashRouter(routes);

export default router;
