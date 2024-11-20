import { Navigate, Outlet, createHashRouter } from "react-router-dom";
import Plan from "@/pages/plan";
import PlanDetail from "@/pages/plan-detail";
import SignUp from "./pages/signup";
import SignIn from "./pages/signin";
import Layout from "./layout";
import Resume from "./pages/resume";

export const routes = [
  {
    path: "/",
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [
      {
        path: "/",
        element: <Navigate to="/plan" replace />,
      },
      {
        path: "plan",
        element: <Plan />,
      },
      {
        path: "plan/:id",
        element: <PlanDetail />,
      },
      {
        path: "resume",
        element: <Resume />,
      },
    ],
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
  },
];

export const router = createHashRouter(routes);

export default router;
