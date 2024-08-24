import { createBrowserRouter } from "react-router-dom";
import Plan from "@/pages/plan";
import PlanDetail from "@/pages/plan-detail";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";

export const routes = [
  {
    path: "/",
    element: <Plan />,
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

export const router = createBrowserRouter(routes);

export default router;
