import { apiClient } from "./client";

// Subscription Plan
export interface SubscriptionPlan {
  id: number;
  name: string;
  period: "daily" | "weekly" | "monthly";
  price: number;
  allowed_payment_methods: string;
  description: string | null;
}

// Initiate Payment Request
export interface InitiateCardPaymentRequest {
  msisdn: string;
  email: string;
  plan_period: "daily" | "weekly" | "monthly";
}

// Initiate Payment Response
export interface InitiatePaymentResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  message?: string;
}

// Subscription Response
export interface SubscriptionResponse {
  id: number;
  player_id: number;
  plan_id: number;
  status: string;
  provider: string;
  starts_at: string;
  ends_at: string;
  auto_renew: boolean;
}

// Verify Payment Response
export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription?: SubscriptionResponse;
}

export const subscriptionAPI = {
  // Get all subscription plans
  getPlans: () => 
    apiClient.get<SubscriptionPlan[]>("/api/v1/subscriptions/plans"),

  // Initiate card payment
  initiateCardPayment: (data: InitiateCardPaymentRequest) =>
    apiClient.post<InitiatePaymentResponse>("/api/v1/subscriptions/initiate-card-payment", data),

  // Verify payment after Paystack callback
  verifyPayment: (reference: string) =>
    apiClient.post<VerifyPaymentResponse>("/api/v1/subscriptions/verify-payment", { reference }),

  // Get active subscription for a player
  getActiveSubscription: (msisdn: string) =>
    apiClient.get<{ has_active_subscription: boolean; subscription?: SubscriptionResponse }>(
      `/api/v1/subscriptions/active/${msisdn}`
    ),
};
