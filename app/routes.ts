import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("docs", "routes/docs.tsx", [
    index("routes/docs._index.tsx"),
    route("*", "routes/docs.$.tsx"),
  ]),
] satisfies RouteConfig;
