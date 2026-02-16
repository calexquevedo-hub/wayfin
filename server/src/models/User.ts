import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    profile: mongoose.Types.ObjectId;
    active: boolean;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    isAdmin: boolean; // Deprecated, use profile instead
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
    },
    active: {
        type: Boolean,
        default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
