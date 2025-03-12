import { Model, Types } from 'mongoose';

export interface TListing {
  _id: string;
  location: string;
  description: string;
  rent: number;
  bedrooms: number;
  images: string[];
  amenities: string[];
  landlordId: Types.ObjectId;
  isAvailable: boolean;
}

export interface ListingModel extends Model<TListing> {}
