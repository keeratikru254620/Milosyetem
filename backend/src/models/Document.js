import mongoose from 'mongoose';

const storedFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileId: mongoose.Schema.Types.ObjectId,
    storedName: String,
    path: String,
    url: String,
    mimeType: String,
    size: Number,
    extractedText: String,
    extractedTextPreview: String,
    extractedAt: String,
    semanticKeywords: [String],
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    docNo: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocType',
      required: true,
    },
    fiscalYear: Number,
    date: String,
    origin: String,
    resp: String,
    files: [storedFileSchema],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    searchableContent: String,
    semanticKeywords: [String],
    contentIndexedAt: String,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Document', documentSchema);
