export interface Product {
    id: number | string;
    name: string;
    seller: string;
    category: string;
    price: number;
    unit: string;
    rating: number;
    reviews: number;
    badge: string | null;
    type: string;
    location: string;
    img: string;
    tags: string[];
    description: string;
    sellerPhone: string;
    sellerId?: string;
    ownerDeviceId?: string;
    qty?: number;
}