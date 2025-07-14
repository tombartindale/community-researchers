const routes = [
  {
    path: "/",
    component: () => import("pages/Dashboard.vue"),
    meta: {
      requiresAuth: true, // This route does not require authentication
    },
  },
  {
    path: "/login",
    component: () => import("pages/Login.vue"),
  },
  {
    path: "/upload",
    component: () => import("pages/Upload.vue"),
    meta: {
      requiresAuth: true, // This route does not require authentication
    },
  },
  {
    path: "/code/:id",
    component: () => import("pages/Code.vue"),
    props: true,
    meta: {
      requiresAuth: true, // This route does not require authentication
    },
  },
  {
    path: "/group/:email",
    component: () => import("pages/Group.vue"),
    props: true,
    meta: {
      requiresAuth: true, // This route does not require authentication
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
