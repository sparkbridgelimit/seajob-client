import { createBrowserRouter } from "react-router-dom";
import Plan from "@/pages/plan";
import PlanDetail from "@/pages/plan-detail";
import SignUp from "./pages/signup";
import SignIn from "./pages/signin";

export const routes = [
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/",
    element: <Plan />,
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

export const router = createBrowserRouter(routes);

export default router;
