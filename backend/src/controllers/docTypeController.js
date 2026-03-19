import DocType from '../models/DocType.js';

const sanitizeDocType = (docType) => ({
  _id: String(docType._id),
  name: docType.name,
  color: docType.color,
});

export const listDocTypes = async (req, res, next) => {
  try {
    const docTypes = await DocType.find().sort({ name: 1 });
    res.json(docTypes.map(sanitizeDocType));
  } catch (error) {
    next(error);
  }
};

export const createDocType = async (req, res, next) => {
  try {
    const docType = await DocType.create({
      name: req.body.name,
      color: req.body.color || '#1e3a8a',
    });
    res.status(201).json(sanitizeDocType(docType));
  } catch (error) {
    next(error);
  }
};

export const updateDocType = async (req, res, next) => {
  try {
    const docType = await DocType.findById(req.params.id);

    if (!docType) {
      res.status(404);
      throw new Error('Document type not found');
    }

    if (req.body.name !== undefined) docType.name = req.body.name;
    if (req.body.color !== undefined) docType.color = req.body.color;

    await docType.save();
    res.json(sanitizeDocType(docType));
  } catch (error) {
    next(error);
  }
};

export const deleteDocType = async (req, res, next) => {
  try {
    const docType = await DocType.findByIdAndDelete(req.params.id);

    if (!docType) {
      res.status(404);
      throw new Error('Document type not found');
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
