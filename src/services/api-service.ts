import axios from "axios";
import {
  CategoriesResponse,
  ServicesResponse,
  AvailableHoursResponse,
  ProfessionalsResponse,
  ReservationRequest,
  ReservationResponse,
} from "../types";

const API_BASE_URL = process.env.API_BASE_URL;
const SALON_ID = process.env.SALON_ID;
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: API_AUTH_TOKEN,
  },
});

export const getCategories = async (): Promise<CategoriesResponse> => {
  try {
    const response = await api.get<CategoriesResponse>(
      `/salao/${SALON_ID}/categorias`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getServices = async (
  categoryId: number
): Promise<ServicesResponse> => {
  try {
    const response = await api.get<ServicesResponse>(
      `/salao/${SALON_ID}/categoria/${categoryId}/servicos?agendamento_online=1&status=1`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching services for category ${categoryId}:`, error);
    throw error;
  }
};

export const getAvailableHours = async (
  serviceId: number,
  date: string
): Promise<AvailableHoursResponse> => {
  try {
    const response = await api.get<AvailableHoursResponse>(
      `/salao/${SALON_ID}/servico/${serviceId}/horarios?data=${date}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching available hours for service ${serviceId} on ${date}:`,
      error
    );
    throw error;
  }
};

export const getProfessionalInfo = async (
  serviceId: number,
  professionalId: number
): Promise<ProfessionalsResponse> => {
  try {
    const response = await api.get<ProfessionalsResponse>(
      `/salao/${SALON_ID}/servico/${serviceId}/profissionais?profissional_id=${professionalId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching professional info for professional ${professionalId} and service ${serviceId}:`,
      error
    );
    throw error;
  }
};

export const createReservation = async (
  reservationData: ReservationRequest
): Promise<ReservationResponse> => {
  try {
    const response = await api.post<ReservationResponse>(
      `/salao/${SALON_ID}/reservas`,
      reservationData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating reservation:", error);
    throw error;
  }
};
