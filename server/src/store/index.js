import mongoose from 'mongoose';

/**
 * Storage for contact messages and the visit counter.
 * Uses MongoDB when MONGODB_URI is set, otherwise an in-memory store
 * (handy for local development; data is lost on restart).
 */

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 200 },
    subject: { type: String, maxlength: 150, default: '' },
    message: { type: String, required: true, maxlength: 4000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  value: { type: Number, default: 0 },
});

function mongoStore() {
  const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
  const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
  return {
    kind: 'mongodb',
    async addMessage(data) {
      const doc = await Message.create(data);
      return { id: doc._id.toString(), createdAt: doc.createdAt };
    },
    async listMessages({ limit = 50 } = {}) {
      const docs = await Message.find().sort({ createdAt: -1 }).limit(limit).lean();
      return docs.map(({ _id, __v, ...rest }) => ({ id: _id.toString(), ...rest }));
    },
    async markRead(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      const r = await Message.updateOne({ _id: id }, { read: true });
      return r.matchedCount > 0;
    },
    async incrementVisits() {
      const c = await Counter.findOneAndUpdate({ _id: 'visits' }, { $inc: { value: 1 } }, { upsert: true, new: true });
      return c.value;
    },
    async getVisits() {
      const c = await Counter.findById('visits').lean();
      return c?.value ?? 0;
    },
  };
}

function memoryStore() {
  const messages = [];
  let visits = 0;
  let seq = 0;
  return {
    kind: 'memory',
    async addMessage(data) {
      const msg = { id: String(++seq), ...data, read: false, createdAt: new Date(), updatedAt: new Date() };
      messages.unshift(msg);
      return { id: msg.id, createdAt: msg.createdAt };
    },
    async listMessages({ limit = 50 } = {}) {
      return messages.slice(0, limit);
    },
    async markRead(id) {
      const m = messages.find((x) => x.id === id);
      if (!m) return false;
      m.read = true;
      return true;
    },
    async incrementVisits() {
      return ++visits;
    },
    async getVisits() {
      return visits;
    },
  };
}

export async function createStore(uri) {
  if (!uri) {
    console.warn('[store] MONGODB_URI not set: using in-memory store (data resets on restart).');
    return memoryStore();
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[store] Connected to MongoDB.');
  return mongoStore();
}
