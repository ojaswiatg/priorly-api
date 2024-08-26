import { type Request } from "express";
import passport, { type Profile } from "passport";
import { Strategy as GoogleAuthStrategy } from "passport-google-oauth20";

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
});

passport.use(
    new GoogleAuthStrategy(
        {
            clientID: String(process.env.GOOGLE_OAUTH_CLIENT_ID),
            clientSecret: String(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
            callbackURL:
                String(process.env.ENV_TYPE) === "development"
                    ? "http://localhost:8080/api/oauth/google/callback"
                    : "https://priorly-api.uc.r.appspot.com/api/oauth/google/callback",
            passReqToCallback: true,
            scope: ["profile", "email"],
        },
        function (
            req: Request,
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: (temp: null, user: Express.User) => void,
        ) {
            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Google
            // process.nextTick(async function () {
            //     // try to find the user based on their google id
            //     const emailId = profile.emails?.[0].value;
            //     try {
            //         const foundUser = await UserModel.findOne({
            //             email: emailId,
            //         });
            //         if (!_.isEmpty(foundUser)) {
            //             return done(null, foundUser);
            //         }
            //         const newUser = await UserModel.create({
            //             email: emailId,
            //             name: profile.displayName,
            //             googleAuthToken: accessToken,
            //         });
            //         return done(null, newUser);
            //     } catch (error) {
            //         console.error(error);
            //         return error;
            //     }
            // });
            done(null, profile);
        },
    ),
);

export default passport;
