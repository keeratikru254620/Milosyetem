import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

import mongoose from 'mongoose';

import { getUploadBucket } from '../config/db.js';
import Document from '../models/Document.js';

const toDiskUrlPath = (filePath) => `/uploads/${path.basename(filePath)}`;
const toGridFsUrlPath = (fileId) => `/api/documents/files/${String(fileId)}`;
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));
const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const sanitizeStoredFile = (file) => ({
  originalName: file.originalName,
  fileId: file.fileId ? String(file.fileId) : undefined,
  storedName: file.storedName,
  path: file.path,
  url:
    file.url ||
    (file.fileId ? toGridFsUrlPath(file.fileId) : file.path ? toDiskUrlPath(file.path) : undefined),
  mimeType: file.mimeType,
  size: file.size,
  extractedText: file.extractedText,
  extractedTextPreview: file.extractedTextPreview,
  extractedAt: file.extractedAt,
  semanticKeywords: file.semanticKeywords ?? [],
});

const sanitizeDocument = (document) => ({
  _id: String(document._id),
  docNo: document.docNo || '',
  subject: document.subject || '',
  typeId: String(document.typeId || ''),
  fiscalYear: Number(document.fiscalYear || 0),
  date: document.date || '',
  origin: document.origin || '',
  resp: document.resp || '',
  files: (document.files || []).map(sanitizeStoredFile),
  ownerId: String(document.ownerId || ''),
  createdAt: document.createdAt ? new Date(document.createdAt).toISOString() : new Date().toISOString(),
  searchableContent: document.searchableContent,
  semanticKeywords: document.semanticKeywords ?? [],
  contentIndexedAt: document.contentIndexedAt,
});

const uploadFileToGridFs = async (file, meta = {}) => {
  const bucket = getUploadBucket();
  const uploadStream = bucket.openUploadStream(file.originalname || meta.originalName || 'attachment', {
    contentType: meta.mimeType || file.mimetype || 'application/octet-stream',
    metadata: {
      originalName: meta.originalName || file.originalname || 'attachment',
    },
  });

  Readable.from(file.buffer).pipe(uploadStream);
  await finished(uploadStream);

  return {
    fileId: uploadStream.id,
    storedName: uploadStream.filename,
    mimeType: meta.mimeType || file.mimetype,
    size: meta.size || file.size,
  };
};

const buildStoredFiles = async (uploadedFiles = [], filesMeta = []) => {
  let uploadIndex = 0;
  const uploadedGridFsIds = [];
  const storedFiles = [];

  for (const meta of filesMeta) {
    if (meta.fileId || meta.storedName || meta.path || meta.url) {
      storedFiles.push({
        ...meta,
        fileId: meta.fileId && isObjectId(meta.fileId) ? toObjectId(meta.fileId) : undefined,
        url:
          meta.url ||
          (meta.fileId ? toGridFsUrlPath(meta.fileId) : meta.path ? toDiskUrlPath(meta.path) : undefined),
        semanticKeywords: meta.semanticKeywords ?? [],
      });
      continue;
    }

    const uploadedFile = uploadedFiles[uploadIndex];
    uploadIndex += 1;

    if (!uploadedFile) {
      continue;
    }

    const gridFsFile = await uploadFileToGridFs(uploadedFile, meta);
    uploadedGridFsIds.push(gridFsFile.fileId);

    storedFiles.push({
      originalName: meta.originalName || uploadedFile.originalname || 'attachment',
      fileId: gridFsFile.fileId,
      storedName: gridFsFile.storedName,
      url: toGridFsUrlPath(gridFsFile.fileId),
      mimeType: meta.mimeType || gridFsFile.mimeType,
      size: meta.size || gridFsFile.size,
      extractedText: meta.extractedText,
      extractedTextPreview: meta.extractedTextPreview,
      extractedAt: meta.extractedAt,
      semanticKeywords: meta.semanticKeywords ?? [],
    });
  }

  while (uploadIndex < uploadedFiles.length) {
    const uploadedFile = uploadedFiles[uploadIndex];
    uploadIndex += 1;

    const gridFsFile = await uploadFileToGridFs(uploadedFile);
    uploadedGridFsIds.push(gridFsFile.fileId);
    storedFiles.push({
      originalName: uploadedFile.originalname || 'attachment',
      fileId: gridFsFile.fileId,
      storedName: gridFsFile.storedName,
      url: toGridFsUrlPath(gridFsFile.fileId),
      mimeType: gridFsFile.mimeType,
      size: gridFsFile.size,
      semanticKeywords: [],
    });
  }

  return {
    storedFiles,
    uploadedGridFsIds,
  };
};

