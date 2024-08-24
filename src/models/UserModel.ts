import bcrypt from "bcrypt";
import mongoose, { Document, Schema, type CallbackError } from "mongoose";
import TodoModel from "./TodoModel";

interface IUser extends Document {
    id: string;
    email: string;
    password: string;
    name: string;
    createdOn: number;
    updatedOn: number;
}
export const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "A valid email is required"],
            unique: [true],
            lowercase: [true], // converts the value to lower case before storing
        },
        password: {
            type: String,
            required: [true, "A valid password is required"],
        },

        name: { type: String, required: false, default: "" },
    },
    { timestamps: true },
);

// Add virtual fields
UserSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

UserSchema.virtual("createdOn").get(function () {
    return new Date(this.createdAt).getTime() / 1000;
});

UserSchema.virtual("updatedOn").get(function () {
    return new Date(this.updatedAt).getTime() / 1000;
});

// Ensure virtual fields are serialised.
UserSchema.set("toJSON", {
    virtuals: true,
});

// Hooks
// Post means after saving the document
UserSchema.post("save", function (_doc, next) {
    // 'save' means save event
    // 'doc' is the saved document
    next(); // this is important for control flow
});

UserSchema.pre("findOneAndUpdate", async function (next) {
    try {
        type TPasswordUpdate = { $set: { password: string } };
        const oldPassword = (this.getUpdate() as TPasswordUpdate).$set.password;

        if (oldPassword) {
            const salt = await bcrypt.genSalt(); // generates a salt
            const hashed = await bcrypt.hash(oldPassword, salt);

            (this.getUpdate() as TPasswordUpdate).$set.password = hashed;
        }
    } catch (error) {
        console.error("Error while hasing password during update");
        console.error(error);
    }

    next();
});

UserSchema.pre("findOneAndDelete", async function (next) {
    // Before deleting the user, delete all its todos and sessions
    try {
        const userId = this.getFilter()._id;
        await TodoModel.deleteMany({ user: userId });
        next();
    } catch (error) {
        console.error(error);
        next(error as CallbackError);
    }
});

const UserModel = mongoose.model<IUser>("Users", UserSchema);

export default UserModel;
