import { onRequestGet as __api_health_ts_onRequestGet } from "C:\\Users\\hephz\\Documents\\CODEBASE\\edureport-ng\\edureport-ng-next\\functions\\api\\health.ts"
import { onRequest as __api___route___ts_onRequest } from "C:\\Users\\hephz\\Documents\\CODEBASE\\edureport-ng\\edureport-ng-next\\functions\\api\\[[route]].ts"
import { onRequest as ___middleware_ts_onRequest } from "C:\\Users\\hephz\\Documents\\CODEBASE\\edureport-ng\\edureport-ng-next\\functions\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_ts_onRequestGet],
    },
  {
      routePath: "/api/:route*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___route___ts_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]