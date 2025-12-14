
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

export interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  url: string;
  ossKey: string;
}

export interface Case {
  id: string; 
  title: string;
  caseRecord: string;
  legalProvisions: LegalProvision[];
  riskSummary: string;
  preventionMeasures: string[]; 
  tags: string[];
  attachments?: Attachment[]; // New field
  createDate: string;
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
  preventionMeasures: { value: string }[];
  tags: string;
  attachments: Attachment[]; // Form now manages attachments
}