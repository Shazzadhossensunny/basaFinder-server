import { model, Schema } from 'mongoose';
import { ListingModel, TListing } from './listing.interface';

const listingSchema = new Schema<TListing, ListingModel>(
  {
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rent: {
      type: Number,
      required: [true, 'Rent amount is required'],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
    },
    landlordId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Landlord ID is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Listing = model<TListing, ListingModel>('Listing', listingSchema);
