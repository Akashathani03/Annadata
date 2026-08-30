import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { storageProvider } from '../../../storage/index.js';
import * as listingRepository from '../../../repositories/listing.repository.js';
import * as cropRepository from '../../../repositories/crop.repository.js';
import * as userRepository from '../../../repositories/user.repository.js';

const UNITS_BY_CATEGORY = {
  crop: ['Kg', 'Quintal', 'Ton', 'Bag'],
  animal: ['Head'],
  equipment: ['Unit'],
};

const VALID_CONDITIONS = ['new', 'used-good', 'used-fair'];

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// itemId is deliberately not in this list - it's category-conditionally
// required (see assertValidItemForCategory), not universally required,
// since a crop listing may legitimately have no catalog itemId at all.
const REQUIRED_LISTING_FIELDS = ['category', 'itemName', 'quantity', 'unit', 'price', 'phone'];

// The explicit set of fields a farmer may edit via PATCH /listings/:id.
// Closes a mass-assignment gap where the raw request body previously
// reached listingRepository.update() unfiltered - status, ownerId,
// views, soldAt, buyerId, buyerName, saleAmount, category, and the
// Mongo-managed _id/createdAt/updatedAt fields must never be settable
// this way. status specifically stays owner-controlled only through
// markListingSold's dedicated transition rule (published -> closed),
// never through this generic edit path - see the note on
// updateListing below for the one known, deliberate consequence of
// this.
const EDITABLE_LISTING_FIELDS = [
  'itemId',
  'itemName',
  'quantity',
  'unit',
  'price',
  'description',
  'condition',
  'apmcId',
  'apmcName',
  'location',
  'locationVillage',
  'locationArea',
  'locationTaluk',
  'locationDistrict',
  'locationState',
  'lat',
  'lng',
  'phone',
  'photoUrls',
];

function pickEditableFields(payload) {
  const result = {};
  for (const key of EDITABLE_LISTING_FIELDS) {
    if (payload[key] !== undefined) result[key] = payload[key];
  }
  return result;
}

// Explicit, before Mongoose ever sees the payload - a missing field is
// a clear, expected user mistake (a farmer skipped a step), not a
// server bug, and deserves a clean 400 naming exactly what's missing,
// not a generic 500 from an uncaught Mongoose ValidationError.
function assertRequiredFields(payload) {
  const missing = REQUIRED_LISTING_FIELDS.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
  if (missing.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', `Missing required field(s): ${missing.join(', ')}.`);
  }
}

