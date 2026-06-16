import { CreateUserData, CreateUserVariables, CreateProductData, CreateProductVariables, CreateRentalBookingData, CreateRentalBookingVariables, ListProductsWithCategoriesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useCreateProduct(options?: useDataConnectMutationOptions<CreateProductData, FirebaseError, CreateProductVariables>): UseDataConnectMutationResult<CreateProductData, CreateProductVariables>;
export function useCreateProduct(dc: DataConnect, options?: useDataConnectMutationOptions<CreateProductData, FirebaseError, CreateProductVariables>): UseDataConnectMutationResult<CreateProductData, CreateProductVariables>;

export function useCreateRentalBooking(options?: useDataConnectMutationOptions<CreateRentalBookingData, FirebaseError, CreateRentalBookingVariables>): UseDataConnectMutationResult<CreateRentalBookingData, CreateRentalBookingVariables>;
export function useCreateRentalBooking(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRentalBookingData, FirebaseError, CreateRentalBookingVariables>): UseDataConnectMutationResult<CreateRentalBookingData, CreateRentalBookingVariables>;

export function useListProductsWithCategories(options?: useDataConnectQueryOptions<ListProductsWithCategoriesData>): UseDataConnectQueryResult<ListProductsWithCategoriesData, undefined>;
export function useListProductsWithCategories(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductsWithCategoriesData>): UseDataConnectQueryResult<ListProductsWithCategoriesData, undefined>;
