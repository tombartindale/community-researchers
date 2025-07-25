import { defineRouter } from "#q-app/wrappers";
import {
  createRouter,
  createWebHistory,
  // createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { getCurrentUser } from "vuefire";
import { db } from "boot/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "@firebase/auth";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = createWebHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath

    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    // console.log('Navigating to:', to.meta)
    // Add any global navigation guards here if needed
    const currentUser = await getCurrentUser();
    if (to.path.includes("login") && currentUser) return "/";

    if (to.meta.requiresAuth) {
      console.log("This route requires authentication:", to.fullPath);
      console.log("Current user:", currentUser);
      // if the user is not logged in, redirect to the login page
      if (!currentUser) {
        return {
          path: "/login",
          query: {
            // we keep the current path in the query so we can
            // redirect to it after login with
            // `router.push(route.query.redirect || '/')`
            // redirect: to.fullPath,
          },
        };
      }

      const userDat = await getDoc(doc(db, `users/${currentUser.email}`));

      //check whitelist:
      if (!userDat.exists()) {
        await getAuth().signOut();
        return {
          path: "/login/notuser",
        };
      }

      currentUser.profile = userDat.data();

      if (
        to.meta.requiresEditor &&
        !(currentUser.profile.isEditor || currentUser.profile.isAdmin)
      )
        return {
          path: "/",
        };

      if (to.meta.requiresAdmin && !currentUser.profile.isAdmin)
        return {
          path: "/",
        };
    }
  });

  return Router;
});
