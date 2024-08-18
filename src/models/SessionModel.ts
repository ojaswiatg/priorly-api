import _ from "lodash";
import mongoose, { Document, Schema } from "mongoose";
import UserModel, { UserSchema } from "./UserModel";

interface ISession extends Document {
    id: string;
    userId: string;
    createdOn: number;
    email: string;
    user: typeof UserSchema;
}

export const SessionSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    },
    { timestamps: true },
);

// Add virtual fields
SessionSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

SessionSchema.virtual("userId").get(function () {
    return this.user._id.toHexString();
});

SessionSchema.virtual("createdOn").get(function () {
    return new Date(this.createdAt).getTime() / 1000;
});

// Not allowing any udpates
SessionSchema.pre("findOneAndUpdate", async function () {
    throw new Error(
        "findOneAndUpdate: Updates are not allowed for session documents",
    );
});

SessionSchema.pre("updateOne", async function () {
    throw new Error(
        "findOneAndUpdate: Updates are not allowed for session documents",
    );
});

SessionSchema.pre("updateMany", async function () {
    throw new Error(
        "updateMany: Updates are not allowed for session documents",
    );
});

SessionSchema.pre("save", async function (next) {
    if (!this.isNew) {
        throw new Error("save: Updates are not allowed for session documents");
    } else {
        try {
            const user = await UserModel.findById(this.user._id);
            if (_.isEmpty(user)) {
                throw new Error(
                    `User not found with this user id: ${this.user._id}`,
                );
            }
            next();
        } catch (error) {
            console.error("Failed to create session for user: ", this.user._id);
            console.error(error);
        }
    }
});

// Ensure virtual fields are serialised.
SessionSchema.set("toJSON", {
    virtuals: true,
});

const SessionModel = mongoose.model<ISession>("Sessions", SessionSchema);

export default SessionModel;
