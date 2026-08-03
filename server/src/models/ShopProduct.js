import mongoose from 'mongoose';

const shopProductSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    // References the frontend's static shopProductCatalog config, not
    // a database relation - that catalog is presentation/reference
    // data (names, icons), not something this domain needs to own or
    // validate against server-side. Nullable because a custom
    // (non-catalog) product is possible, matching existing behavior.
    itemId: { type: String, default: null },
    category: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    availability: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
  },
  { timestamps: true }
);

export const ShopProduct = mongoose.model('ShopProduct', shopProductSchema);
