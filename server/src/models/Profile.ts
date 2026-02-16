import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
    name: string;
    permissions: Record<string, boolean>;
    isStatic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const profileSchema = new Schema<IProfile>({
    name: { type: String, required: true, unique: true },
    permissions: { type: Map, of: Boolean, default: {} },
    isStatic: { type: Boolean, default: false }, // If true, cannot be deleted/renamed (e.g. Admin)
}, {
    timestamps: true
});

const Profile = mongoose.model<IProfile>('Profile', profileSchema);

export default Profile;
