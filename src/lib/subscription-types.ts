export interface StorePackage {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  productLimit: number;
  subscriptionDuration: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionTransaction {
  id: string;
  storeId: string;
  packageId: string;
  amount: number;
  currency: string;
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded";
  paymentMethod: string;
  paymentGatewayResponse?: Record<string, unknown>;
  errorMessage?: string;
  zaincashRequestId?: string;
  paidAt?: string;
  notes?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePackageAssignment {
  id: string;
  storeId: string;
  packageId: string;
  assignedBy?: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  customProductLimit?: number;
  customSubscriptionDuration?: number;
  customPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionNotification {
  id: string;
  storeId: string;
  packageId: string;
  notificationType: string;
  title: string;
  message: string;
  isSent: boolean;
  sentAt?: string;
  emailAddress?: string;
  whatsappNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPaymentRequest {
  storeId: string;
  packageId: string;
  storeEmail: string;
  storeName: string;
  ownerName: string;
  whatsappNumber: string;
  ipAddress?: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transactionId?: string;
  zaincashTransactionId?: string;
  paymentUrl?: string;
  amount?: number;
  currency?: string;
  message: string;
  error?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  transactionId: string;
  status: string;
  paidAt?: string;
  message: string;
  error?: string;
}

export interface RenewSubscriptionResponse {
  success: boolean;
  transactionId?: string;
  zaincashTransactionId?: string;
  paymentUrl?: string;
  amount?: number;
  currency?: string;
  currentExpiresAt?: string;
  message: string;
  error?: string;
}

export interface SubscriptionAuditLog {
  id: string;
  storeId?: string;
  transactionId?: string;
  action: string;
  statusBefore?: string;
  statusAfter?: string;
  details?: Record<string, unknown>;
  errorDetails?: Record<string, unknown>;
  actorId?: string;
  actorType: string;
  ipAddress?: string;
  createdAt: string;
}
