import type { EOTPOperation } from "#constants";
import bcrypt from "bcrypt";
import mongoose, { Document, Schema } from "mongoose";

interface IOTP extends Document {
    email: string;
    name?: string;
    otp: number;
    password?: string;
    createdOn: number;
    operation: EOTPOperation;
}

export const OTPSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "A valid email is required"],
            unique: [true],
            lowercase: [true], // converts the value to lower case before storing
        },
        name: { type: String, required: false, default: "" },
        otp: {
            type: Number,
            unique: [true],
            required: [true, "OTP is required"],
        },
        password: {
            type: String,
        },

        operation: {
            type: Number,
            required: [true, "A valid operation is required"],
        },

        // deletes the otp automatically after 10 minutes - manually delete after successful operation
        createdAt: { type: Date, default: Date.now, expires: 600 },
    },
    { timestamps: true },
);

// Add virtual fields
OTPSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

// Not allowing any udpates
OTPSchema.pre("findOneAndUpdate", async function () {
    throw new Error(
        "findOneAndUpdate: Updates are not allowed for OTP documents",
    );
});

OTPSchema.pre("updateOne", async function () {
    throw new Error(
        "findOneAndUpdate: Updates are not allowed for OTP documents",
    );
});

OTPSchema.pre("updateMany", async function () {
    throw new Error("updateMany: Updates are not allowed for OTP documents");
});

OTPSchema.pre("save", async function (next) {
    // Not allowing any updates for this document via save method
    if (!this.isNew) {
        throw new Error("save: Updates are not allowed for OTP documents.");
    }

    // Hashing passwords before save
    if (this.password) {
        const salt = await bcrypt.genSalt(); // generates a salt
        this.password = await bcrypt.hash(this.password, salt); // hashes the password
    }
    next();
});

// Ensure virtual fields are serialised.
OTPSchema.set("toJSON", {
    virtuals: true,
});

const OTPModel = mongoose.model<IOTP>("OTPs", OTPSchema);

export default OTPModel;
