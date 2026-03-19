import mongoose from 'mongoose';

const docTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      default: '#1e3a8a',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('DocType', docTypeSchema);
