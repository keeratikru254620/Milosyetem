import fs from 'node:fs/promises';
import path from 'node:path';

import Document from '../models/Document.js';

const toUrlPath = (filePath) => `/uploads/${path.basename(filePath)}`;

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
  storedName: file.storedName,
  path: file.path,
  url: file.url,
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

const buildStoredFiles = (uploadedFiles = [], filesMeta = []) => {
  let uploadIndex = 0;

  return filesMeta.map((meta) => {
    if (meta.storedName || meta.path || meta.url) {
      return {
        ...meta,
        semanticKeywords: meta.semanticKeywords ?? [],
      };
    }

    const uploadedFile = uploadedFiles[uploadIndex];
    uploadIndex += 1;

    return {
      originalName: meta.originalName || uploadedFile?.originalname || 'attachment',
      storedName: uploadedFile?.filename,
      path: uploadedFile?.path,
      url: uploadedFile ? toUrlPath(uploadedFile.path) : undefined,
      mimeType: meta.mimeType || uploadedFile?.mimetype,
      size: meta.size || uploadedFile?.size,
      extractedText: meta.extractedText,
      extractedTextPreview: meta.extractedTextPreview,
      extractedAt: meta.extractedAt,
      semanticKeywords: meta.semanticKeywords ?? [],
    };
  });
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
  try {
    const filesMeta = parseJsonField(req.body.filesMeta, []);
    const document = await Document.create({
      docNo: req.body.docNo || '',
      subject: req.body.subject || '',
      typeId: req.body.typeId,
      fiscalYear: Number(req.body.fiscalYear || new Date().getFullYear() + 543),
      date: req.body.date || '',
      origin: req.body.origin || '',
      resp: req.body.resp || '',
      ownerId: req.body.ownerId || req.user._id,
      files: buildStoredFiles(req.files, filesMeta),
      searchableContent: req.body.searchableContent || undefined,
      semanticKeywords: parseJsonField(req.body.semanticKeywords, []),
      contentIndexedAt: req.body.contentIndexedAt || undefined,
    });

    res.status(201).json(sanitizeDocument(document));
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }

    const filesMeta = parseJsonField(req.body.filesMeta, []);
    const nextFiles = buildStoredFiles(req.files, filesMeta);
    const removedFiles = (document.files || []).filter(
      (existingFile) =>
        !nextFiles.some(
          (nextFile) =>
            nextFile.storedName &&
            existingFile.storedName &&
            nextFile.storedName === existingFile.storedName,
        ),
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
    await deletePhysicalFiles(removedFiles);

    res.json(sanitizeDocument(document));
  } catch (error) {
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

    await deletePhysicalFiles(document.files);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
