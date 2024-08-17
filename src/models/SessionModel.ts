import mongoose, { Schema } from "mongoose";

export const SessionSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "A valid email is required"],
            unique: [true],
            lowercase: [true], // converts the value to lower case before storing
        },
    },
    { timestamps: true },
);

// Add virtual fields
SessionSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

SessionSchema.virtual("createdOn").get(function () {
    return new Date(this.createdAt).getTime() / 1000;
});

// Preventing updates - making the model read-only
SessionSchema.pre("save", function (next) {
    if (this.isModified()) {
        next(new Error("Updates are not allowed for this document."));
    } else {
        next();
    }
});

// Ensure virtual fields are serialised.
SessionSchema.set("toJSON", {
    virtuals: true,
});

const SessionModel = mongoose.model("Sessions", SessionSchema);

export default SessionModel;
