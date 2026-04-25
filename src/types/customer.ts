
export interface Customer {
  id: string;
  full_name: string;
  phone_country_code: string;
  phone_number: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  full_name: string;
  phone_country_code: string;
  phone_number: string;
}
