import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Listing } from './listing.model';
import { TListing } from './listing.interface';
import { ListingSearchableFields } from './listing.constant';
import { USER_ROLE } from '../User/user.constant';
import mongoose from 'mongoose';

const createListing = async (payload: TListing, user: any) => {
  if (payload.landlordId === user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized!');
  }
  // Ensure the user is a landlord
  if (user.role !== USER_ROLE.landlord) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only landlords can create listings',
    );
  }

  // Set the landlordId to the current user's ID
  payload.landlordId = new mongoose.Types.ObjectId(user.id);

  const result = await Listing.create(payload);
  return result;
};

const getAllListings = async (query: Record<string, unknown>) => {
  const listingQuery = new QueryBuilder(
    Listing.find().populate('landlordId', 'name email phoneNumber -_id'),
    query,
  )
    .search(ListingSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getLandlordListings = async (
  landlordId: string,
  query: Record<string, unknown>,
) => {
  const listingQuery = new QueryBuilder(Listing.find({ landlordId }), query)
    .search(ListingSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getListingById = async (id: string) => {
  const listing = await Listing.findById(id).populate(
    'landlordId',
    'name email -_id',
  );

  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Listing not found');
  }

  return listing;
};

const updateListing = async (
  id: string,
  payload: Partial<TListing>,
  user: any,
) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Listing not found');
  }

  // Check if user is admin or the landlord of this listing
  if (
    user.role !== USER_ROLE.admin &&
    listing.landlordId.toString() !== user.id.toString()
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this listing',
    );
  }

  const result = await Listing.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteListing = async (id: string, user: any) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Listing not found');
  }

  // Check if user is admin or the landlord of this listing
  if (
    user.role !== USER_ROLE.admin &&
    listing.landlordId.toString() !== user.id.toString()
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to delete this listing',
    );
  }

  const result = await Listing.findByIdAndDelete(id);
  return result;
};

export const ListingServices = {
  createListing,
  getAllListings,
  getLandlordListings,
  getListingById,
  updateListing,
  deleteListing,
};
