use('milosystem');

// Workspace preset connection:
// Milosystem Local MongoDB -> mongodb://127.0.0.1:27017/milosystem

db.documents
  .find(
    {},
    {
      docNo: 1,
      subject: 1,
      fiscalYear: 1,
      files: 1,
      createdAt: 1,
    },
  )
  .sort({ createdAt: -1 })
  .limit(20);

db.getCollection('documentUploads.files')
  .find(
    {},
    {
      filename: 1,
      length: 1,
      contentType: 1,
      uploadDate: 1,
      metadata: 1,
    },
  )
  .sort({ uploadDate: -1 })
  .limit(20);
