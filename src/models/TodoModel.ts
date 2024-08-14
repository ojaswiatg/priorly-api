import mongoose, { Schema } from "mongoose";

const TodoSchema = new Schema(
    {
        title: { type: String, required: [true, "Title is required"] },
        description: { type: String, required: false, default: "" },

        deadline: { type: Number, required: false, default: null },
        reminder: { type: Number, required: false, default: null },

        isDone: { type: Boolean, required: false, default: false },
        completedOn: { type: Number, required: false, default: null },

        isDeleted: { type: Boolean, required: false, default: false },
        deletedOn: { type: Number, required: false, default: null },

        priority: { type: Number, required: false, default: 0 },
        isImportant: { type: Boolean, required: false, default: false },
        isUrgent: { type: Boolean, required: false, default: false },

        user: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    },
    { timestamps: true },
);

// Add virtual fields
TodoSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

TodoSchema.virtual("createdOn").get(function () {
    return new Date(this.createdAt).getTime() / 1000;
});
TodoSchema.virtual("updatedOn").get(function () {
    return new Date(this.updatedAt).getTime() / 1000;
});

// Ensure virtual fields are serialised.
TodoSchema.set("toJSON", {
    virtuals: true,
});

const TodoModel = mongoose.model("Todos", TodoSchema);

export default TodoModel;