// Same pattern as conversation.service.js's assertValidObjectId - a
// malformed id is an input-validation problem, not a "not found"
// problem, and should never surface as a raw, unhandled Mongoose
// CastError falling through to a generic 500.
function assertValidObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${fieldName} is not a valid id.`);
  }
}

function toListingShape(listing) {
  return { ...listing.toObject(), id: listing._id.toString() };
}

// Public browse - always forces status:'published' regardless of any
// client-supplied value. Visibility rules are never trusted from the
// client, same principle as every other domain service in this
// backend.
export async function getListings({ category, query, itemId, priceMax, condition, lat, lng, radiusKm, page, limit } = {}) {
  await assertValidSearchItemId(itemId, category);
  assertValidSearchPriceMax(priceMax);
  assertValidSearchCondition(condition);
  assertValidSearchRadius(radiusKm, lat, lng);

  // status is always 'published' here, never caller-supplied - the
  // one hardcoded line every marketplace search path (Buy Crops/Buy
  // Animals/Buy Equipment today, a future Agro AI search tool later)
  // relies on to never leak a draft or closed listing, regardless of
  // what a caller passes.
  const { items, total } = await listingRepository.findAll({
    category,
    status: 'published',
    query,
    itemId,
    priceMax,
    condition,
    lat,
    lng,
    radiusKm,
    page,
    limit,
  });
  return { listings: items.map(toListingShape), total, page: page ?? 1, limit: limit ?? 20 };
}

export async function getMyListings(ownerId, { category, status, page, limit } = {}) {
  const { items, total } = await listingRepository.findByOwner({ ownerId, category, status, page, limit });
  return { listings: items.map(toListingShape), total, page: page ?? 1, limit: limit ?? 20 };
}

// Derived from the Listing lifecycle, not a separate collection
// (approved decision) - closed AND soldAt present distinguishes an
// actual sale from any other future closure reason, even though
// today closed only ever happens via a sale.
export async function getMySales(ownerId, { page, limit } = {}) {
  const { items, total } = await listingRepository.findSalesByOwner({ ownerId, page, limit });
  return { sales: items.map(toListingShape), total, page: page ?? 1, limit: limit ?? 20 };
}

// viewerId is optional (the route this backs is public) - a draft is
// only visible to its own owner; anonymous or any other viewer gets
// the same "not found" as a genuinely missing listing, never
// confirming a draft exists to anyone but its owner.
export async function getListingById(id, viewerId) {
  assertValidObjectId(id, 'id');
  const listing = await listingRepository.findById(id);
  if (!listing) return null;
  if (listing.status === 'draft' && listing.ownerId.toString() !== viewerId) {
    return null;
  }
  return toListingShape(listing);
}

// Purpose-specific, minimal - only ever returns a display name, never
// the full User document. Reuses the exact same draft-visibility rule
// as getListingById above (a draft's seller is no more visible to a
// buyer than the draft itself), rather than a general-purpose
// getUserById exposed to the marketplace.
export async function getListingSeller(id, viewerId) {
  assertValidObjectId(id, 'id');
  const listing = await listingRepository.findById(id);
  if (!listing) return null;
  if (listing.status === 'draft' && listing.ownerId.toString() !== viewerId) {
    return null;
  }

  const seller = await userRepository.findById(listing.ownerId);
  if (!seller) return null;

  return { name: seller.name || 'Farmer' };
}

async function assertValidItemForCategory(itemId, category) {
  if (!itemId) {
    // A crop listing may legitimately name something outside the
    // catalog (a local/uncommon variety) - itemName is the required,
    // trustworthy field in that case (see Listing.js), and there's
    // simply no market-price lookup possible for it. Animal/equipment
    // listings stay catalog-only - no signal they need this escape
    // hatch, and loosening them isn't part of this fix.
    if (category === 'crop') return;
    throw new ApiError(400, 'VALIDATION_ERROR', `itemId is required for ${category} listings.`);
  }
  const item = await cropRepository.findById(itemId);
  if (!item || item.category !== category) {
    throw new ApiError(400, 'VALIDATION_ERROR', `itemId does not reference a valid ${category} catalog item.`);
  }
}

function assertValidUnitForCategory(unit, category) {
  if (!UNITS_BY_CATEGORY[category].includes(unit)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `unit "${unit}" is not valid for category "${category}".`);
  }
}

function assertValidConditionForCategory(condition, category) {
  if (category !== 'equipment') return;
  if (!VALID_CONDITIONS.includes(condition)) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      `condition must be one of ${VALID_CONDITIONS.join(', ')} for equipment listings.`
    );
  }
}

// Search-specific validators, deliberately separate from the
// create-focused ones above - search filters are all optional and
// apply regardless of category (a condition filter against a
// crop/animal search simply matches nothing, since those listings
// always have condition:null - no special-casing needed), whereas
// the create validators above are category-mandatory.
async function assertValidSearchItemId(itemId, category) {
  if (!itemId || !category) return; // only validated when both are given together
  await assertValidItemForCategory(itemId, category);
}

function assertValidSearchPriceMax(priceMax) {
  if (priceMax == null) return;
  if (typeof priceMax !== 'number' || Number.isNaN(priceMax) || priceMax < 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'priceMax must be a non-negative number.');
  }
}

function assertValidSearchCondition(condition) {
  if (condition == null) return;
  if (!VALID_CONDITIONS.includes(condition)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `condition must be one of ${VALID_CONDITIONS.join(', ')}.`);
  }
}

function assertValidSearchRadius(radiusKm, lat, lng) {
  if (radiusKm == null) return;
  if (typeof radiusKm !== 'number' || Number.isNaN(radiusKm) || radiusKm <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'radiusKm must be a positive number.');
  }
  if (lat == null || lng == null) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'lat and lng are required when radiusKm is supplied.');
  }
}

const MAX_LISTING_PHOTOS = 4;

// imageFiles is the multer-populated array from upload.array('photos', 4)
// (empty/undefined when the request had no files, e.g. a JSON-only
// PATCH elsewhere). Validated and saved as a batch, in the order the
// farmer added them - the first is always the listing's primary
// thumbnail everywhere it's shown as one image.
async function saveListingPhotos(imageFiles) {
  const files = imageFiles ?? [];
  if (files.length === 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'At least one photo is required.');
  }
  if (files.length > MAX_LISTING_PHOTOS) {
    throw new ApiError(400, 'VALIDATION_ERROR', `A listing can have at most ${MAX_LISTING_PHOTOS} photos.`);
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new ApiError(
        400,
        'INVALID_FILE_TYPE',
        `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`
      );
    }
  }
  const saved = await Promise.all(
    files.map((file) => storageProvider.saveFile(file.buffer, { mimeType: file.mimetype }))
  );
  return saved.map((s) => s.url);
}

export async function createListing(ownerId, payload, imageFiles) {
  assertRequiredFields(payload);
  await assertValidItemForCategory(payload.itemId, payload.category);
  assertValidUnitForCategory(payload.unit, payload.category);
  assertValidConditionForCategory(payload.condition, payload.category);

  if (payload.category === 'animal' && payload.apmcId) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'apmcId is not valid for animal listings.');
  }

  const photoUrls = await saveListingPhotos(imageFiles);

  const listing = await listingRepository.insert({
    ownerId,
    ownerType: 'farmer',
    category: payload.category,
    itemId: payload.itemId,
    itemName: payload.itemName,
    quantity: payload.quantity,
    unit: payload.unit,
    price: payload.price,
    description: payload.description ?? '',
    photoUrls,
    condition: payload.category === 'equipment' ? payload.condition : null,
    apmcId: payload.category === 'crop' ? payload.apmcId ?? null : null,
    apmcName: payload.apmcName ?? '',
    location: payload.location ?? '',
    locationVillage: payload.locationVillage ?? '',
    locationArea: payload.locationArea ?? '',
    locationTaluk: payload.locationTaluk ?? '',
    locationDistrict: payload.locationDistrict ?? '',
    locationState: payload.locationState ?? '',
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    phone: payload.phone,
    status: payload.status ?? 'draft',
  });

  return toListingShape(listing);
}

async function assertOwnsListing(ownerId, id) {
  assertValidObjectId(id, 'id');
  const listing = await listingRepository.findById(id);
  // 404, not 403 - never confirm another owner's listing even exists.
  if (!listing || listing.ownerId.toString() !== ownerId) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }
  return listing;
}

export async function updateListing(ownerId, id, payload) {
  const listing = await assertOwnsListing(ownerId, id);

  if (listing.status === 'closed') {
    throw new ApiError(409, 'LISTING_CLOSED', 'A closed listing cannot be edited.');
  }

  // Only re-validate fields actually present in this patch, not the
  // full create-time set - a partial update may not touch these at all.
  const effectiveCategory = payload.category ?? listing.category;
  if (payload.itemId) {
    await assertValidItemForCategory(payload.itemId, effectiveCategory);
  }
  if (payload.unit) {
    assertValidUnitForCategory(payload.unit, effectiveCategory);
  }
  if (effectiveCategory === 'animal' && payload.apmcId) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'apmcId is not valid for animal listings.');
  }

  const editableFields = pickEditableFields(payload);
  const updated = await listingRepository.update(id, editableFields);
  return toListingShape(updated);
}

// The one status transition with a real business rule attached -
// only a published listing can close via a sale, and closing always
// records what was sold. buyerId stays optional/null under every
// current code path (no real authenticated buyer in this flow), kept
// for forward compatibility only, per the approved refinement.
export async function markListingSold(ownerId, id, { quantitySold, saleAmount, buyerName, buyerId } = {}) {
  const listing = await assertOwnsListing(ownerId, id);

  if (listing.status !== 'published') {
    throw new ApiError(409, 'INVALID_TRANSITION', 'Only a published listing can be marked sold.');
  }

  const updated = await listingRepository.update(id, {
    status: 'closed',
    soldQuantity: quantitySold ?? listing.quantity,
    saleAmount: saleAmount ?? null,
    buyerName: buyerName ?? null,
    buyerId: buyerId ?? null,
    soldAt: new Date(),
  });

  return toListingShape(updated);
}

export async function deleteListing(ownerId, id) {
  await assertOwnsListing(ownerId, id);
  return listingRepository.remove(id);
}
