export interface Category {
  id: number;
  categoria: string;
  ordem: number;
  salao_id: number;
  status: number;
}

export interface CategoriesResponse {
  code: number;
  data: {
    categories: Category[];
  };
}

export interface Service {
  id: number;
  categoria_id: number;
  salao_id: number;
  servico: string;
  descricao: string;
  tempo: number;
  valor: number | null;
}

export interface ServicesResponse {
  code: number;
  data: {
    salonServices: Service[];
  };
}

export interface AvailableHour {
  professionals: number[];
  schedule: number;
}

export interface AvailableHoursResponse {
  code: number;
  data: {
    available: AvailableHour[];
    interval: string;
    service_time: number | null;
  };
}

export interface Professional {
  id: number;
  nome: string;
  foto: string | null;
  bio: string | null;
  apelido: string;
  tempo: number | null;
  valor: number;
  tempo_padrao: number;
  valor_padrao: number;
}

export interface ProfessionalsResponse {
  code: number;
  data: {
    professionals: Professional[];
    professionalServices: Professional[];
  };
}

export interface ReservationRequest {
  agendamentos: [
    {
      profissional_id: number;
      servico_id: number;
      salao_id: number;
      data: string;
      hora_ini: number;
      profissional_indiferente: number;
      obs: string;
      pagamento_reserva: number;
      email: number;
      email_agendamento: number;
    }
  ];
}

export interface ReservationResponse {
  code: number;
  data: {
    bookings: [
      {
        id: number;
        reserva: {
          id: number;
          salao_id: number;
          servico_id: number;
          profissional_id: number;
          data: string;
          hora_ini: number;
          hora_fim: number;
          valor: number;
          cliente_nome: string;
          cliente_tel: string;
          servicos: string;
          status: number;
        };
        cliente_id: number;
      }
    ];
  };
}

export interface UserSession {
  phoneNumber: string;
  step: number;

  // Category selection
  selectedCategoryId?: number;
  selectedCategoryName?: string;

  // Service selection
  selectedServiceId?: number;
  selectedService?: string;
  selectedServiceDescription?: string;
  selectedServiceDuration?: number;
  selectedServicePrice?: number;

  // Date and time selection
  selectedDate?: string;
  selectedHour?: number;
  selectedHourFormatted?: string;

  // Professional selection
  selectedProfessionalId?: number;
  selectedProfessional?: string;

  // Timestamps
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  lastInteractionAt?: FirebaseFirestore.Timestamp;
}
