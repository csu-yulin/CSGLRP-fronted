
export interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
}

// Wrapper for standard API response
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LoginData {
  token: string;
  tokenType: string;
  expiresIn: number;
  userInfo: User;
}

// Domain Types matching Backend DTOs
export interface LegalProvision {
  lawName: string;
  content: string;
}

export interface Case {
  id: string; // Backend sends "id" in Result wrapper, or we map _id to id
  title: string;
  caseRecord: string; // Formerly content
  legalProvisions: LegalProvision[]; // Formerly regulations
  riskSummary: string;
  preventionMeasures: string[]; // Formerly preventativeMeasures
  tags: string[];
  createDate: string; // Formerly createdAt
  updateDate: string;
  author: string;
}

export interface TagStat {
  tag: string;
  count: number;
}

// Form Data specific types (for UI state management)
export interface CaseFormData {
  title: string;
  caseRecord: string;
  legalProvisions: { lawName: string; content: string }[];
  riskSummary: string;
  preventionMeasures: { value: string }[]; // Helper for useFieldArray
  tags: string; // Helper for comma separated input
}
