import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  timeout: 120000,
});

export function apiError(error: unknown): string {
  return axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Request failed';
}
