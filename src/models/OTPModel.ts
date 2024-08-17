import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

interface IOTP extends Document {
    email: string;
    otp: number;
    password: string;
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
        password: {
            type: String,
        },

        // deletes the otp automatically at 1 minute (50 seconds to account for latency)
        createdAt: { type: Date, default: Date.now, expires: "50s" },
    },
    { timestamps: true },
);

// Add virtual fields
OTPSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

// Not allowing any udpates
OTPSchema.pre("findOneAndUpdate", async function (next) {
    next(
        new Error(
            "findOneAndUpdate: Updates are not allowed for OTP documents.",
        ),
    );
});

OTPSchema.pre("updateOne", async function (next) {
    next(
        new Error(
            "findOneAndUpdate: Updates are not allowed for OTP documents.",
        ),
    );
});

OTPSchema.pre("updateMany", async function (next) {
    next(
        new Error(
            "findOneAndUpdate: Updates are not allowed for OTP documents.",
        ),
    );
});

OTPSchema.pre("save", async function (next) {
    // Not allowing any updates for this document via save method
    if (!this.isNew) {
        next(new Error("save: Updates are not allowed for OTP documents."));
    }

    // Hashing passwords before save
    if (this.password) {
        const salt = await bcrypt.genSalt(); // generates a salt
        this.password = await bcrypt.hash(this.password, salt); // hashes the password
    }
});

// Ensure virtual fields are serialised.
OTPSchema.set("toJSON", {
    virtuals: true,
});

const OTPModel = mongoose.model<IOTP>("OTPs", OTPSchema);

export default OTPModel;
