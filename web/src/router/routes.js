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
  {
    path: "/codebook",
    component: () => import("pages/Codebook.vue"),
    props: true,
    meta: {
      requiresAuth: true, // This route does not require authentication
      requiresEditor: true,
    },
  },
  {
    path: "/admin",
    component: () => import("pages/Admin.vue"),
    props: true,
    meta: {
      requiresAuth: true, // This route does not require authentication
      requiresAdmin: true,
    },

    children: [
      {
        path: "",
        component: () => import("pages/Recordings.vue"),
        props: true,
      },
      {
        path: "users",
        component: () => import("pages/Users.vue"),
        props: true,
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
