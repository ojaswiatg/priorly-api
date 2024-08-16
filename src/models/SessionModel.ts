import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema({
    // Can create mutliple sessions per user
    user: { type: Schema.Types.ObjectId, ref: "Users", required: true },
});

// Add virtual fields
SessionSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

// Making the session read-only - cannot udpate it
SessionSchema.set("versionKey", false);
SessionSchema.set("timestamps", false);

SessionSchema.methods.update = function () {
    throw new Error("Session is read-only");
};

SessionSchema.statics.findOneAndUpdate = function () {
    throw new Error("Session is read-only");
};

const SessionModel = mongoose.model("Sessions", SessionSchema);

export default SessionModel;
