
export interface ProductColor {
  id: string;
  product_id: string;
  color_name: string;
  hex_code?: string;
}

export interface ProductSize {
  id: string;
  product_id: string;
  size_label: string;
  size_unit?: string;
}

export interface ProductVolume {
  id: string;
  product_id: string;
  volume_value: number;
  volume_unit: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
  brand?: string;
  sku?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  colors?: ProductColor[];
  sizes?: ProductSize[];
  volumes?: ProductVolume[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  brand: string;
  sku: string;
  active: boolean;
  colors: { color_name: string; hex_code: string }[];
  sizes: { size_label: string; size_unit: string }[];
  volumes: { volume_value: string; volume_unit: string }[];
}
