import { apiClient } from "./client";

export interface SendOTPRequest {
  msisdn: string;
  telco: "MTN" | "GLO";
}

export interface VerifyOTPRequest {
  msisdn: string;
  otp: string;
}

export interface ActiveSubscription {
  subscription_id: number;
  sub_status: string;
  sub_active: boolean;
  telco: string;
  traffic_source: string;
  active_product_id: number;
  auto_renewal: boolean;
  starts_date: string;
  ends_date: string;
}

export interface VerifyOTPData {
  service_id: number;
  msisdn: string;
  has_any_subscription: boolean;
  has_active_subscription: boolean;
  active_subscription: ActiveSubscription | null;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: VerifyOTPData;
}

export interface ClientAction {
  action: string;
  redirection_url: string;
}

export interface SubscriptionStatusData {
  service_id: number;
  msisdn: string;
  has_any_subscription: boolean;
  has_active_subscription: boolean;
  active_subscription: ActiveSubscription | null;
  billing_records: any[];
  client_action?: ClientAction;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  data: SubscriptionStatusData;
}

export const authAPI = {
  sendOTP: (data: SendOTPRequest) => apiClient.post<{ success: boolean; message: string }>("/api/v1/auth/send-otp", data),
  verifyOTP: (data: VerifyOTPRequest) => apiClient.post<VerifyOTPResponse>("/api/v1/auth/verify-otp", data),
  checkSubscription: (msisdn: string) => apiClient.get<SubscriptionStatusResponse>(`/api/v1/auth/subscription-status?msisdn=${msisdn}`),
  getPlayer: (msisdn: string) => apiClient.get<any>(`/api/v1/auth/player/${msisdn}`),
  updatePlayer: (msisdn: string, data: { full_name?: string }) => apiClient.patch<any>(`/api/v1/auth/player/${msisdn}`, data),
};
