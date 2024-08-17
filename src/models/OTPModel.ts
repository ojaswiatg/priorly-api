import mongoose, { Schema, Document } from "mongoose";

interface IOTP extends Document {
    email: string;
    createdOn: number;
}

export const OTPSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "A valid email is required"],
            unique: [true],
            lowercase: [true], // converts the value to lower case before storing
        },
        otp: {
            type: Number,
            unique: [true],
        },
    },
    { timestamps: true },
);

// Add virtual fields
OTPSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

OTPSchema.virtual("createdOn").get(function () {
    return new Date(this.createdAt).getTime() / 1000;
});

// Preventing updates - making the model read-only
OTPSchema.pre("save", function (next) {
    if (this.isModified()) {
        next(new Error("Updates are not allowed for this document."));
    } else {
        next();
    }
});

// Ensure virtual fields are serialised.
OTPSchema.set("toJSON", {
    virtuals: true,
});

const OTPModel = mongoose.model<IOTP>("Users", OTPSchema);

export default OTPModel;
