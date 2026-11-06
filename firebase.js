
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjy4yO8H0kwMTUxSfxUnMyMliJv1OAtGo",
  authDomain: "duo-arcade-37dcb.firebaseapp.com",
  projectId: "duo-arcade-37dcb",
  storageBucket: "duo-arcade-37dcb.firebasestorage.app",
  messagingSenderId: "1077016969496",
  appId: "1:1077016969496:web:93f7b9ccf3578393005e6d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app,"https://duo-arcade-37dcb-default-rtdb.firebaseio.com");

export {
  app,
  db,
  ref,
  set,
  get,
  update,
  onValue,
  remove
};