const deletePhysicalFiles = async (files = []) => {
  await Promise.all(
    files
      .map((file) => file?.path)
      .filter(Boolean)
      .map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch {
          // ignore cleanup failures
        }
      }),
  );
};

const deleteGridFsFiles = async (files = []) => {
  const bucket = getUploadBucket();

  await Promise.all(
    files
      .map((file) => file?.fileId)
      .filter(Boolean)
      .map(async (fileId) => {
        try {
          await bucket.delete(toObjectId(fileId));
        } catch {
          // ignore cleanup failures
        }
      }),
  );
};

const deleteUploadedGridFsIds = async (fileIds = []) => {
  if (!fileIds.length) {
    return;
  }

  await deleteGridFsFiles(fileIds.map((fileId) => ({ fileId })));
};

const deleteStoredFiles = async (files = []) => {
  await Promise.all([deleteGridFsFiles(files), deletePhysicalFiles(files)]);
};

const getStoredFileKey = (file) => {
  if (file?.fileId) {
    return `gridfs:${String(file.fileId)}`;
  }

  if (file?.storedName) {
    return `disk:${file.storedName}`;
  }

  if (file?.path) {
    return `path:${file.path}`;
  }

  return `name:${file?.originalName || ''}`;
};

export const listDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents.map(sanitizeDocument));
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    res.json(sanitizeDocument(document));
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  let uploadedGridFsIds = [];

  try {
    const filesMeta = parseJsonField(req.body.filesMeta, []);
    const builtFiles = await buildStoredFiles(req.files, filesMeta);
    uploadedGridFsIds = builtFiles.uploadedGridFsIds;
    const document = await Document.create({
      docNo: req.body.docNo || '',
      subject: req.body.subject || '',
      typeId: req.body.typeId,
      fiscalYear: Number(req.body.fiscalYear || new Date().getFullYear() + 543),
      date: req.body.date || '',
      origin: req.body.origin || '',
      resp: req.body.resp || '',
      ownerId: req.body.ownerId || req.user._id,
      files: builtFiles.storedFiles,
      searchableContent: req.body.searchableContent || undefined,
      semanticKeywords: parseJsonField(req.body.semanticKeywords, []),
      contentIndexedAt: req.body.contentIndexedAt || undefined,
    });

    res.status(201).json(sanitizeDocument(document));
  } catch (error) {
    await deleteUploadedGridFsIds(uploadedGridFsIds);
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  let uploadedGridFsIds = [];

  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    const filesMeta = parseJsonField(req.body.filesMeta, []);
    const builtFiles = await buildStoredFiles(req.files, filesMeta);
    uploadedGridFsIds = builtFiles.uploadedGridFsIds;
    const nextFiles = builtFiles.storedFiles;
    const removedFiles = (document.files || []).filter(
      (existingFile) => !nextFiles.some((nextFile) => getStoredFileKey(nextFile) === getStoredFileKey(existingFile)),
    );

    document.docNo = req.body.docNo ?? document.docNo;
    document.subject = req.body.subject ?? document.subject;
    document.typeId = req.body.typeId ?? document.typeId;
    document.fiscalYear = Number(req.body.fiscalYear ?? document.fiscalYear);
    document.date = req.body.date ?? document.date;
    document.origin = req.body.origin ?? document.origin;
    document.resp = req.body.resp ?? document.resp;
    document.ownerId = req.body.ownerId ?? document.ownerId;
    document.files = nextFiles;
    document.searchableContent = req.body.searchableContent || undefined;
    document.semanticKeywords = parseJsonField(req.body.semanticKeywords, []);
    document.contentIndexedAt = req.body.contentIndexedAt || undefined;

    await document.save();
    await deleteStoredFiles(removedFiles);

    res.json(sanitizeDocument(document));
  } catch (error) {
    await deleteUploadedGridFsIds(uploadedGridFsIds);
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    await deleteStoredFiles(document.files);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const streamDocumentFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!isObjectId(fileId)) {
      res.status(400);
      throw new Error('Invalid file id');
    }

    const document = await Document.findOne({ 'files.fileId': toObjectId(fileId) });

    if (!document) {
      res.status(404);
      throw new Error('File not found');
    }

    const file = document.files.find((item) => String(item.fileId) === fileId);
    const bucket = getUploadBucket();
    const bucketFile = await bucket.find({ _id: toObjectId(fileId) }).next();

    if (!file || !bucketFile) {
      res.status(404);
      throw new Error('File content not found');
    }

    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    const fileName = encodeURIComponent(file.originalName || bucketFile.filename || 'attachment');
    res.setHeader('Content-Type', file.mimeType || bucketFile.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${fileName}`);

    bucket.openDownloadStream(toObjectId(fileId)).on('error', next).pipe(res);
  } catch (error) {
    next(error);
  }
};
