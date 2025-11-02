import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import AppleStrategy from "passport-apple";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, profile: any, accessToken: string, refreshToken: string) {
  user.id = profile.id;
  user.email = profile.emails?.[0]?.value;
  user.firstName = profile.name?.givenName || "";
  user.lastName = profile.name?.familyName || "";
  user.profileImageUrl = profile.photos?.[0]?.value || "";
  user.access_token = accessToken;
  user.refresh_token = refreshToken;
}

async function upsertUser(profile: any) {
  await storage.upsertUser({
    id: profile.id,
    email: profile.emails?.[0]?.value,
    firstName: profile.name?.givenName || "",
    lastName: profile.name?.familyName || "",
    profileImageUrl: profile.photos?.[0]?.value || "",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      await upsertUser(profile);
      const user: any = {};
      updateUserSession(user, profile, accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  // GitHub OAuth Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: process.env.GITHUB_CALLBACK_URL!,
    scope: ["user:email"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      await upsertUser(profile);
      const user: any = {};
      updateUserSession(user, profile, accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  // Apple OAuth Strategy
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID!,
    teamID: process.env.APPLE_TEAM_ID!,
    keyID: process.env.APPLE_KEY_ID!,
    privateKeyString: process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    callbackURL: process.env.APPLE_CALLBACK_URL!,
    passReqToCallback: false,
    scope: ['name', 'email'],
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      await upsertUser(profile);
      const user: any = {};
      updateUserSession(user, profile, accessToken, refreshToken);
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google OAuth routes
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/dashboard");
    });

  // GitHub OAuth routes
  app.get("/auth/github", passport.authenticate("github"));
  app.get("/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/dashboard");
    });

  // Apple OAuth routes
  app.get("/auth/apple", passport.authenticate("apple"));
  app.post("/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/dashboard");
    });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
