import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDatabase, getUploadBucket } from './config/db.js';
import DocType from './models/DocType.js';
import Document from './models/Document.js';
import User from './models/User.js';

const ensureUser = async ({ username, email, password, name, role, phone }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { username },
    {
      username,
      email,
      password: hashedPassword,
      name,
      role,
      phone,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

const ensureDocType = async ({ name, color }) =>
  DocType.findOneAndUpdate(
    { name },
    { name, color },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

const ensureDocument = async ({
  docNo,
  subject,
  typeId,
  fiscalYear,
  date,
  origin,
  resp,
  ownerId,
  searchableContent,
  semanticKeywords,
}) =>
  Document.findOneAndUpdate(
    { docNo },
    {
      docNo,
      subject,
      typeId,
      fiscalYear,
      date,
      origin,
      resp,
      ownerId,
      files: [],
      searchableContent,
      semanticKeywords,
      contentIndexedAt: new Date().toISOString(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

const uploadSeedFile = async ({ fileName, content, contentType }) => {
  const bucket = getUploadBucket();
  const existingFile = await bucket.find({ filename: fileName }).sort({ uploadDate: -1 }).next();

  if (existingFile) {
    return {
      fileId: existingFile._id,
      storedName: existingFile.filename,
      url: `/api/documents/files/${String(existingFile._id)}`,
      mimeType: existingFile.contentType || contentType,
      size: existingFile.length,
    };
  }

  const uploadStream = bucket.openUploadStream(fileName, {
    contentType,
    metadata: { seeded: true, originalName: fileName },
  });

  uploadStream.end(Buffer.from(content, 'utf8'));

  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });

  return {
    fileId: uploadStream.id,
    storedName: uploadStream.filename,
    url: `/api/documents/files/${String(uploadStream.id)}`,
    mimeType: contentType,
    size: Buffer.byteLength(content, 'utf8'),
  };
};

const ensureDocumentAttachment = async ({
  docNo,
  fileName,
  content,
  contentType = 'text/plain; charset=utf-8',
  extractedText,
  semanticKeywords = [],
}) => {
  const document = await Document.findOne({ docNo });

  if (!document) {
    throw new Error(`Cannot attach seed file because document ${docNo} was not found`);
  }

  const existingFile = (document.files || []).find((file) => file.originalName === fileName);

  if (existingFile) {
    return;
  }

  const uploadedFile = await uploadSeedFile({ fileName, content, contentType });
  document.files.push({
    originalName: fileName,
    fileId: uploadedFile.fileId,
    storedName: uploadedFile.storedName,
    url: uploadedFile.url,
    mimeType: uploadedFile.mimeType,
    size: uploadedFile.size,
    extractedText,
    extractedTextPreview: extractedText?.slice(0, 240),
    extractedAt: extractedText ? new Date().toISOString() : undefined,
    semanticKeywords,
  });

  await document.save();
};

const seed = async () => {
  await connectDatabase();

  const adminUser = await ensureUser({
    username: 'admin',
    email: 'admin@example.com',
    password: '1234',
    name: 'ผู้ดูแลระบบ',
    role: 'admin',
    phone: '0800000000',
  });

  const officerUser = await ensureUser({
    username: 'officer1',
    email: 'officer1@example.com',
    password: '1234',
    name: 'เจ้าหน้าที่ระบบ',
    role: 'officer',
    phone: '0811111111',
  });

  const generalUser = await ensureUser({
    username: 'general1',
    email: 'general1@example.com',
    password: '1234',
    name: 'ผู้ใช้งานทั่วไป',
    role: 'general',
    phone: '0822222222',
  });

  const orderDocType = await ensureDocType({
    name: 'คำสั่ง',
    color: '#1e3a8a',
  });

  const officialLetterDocType = await ensureDocType({
    name: 'หนังสือราชการ',
    color: '#2563eb',
  });

  const memoDocType = await ensureDocType({
    name: 'บันทึกข้อความ',
    color: '#16a34a',
  });

  const announcementDocType = await ensureDocType({
    name: 'ประกาศ',
    color: '#f59e0b',
  });

  await ensureDocument({
    docNo: 'CCIB-001/2569',
    subject: 'เอกสารตัวอย่างสำหรับทดสอบระบบ',
    typeId: officialLetterDocType._id,
    fiscalYear: 2569,
    date: '2026-03-24',
    origin: 'กก.1 บก.สอท.1',
    resp: 'ผู้ดูแลระบบ',
    ownerId: adminUser._id,
    searchableContent: 'เอกสารตัวอย่างสำหรับทดสอบระบบ หนังสือราชการ ทดสอบค้นหาเอกสาร',
    semanticKeywords: ['เอกสารตัวอย่าง', 'หนังสือราชการ', 'ทดสอบระบบ'],
  });

  await ensureDocument({
    docNo: 'CCIB-002/2569',
    subject: 'คำสั่งแต่งตั้งเจ้าหน้าที่ประจำโครงการ',
    typeId: orderDocType._id,
    fiscalYear: 2569,
    date: '2026-03-20',
    origin: 'ฝ่ายอำนวยการ',
    resp: 'เจ้าหน้าที่ระบบ',
    ownerId: officerUser._id,
    searchableContent: 'คำสั่งแต่งตั้งเจ้าหน้าที่ ประจำโครงการ ฝ่ายอำนวยการ',
    semanticKeywords: ['คำสั่ง', 'แต่งตั้ง', 'เจ้าหน้าที่', 'โครงการ'],
  });

  await ensureDocument({
    docNo: 'CCIB-003/2569',
    subject: 'ประกาศกำหนดแนวทางการรับส่งเอกสาร',
    typeId: announcementDocType._id,
    fiscalYear: 2569,
    date: '2026-03-18',
    origin: 'งานสารบรรณ',
    resp: 'ผู้ใช้งานทั่วไป',
    ownerId: generalUser._id,
    searchableContent: 'ประกาศ แนวทาง การรับส่งเอกสาร งานสารบรรณ',
    semanticKeywords: ['ประกาศ', 'รับส่งเอกสาร', 'สารบรรณ'],
  });

  await ensureDocument({
    docNo: 'CCIB-004/2569',
    subject: 'บันทึกข้อความสรุปผลการประชุมประจำเดือน',
    typeId: memoDocType._id,
    fiscalYear: 2569,
    date: '2026-03-15',
    origin: 'กลุ่มงานแผนและงบประมาณ',
    resp: 'ผู้ดูแลระบบ',
    ownerId: adminUser._id,
    searchableContent: 'บันทึกข้อความ สรุปผล การประชุม ประจำเดือน แผน งบประมาณ',
    semanticKeywords: ['บันทึกข้อความ', 'ประชุม', 'งบประมาณ', 'สรุปผล'],
  });

  await ensureDocumentAttachment({
    docNo: 'CCIB-001/2569',
    fileName: 'ccib-system-overview.txt',
    content: [
      'เอกสารตัวอย่างสำหรับทดสอบระบบจัดเก็บเอกสารราชการ',
      'ใช้สำหรับตรวจสอบการอัปโหลดและจัดเก็บไฟล์ใน MongoDB GridFS',
      'หน่วยงาน: กก.1 บก.สอท.1',
    ].join('\n'),
    extractedText:
      'เอกสารตัวอย่างสำหรับทดสอบระบบจัดเก็บเอกสารราชการ ใช้สำหรับตรวจสอบการอัปโหลดและจัดเก็บไฟล์ใน MongoDB GridFS หน่วยงาน กก.1 บก.สอท.1',
    semanticKeywords: ['ทดสอบระบบ', 'GridFS', 'กก.1 บก.สอท.1'],
  });

  await ensureDocumentAttachment({
    docNo: 'CCIB-002/2569',
    fileName: 'project-order-summary.txt',
    content: [
      'คำสั่งแต่งตั้งเจ้าหน้าที่ประจำโครงการ',
      'ฝ่ายอำนวยการกำหนดรายชื่อผู้รับผิดชอบหลักและผู้ประสานงาน',
      'ใช้สำหรับอ้างอิงในการบริหารโครงการและติดตามงาน',
    ].join('\n'),
    extractedText:
      'คำสั่งแต่งตั้งเจ้าหน้าที่ประจำโครงการ ฝ่ายอำนวยการกำหนดรายชื่อผู้รับผิดชอบหลักและผู้ประสานงาน ใช้สำหรับอ้างอิงในการบริหารโครงการและติดตามงาน',
    semanticKeywords: ['คำสั่ง', 'แต่งตั้ง', 'โครงการ'],
  });

  console.log('Seed completed successfully');
  console.log('Users ready for login:');
  console.log('admin / 1234');
  console.log('officer1 / 1234');
  console.log('general1 / 1234');
};

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
