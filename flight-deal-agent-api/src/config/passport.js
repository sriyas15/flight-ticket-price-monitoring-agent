import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import env from "./env.js";
import logger from "./logger.js";
import UserRepository from "../modules/users/user.repository.js";

/**
 * Passport Google OAuth 2.0 strategy.
 *
 * We use passport ONLY for the OAuth handshake — not for session management.
 * After Google verifies the user, we issue our own JWT pair and redirect
 * to the frontend. No passport sessions are used.
 */
export const configurePassport = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID:     env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL:  env.GOOGLE_CALLBACK_URL,
        scope:        ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email     = profile.emails?.[0]?.value?.toLowerCase();
          const googleId  = profile.id;
          const firstName = profile.name?.givenName  ?? profile.displayName?.split(" ")[0] ?? "User";
          const lastName  = profile.name?.familyName ?? "";
          const avatar    = profile.photos?.[0]?.value ?? null;

          if (!email) {
            return done(new Error("No email returned from Google"), null);
          }

          // 1. Already linked via googleId → just return the user
          let user = await UserRepository.findByGoogleId(googleId);
          if (user) {
            logger.debug(`Google OAuth: existing Google user ${user.email}`);
            return done(null, user);
          }

          // 2. Email exists as a local account → merge (link Google to it)
          user = await UserRepository.findByEmail(email);
          if (user) {
            user = await UserRepository.updateById(user._id, {
              googleId,
              authProvider: "google",
              // Don't overwrite firstName/lastName if already set
              ...(avatar && { avatar }),
            });
            logger.info(`Google OAuth: merged Google into existing account ${user.email}`);
            return done(null, user);
          }

          // 3. Brand new user → create account (no password)
          user = await UserRepository.create({
            firstName,
            lastName,
            email,
            googleId,
            authProvider: "google",
            ...(avatar && { avatar }),
          });
          logger.info(`Google OAuth: new user created ${user.email}`);
          return done(null, user);
        } catch (err) {
          logger.error(`Google OAuth strategy error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );

  // No serializeUser/deserializeUser needed — we don't use sessions
  logger.info("Google OAuth strategy configured");
};

export default passport;