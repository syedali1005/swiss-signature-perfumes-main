/**
 * orders-store.ts
 * ─────────────────────────────────────────────────────────────────
 * All data access now goes through MongoDB via Mongoose.
 * The old fs / .data file system approach has been removed.
 * ─────────────────────────────────────────────────────────────────
 */

import { connectDB } from './mongodb';
import { OrderModel, AdminUserModel, ProductModel, IAdminUser } from './models';
import { Order, User, Product } from './types';
import { products as initialProducts } from './data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip Mongoose _id / __v fields and return a plain JS object. */
function toPlain<T>(doc: unknown): T {
  if (!doc) return doc as T;
  const obj = (doc as { toObject?: () => Record<string, unknown> }).toObject
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : (doc as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...rest } = obj as { _id?: unknown; __v?: unknown } & Record<string, unknown>;
  return rest as T;
}

// Default super-admin seeded on first run
const DEFAULT_SUPER_ADMIN = {
  id: 'usr_superadmin',
  name: 'Project Owner',
  email: 'admin-panel@swiss-signature.com',
  role: 'super_admin' as const,
  passwordHash: 'Swiss123Signature786',
  createdAt: new Date().toISOString(),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getStoredOrders(): Promise<Order[]> {
  await connectDB();
  const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => {
    const { _id, __v, ...rest } = d as typeof d & { _id?: unknown; __v?: unknown };
    void _id; void __v;
    return rest as unknown as Order;
  });
}

export async function saveOrder(order: Order): Promise<Order> {
  await connectDB();
  await OrderModel.findOneAndUpdate(
    { id: order.id },
    { $set: order },
    { upsert: true, returnDocument: 'after' }
  );
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<Order | null> {
  await connectDB();
  const updated = await OrderModel.findOneAndUpdate(
    { id: orderId },
    { $set: { status } },
    { returnDocument: 'after' }
  ).lean();
  if (!updated) return null;
  const { _id, __v, ...rest } = updated as typeof updated & { _id?: unknown; __v?: unknown };
  void _id; void __v;
  return rest as unknown as Order;
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface StoredUser extends User {
  passwordHash: string;
}

async function ensureDefaultAdmin(): Promise<void> {
  const existing = await AdminUserModel.findOne({ id: DEFAULT_SUPER_ADMIN.id });
  if (!existing) {
    await AdminUserModel.findOneAndUpdate(
      { email: DEFAULT_SUPER_ADMIN.email },
      { $set: DEFAULT_SUPER_ADMIN },
      { upsert: true, returnDocument: 'after' }
    );
  } else {
    // Keep credentials in sync
    await AdminUserModel.updateOne(
      { id: DEFAULT_SUPER_ADMIN.id },
      { $set: { passwordHash: DEFAULT_SUPER_ADMIN.passwordHash, role: DEFAULT_SUPER_ADMIN.role } }
    );
  }
}

export async function getStoredAdmins(): Promise<StoredUser[]> {
  await connectDB();
  await ensureDefaultAdmin();
  const docs = await AdminUserModel.find({}).lean();
  return docs.map((d) => {
    const { _id, __v, ...rest } = d as typeof d & { _id?: unknown; __v?: unknown };
    void _id; void __v;
    return rest as unknown as StoredUser;
  });
}

export async function addAdminUser(
  name: string,
  email: string,
  passwordHash: string,
  role: 'admin' | 'super_admin' = 'admin'
): Promise<User> {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await AdminUserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: normalizedEmail,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await AdminUserModel.create(newUser);

  const { passwordHash: _, ...publicUser } = newUser;
  void _;
  return publicUser;
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function seedProductsIfEmpty(): Promise<void> {
  const count = await ProductModel.countDocuments();
  if (count === 0) {
    await ProductModel.insertMany(initialProducts);
  }
}

export async function getStoredProducts(): Promise<Product[]> {
  await connectDB();
  await seedProductsIfEmpty();
  const docs = await ProductModel.find({}).lean();
  return docs.map((d) => {
    const { _id, __v, ...rest } = d as typeof d & { _id?: unknown; __v?: unknown };
    void _id; void __v;
    return rest as unknown as Product;
  });
}

export async function saveProduct(product: Product): Promise<Product> {
  await connectDB();
  await ProductModel.findOneAndUpdate(
    { $or: [{ id: product.id }, { slug: product.slug }] },
    { $set: product },
    { upsert: true, returnDocument: 'after' }
  );
  return product;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  await connectDB();
  const result = await ProductModel.deleteOne({
    $or: [{ id: productId }, { slug: productId }],
  });
  return result.deletedCount > 0;
}
