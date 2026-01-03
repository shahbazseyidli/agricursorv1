// Price data types
export interface PriceDataPoint {
  date: string;
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  market?: string;
  marketId?: string;
}

export interface ComparisonDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ComparisonSeries {
  key: string;
  name: string;
  color: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface PriceStats {
  latestPrice: {
    priceMin: number;
    priceAvg: number;
    priceMax: number;
    date: Date | string;
    currency: string;
  } | null;
  priceChange: {
    value: number;
    percentage: number;
    direction: "up" | "down" | "stable";
  } | null;
  totalRecords: number;
}

// Filter types
export interface PriceFilters {
  productId?: string;
  marketId?: string;
  dateRange?: "1m" | "3m" | "6m" | "1y" | "all";
  startDate?: Date;
  endDate?: Date;
}

// Upload types
export interface UploadResult {
  success: boolean;
  message: string;
  recordsTotal?: number;
  recordsNew?: number;
  recordsUpdated?: number;
  errors?: string[];
}

// Session extended types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "ADMIN" | "USER";
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "USER";
    image?: string | null;
  }
}

