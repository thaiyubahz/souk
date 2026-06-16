import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateProductData {
  product_insert: Product_Key;
}

export interface CreateProductVariables {
  name: string;
  priceFiat: number;
  priceTokens: number;
  stock: number;
  categoryId: UUIDString;
}

export interface CreateRentalBookingData {
  rentalBooking_insert: RentalBooking_Key;
}

export interface CreateRentalBookingVariables {
  userId: UUIDString;
  productId: UUIDString;
  startDate: DateString;
  endDate: DateString;
  status: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  displayName: string;
  tokenBalance: number;
}

export interface ListProductsWithCategoriesData {
  products: ({
    name: string;
    priceFiat: number;
    category: {
      name: string;
    };
  })[];
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface RentalBooking_Key {
  id: UUIDString;
  __typename?: 'RentalBooking_Key';
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateProductRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  operationName: string;
}
export const createProductRef: CreateProductRef;

export function createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;
export function createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateRentalBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRentalBookingVariables): MutationRef<CreateRentalBookingData, CreateRentalBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateRentalBookingVariables): MutationRef<CreateRentalBookingData, CreateRentalBookingVariables>;
  operationName: string;
}
export const createRentalBookingRef: CreateRentalBookingRef;

export function createRentalBooking(vars: CreateRentalBookingVariables): MutationPromise<CreateRentalBookingData, CreateRentalBookingVariables>;
export function createRentalBooking(dc: DataConnect, vars: CreateRentalBookingVariables): MutationPromise<CreateRentalBookingData, CreateRentalBookingVariables>;

interface ListProductsWithCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductsWithCategoriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductsWithCategoriesData, undefined>;
  operationName: string;
}
export const listProductsWithCategoriesRef: ListProductsWithCategoriesRef;

export function listProductsWithCategories(options?: ExecuteQueryOptions): QueryPromise<ListProductsWithCategoriesData, undefined>;
export function listProductsWithCategories(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProductsWithCategoriesData, undefined>;

