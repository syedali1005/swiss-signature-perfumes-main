import mongoose, { Schema, Document, Model, models } from 'mongoose';

// ─── Order Model ────────────────────────────────────────────────────────────

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVolume: string;
  image?: string;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface IOrder extends Document {
  id: string;
  createdAt: string;
  customer: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'card' | 'paypal';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  notes?: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    selectedVolume: { type: String, required: true },
    image: { type: String },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true, default: 'Pakistan' },
    postalCode: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    id: { type: String, required: true, unique: true },
    createdAt: { type: String, required: true },
    customer: { type: ShippingAddressSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cod', 'card', 'paypal'],
      required: true,
      default: 'cod',
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      required: true,
      default: 'Pending',
    },
    notes: { type: String },
  },
  { timestamps: false }
);

// ─── Admin User Model ────────────────────────────────────────────────────────

export interface IAdminUser extends Document {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'user';
  passwordHash: string;
  createdAt: string;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'super_admin', 'user'], required: true, default: 'admin' },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// ─── Product Model ───────────────────────────────────────────────────────────

export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: 'men' | 'women' | 'unisex' | 'gift-set';
  fragranceFamily: string;
  volume: string[];
  description: string;
  longDescription: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  rating: number;
  reviewCount: number;
  badge?: 'new' | 'bestseller' | 'limited';
  inStock: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String, required: true },
    images: { type: [String], required: true, default: [] },
    category: {
      type: String,
      enum: ['men', 'women', 'unisex', 'gift-set'],
      required: true,
    },
    fragranceFamily: { type: String, required: true },
    volume: { type: [String], required: true, default: ['50ml'] },
    description: { type: String, required: true },
    longDescription: { type: String, required: true },
    notes: {
      top: { type: [String], required: true, default: [] },
      heart: { type: [String], required: true, default: [] },
      base: { type: [String], required: true, default: [] },
    },
    rating: { type: Number, required: true, default: 5.0 },
    reviewCount: { type: Number, required: true, default: 0 },
    badge: { type: String, enum: ['new', 'bestseller', 'limited'] },
    inStock: { type: Boolean, required: true, default: true },
  },
  { timestamps: false }
);

// ─── Review Model ────────────────────────────────────────────────────────────

export interface IReview extends Document {
  id: string;
  productId?: string;
  name: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

const ReviewSchema = new Schema<IReview>(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String },
    name: { type: String, required: true },
    avatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true },
    text: { type: String, required: true },
    verified: { type: Boolean, required: true, default: true },
  },
  { timestamps: false }
);

// ─── Newsletter Model ────────────────────────────────────────────────────────

export interface INewsletterSubscriber extends Document {
  email: string;
  subscribedAt: string;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subscribedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// ─── Export Models (prevent recompilation in dev hot-reload) ─────────────────

export const OrderModel: Model<IOrder> =
  (models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);

export const AdminUserModel: Model<IAdminUser> =
  (models.AdminUser as Model<IAdminUser>) || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

export const UserModel = AdminUserModel;

export const ProductModel: Model<IProduct> =
  (models.Product as Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema);

export const ReviewModel: Model<IReview> =
  (models.Review as Model<IReview>) || mongoose.model<IReview>('Review', ReviewSchema);

export const NewsletterSubscriberModel: Model<INewsletterSubscriber> =
  (models.NewsletterSubscriber as Model<INewsletterSubscriber>) ||
  mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);

