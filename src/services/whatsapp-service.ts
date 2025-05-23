import { createBot } from "whatsapp-cloud-api";
import { Category, Service, AvailableHour, Professional } from "../types";
import { formatHour } from "./session-service";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: envFile });

// WhatsApp Cloud API configuration
const whatsapp = createBot(
  process.env.WHATSAPP_ACCESS_TOKEN || "your-access-token",
  process.env.WHATSAPP_PHONE_NUMBER_ID || "your-phone-number-id"
);

export const sendText = async ({
  recipientPhone,
  message,
}: {
  recipientPhone: string;
  message: string;
}): Promise<void> => {
  try {
    await whatsapp.sendText(recipientPhone, message);
  } catch (error) {
    console.error("Error sending text message:", error);
    throw error;
  }
};

export const sendWelcomeMessage = async (to: string): Promise<void> => {
  try {
    const message =
      "Olá, bem vindo a Western Barber Shop!\nEm que podemos te ajudar?";

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: message,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "schedule",
                  title: "Agendar",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "instagram",
                  title: "Instagram",
                },
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending welcome message:", error);
    throw error;
  }
};

export const sendCategoriesList = async (
  to: string,
  categories: Category[]
): Promise<void> => {
  try {
    const rows = categories.map((category) => ({
      id: `category_${category.id}`,
      title: category.categoria,
      description: "",
    }));

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Selecione uma categoria:",
          },
          action: {
            button: "Ver categorias",
            sections: [
              {
                title: "Categorias disponíveis",
                rows,
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending categories list:", error);
    throw error;
  }
};

export const sendServicesList = async (
  to: string,
  services: Service[]
): Promise<void> => {
  try {
    const rows = services.map((service) => ({
      id: `service_${service.id}`,
      title: service.servico,
      description: service.descricao || "",
    }));

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Selecione um serviço:",
          },
          action: {
            button: "Ver serviços",
            sections: [
              {
                title: "Serviços disponíveis",
                rows,
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending services list:", error);
    throw error;
  }
};

export const sendDatePicker = async (to: string): Promise<void> => {
  try {
    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "Selecione a data desejada:",
          },
          action: {
            buttons: [
              {
                type: "calendar",
                calendar: {
                  title: "Selecione a data",
                  description: "Escolha uma data para o agendamento",
                  minDate: new Date().toISOString().split("T")[0],
                  maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  initialDate: new Date().toISOString().split("T")[0],
                  timezone: "America/Sao_Paulo",
                },
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending date picker:", error);
    throw error;
  }
};

export const sendAvailableHours = async (
  to: string,
  availableHours: AvailableHour[]
): Promise<void> => {
  try {
    const rows = availableHours.map((hour) => ({
      id: `hour_${hour.schedule}`,
      title: formatHour(hour.schedule),
      description: "",
    }));

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "Selecione um horário:",
          },
          action: {
            button: "Ver horários",
            sections: [
              {
                title: "Horários disponíveis",
                rows,
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending available hours:", error);
    throw error;
  }
};

export const sendProfessionalsList = async (
  to: string,
  professionals: Professional[]
): Promise<void> => {
  try {
    if (professionals.length <= 3) {
      const buttons = professionals.map((professional) => ({
        type: "reply",
        reply: {
          id: `professional_${professional.id}`,
          title: professional.nome,
        },
      }));

      await whatsapp.sendMessage(
        to,
        JSON.stringify({
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: "Selecione um profissional:",
            },
            action: {
              buttons,
            },
          },
        })
      );
    } else {
      const rows = professionals.map((professional) => ({
        id: `professional_${professional.id}`,
        title: professional.nome,
        description: "",
      }));

      await whatsapp.sendMessage(
        to,
        JSON.stringify({
          type: "interactive",
          interactive: {
            type: "list",
            body: {
              text: "Selecione um profissional:",
            },
            action: {
              button: "Ver profissionais",
              sections: [
                {
                  title: "Profissionais disponíveis",
                  rows,
                },
              ],
            },
          },
        })
      );
    }
  } catch (error) {
    console.error("Error sending professionals list:", error);
    throw error;
  }
};

export const sendConfirmationMessage = async (
  to: string,
  date: string,
  hour: string,
  service: string,
  professional: string
): Promise<void> => {
  try {
    const messageText = `Data ${date} - ${hour}\nServiço: ${service}\nProfissional: ${professional}`;

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: messageText,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "confirm",
                  title: "Confirmar e Agendar",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "cancel",
                  title: "Cancelar",
                },
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending confirmation message:", error);
    throw error;
  }
};

export const sendSuccessMessage = async (to: string): Promise<void> => {
  try {
    await whatsapp.sendText(to, "Horário reservado com sucesso. Obrigado.");
  } catch (error) {
    console.error("Error sending success message:", error);
    throw error;
  }
};

export const sendFailureMessage = async (to: string): Promise<void> => {
  try {
    await whatsapp.sendText(
      to,
      "Não foi possível realizar o agendamento, por favor, agende por esse link:"
    );

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "Agende por aqui:",
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "schedule_link",
                  title: "Agendar",
                },
              },
            ],
          },
        },
      })
    );

    await whatsapp.sendText(to, process.env.SCHEDULE_URL || "");
  } catch (error) {
    console.error("Error sending failure message:", error);
    throw error;
  }
};

export const handleInstagramButton = async (to: string): Promise<void> => {
  try {
    const instagramUrl = process.env.INSTAGRAM_URL || "";

    await whatsapp.sendMessage(
      to,
      JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "Clique no botão abaixo para acessar nosso Instagram:",
          },
          action: {
            buttons: [
              {
                type: "url",
                url: {
                  url: instagramUrl,
                  title: "Abrir Instagram",
                },
              },
            ],
          },
        },
      })
    );
  } catch (error) {
    console.error("Error sending Instagram button:", error);
    throw error;
  }
};
