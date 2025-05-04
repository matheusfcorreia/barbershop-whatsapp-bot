import {
  getOrCreateSession,
  updateSession,
  formatHour,
} from "../services/session-service";
import * as whatsappService from "../services/whatsapp-service";
import * as apiService from "../services/api-service";
import { UserSession, ReservationRequest } from "../types";

// Handles the initial message and button clicks
export const handleIncomingMessage = async (
  from: string,
  message: string,
  buttonId?: string
): Promise<void> => {
  try {
    // Get or create session
    const session = await getOrCreateSession(from);

    // If session was just created (step 1), send welcome message
    if (session.step === 1) {
      await whatsappService.sendWelcomeMessage(from);
      return;
    }

    // Handle button clicks
    if (buttonId === "schedule" || message.toLowerCase().includes("agendar")) {
      await handleScheduleFlow(session);
      return;
    }

    if (buttonId === "instagram") {
      await whatsappService.handleInstagramButton(from);
      return;
    }

    // If it's a text message (not a button click) and not step 1, resend current step options
    if (!buttonId && session.step > 1) {
      await resendCurrentStepOptions(session);
      return;
    }

    // Process based on current step in the flow
    switch (session.step) {
      case 1:
        // Initial welcome message
        await whatsappService.sendWelcomeMessage(from);
        break;
      case 2:
        // User selected a category from the list
        await handleCategorySelection(session, message);
        break;
      case 3:
        // User selected a service from the list
        await handleServiceSelection(session, message);
        break;
      case 4:
        // User entered a date
        await handleDateSelection(session, message);
        break;
      case 5:
        // User selected an hour
        await handleHourSelection(session, message);
        break;
      case 6:
        // User selected a professional
        await handleProfessionalSelection(session, message, buttonId);
        break;
      case 7:
        // User confirmed or canceled the reservation
        await handleConfirmation(session, buttonId);
        break;
      default:
        // Reset to step 1 if we reach an unknown state
        session.step = 1;
        await updateSession(session);
        await whatsappService.sendWelcomeMessage(from);
        break;
    }
  } catch (error) {
    console.error(`Error handling message from ${from}:`, error);
    // Send error message
    await whatsappService.sendFailureMessage(from);
  }
};

// Step 1 to 2: Start the scheduling flow
const handleScheduleFlow = async (session: UserSession): Promise<void> => {
  try {
    // Fetch categories
    const categoriesResponse = await apiService.getCategories();
    if (
      categoriesResponse.code === 200 &&
      categoriesResponse.data.categories.length > 0
    ) {
      // Send categories list
      await whatsappService.sendCategoriesList(
        session.phoneNumber,
        categoriesResponse.data.categories
      );
      // Update session to next step
      session.step = 2;
      await updateSession(session);
    } else {
      throw new Error("Failed to fetch categories");
    }
  } catch (error) {
    console.error("Error in handle schedule flow:", error);
    throw error;
  }
};

// Step 2 to 3: Handle category selection
const handleCategorySelection = async (
  session: UserSession,
  message: string
): Promise<void> => {
  try {
    // Extract category ID from message (format: "category_123")
    const categoryIdMatch = message.match(/category_(\d+)/);
    if (categoryIdMatch && categoryIdMatch[1]) {
      const categoryId = parseInt(categoryIdMatch[1], 10);

      // Fetch services for the selected category
      const servicesResponse = await apiService.getServices(categoryId);
      if (
        servicesResponse.code === 200 &&
        servicesResponse.data.salonServices.length > 0
      ) {
        // Find the selected category to get its name
        const categoriesResponse = await apiService.getCategories();
        if (categoriesResponse.code === 200) {
          const selectedCategory = categoriesResponse.data.categories.find(
            (cat) => cat.id === categoryId
          );
          if (selectedCategory) {
            session.selectedCategoryName = selectedCategory.categoria;
          }
        }

        // Send services list
        await whatsappService.sendServicesList(
          session.phoneNumber,
          servicesResponse.data.salonServices
        );
        // Update session with selected category and move to next step
        session.selectedCategoryId = categoryId;
        session.step = 3;
        await updateSession(session);
      } else {
        throw new Error(`No services found for category ID ${categoryId}`);
      }
    } else {
      // Invalid category selection
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.code === 200) {
        await whatsappService.sendCategoriesList(
          session.phoneNumber,
          categoriesResponse.data.categories
        );
      }
    }
  } catch (error) {
    console.error("Error handling category selection:", error);
    throw error;
  }
};

// Step 3 to 4: Handle service selection
const handleServiceSelection = async (
  session: UserSession,
  message: string
): Promise<void> => {
  try {
    // Extract service ID from message (format: "service_123")
    const serviceIdMatch = message.match(/service_(\d+)/);
    if (serviceIdMatch && serviceIdMatch[1]) {
      const serviceId = parseInt(serviceIdMatch[1], 10);

      // Get service details
      if (session.selectedCategoryId) {
        const servicesResponse = await apiService.getServices(
          session.selectedCategoryId
        );
        if (servicesResponse.code === 200) {
          const selectedService = servicesResponse.data.salonServices.find(
            (service) => service.id === serviceId
          );
          if (selectedService) {
            session.selectedService = selectedService.servico;
            session.selectedServiceDescription = selectedService.descricao;
            session.selectedServiceDuration =
              selectedService.tempo || undefined;
            session.selectedServicePrice = selectedService.valor || undefined;
          }
        }
      }

      // Send date picker
      await whatsappService.sendDatePicker(session.phoneNumber);

      // Update session with selected service and move to next step
      session.selectedServiceId = serviceId;
      session.step = 4;
      await updateSession(session);
    } else {
      // Invalid service selection
      if (session.selectedCategoryId) {
        const servicesResponse = await apiService.getServices(
          session.selectedCategoryId
        );
        if (servicesResponse.code === 200) {
          await whatsappService.sendServicesList(
            session.phoneNumber,
            servicesResponse.data.salonServices
          );
        }
      }
    }
  } catch (error) {
    console.error("Error handling service selection:", error);
    throw error;
  }
};

// Step 4 to 5: Handle date selection
const handleDateSelection = async (
  session: UserSession,
  message: string
): Promise<void> => {
  try {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(message)) {
      // Save selected date
      session.selectedDate = message;

      // Fetch available hours
      if (session.selectedServiceId) {
        const availableHoursResponse = await apiService.getAvailableHours(
          session.selectedServiceId,
          message
        );
        if (
          availableHoursResponse.code === 200 &&
          availableHoursResponse.data.available.length > 0
        ) {
          // Send available hours list
          await whatsappService.sendAvailableHours(
            session.phoneNumber,
            availableHoursResponse.data.available
          );

          // Move to next step
          session.step = 5;
          await updateSession(session);
        } else {
          await whatsappService.sendText({
            recipientPhone: session.phoneNumber,
            message:
              "Não há horários disponíveis para esta data. Por favor, escolha outra data:",
          });
        }
      }
    } else {
      await whatsappService.sendText({
        recipientPhone: session.phoneNumber,
        message:
          "Por favor, forneça a data no formato YYYY-MM-DD (exemplo: 2025-05-01):",
      });
    }
  } catch (error) {
    console.error("Error handling date selection:", error);
    throw error;
  }
};

// Step 5 to 6: Handle hour selection
const handleHourSelection = async (
  session: UserSession,
  message: string
): Promise<void> => {
  try {
    // Extract hour from message (format: "hour_780")
    const hourMatch = message.match(/hour_(\d+)/);
    if (hourMatch && hourMatch[1]) {
      const hourSchedule = parseInt(hourMatch[1], 10);

      // Save selected hour
      session.selectedHour = hourSchedule;
      session.selectedHourFormatted = formatHour(hourSchedule);

      // Get available professionals for this hour
      if (session.selectedServiceId && session.selectedDate) {
        const availableHoursResponse = await apiService.getAvailableHours(
          session.selectedServiceId,
          session.selectedDate
        );

        if (availableHoursResponse.code === 200) {
          // Find the selected hour in available hours
          const selectedHourSlot = availableHoursResponse.data.available.find(
            (hour) => hour.schedule === hourSchedule
          );

          if (selectedHourSlot && selectedHourSlot.professionals.length > 0) {
            // Fetch information for each professional
            const professionals = [];
            for (const professionalId of selectedHourSlot.professionals) {
              if (session.selectedServiceId) {
                const professionalResponse =
                  await apiService.getProfessionalInfo(
                    session.selectedServiceId,
                    professionalId
                  );

                if (
                  professionalResponse.code === 200 &&
                  professionalResponse.data.professionals.length > 0
                ) {
                  professionals.push(
                    professionalResponse.data.professionals[0]
                  );
                }
              }
            }

            if (professionals.length > 0) {
              // Send professionals list
              await whatsappService.sendProfessionalsList(
                session.phoneNumber,
                professionals
              );

              // Move to next step
              session.step = 6;
              await updateSession(session);
            } else {
              throw new Error("No professionals found for the selected hour");
            }
          }
        }
      }
    } else {
      // Invalid hour selection
      if (session.selectedServiceId && session.selectedDate) {
        const availableHoursResponse = await apiService.getAvailableHours(
          session.selectedServiceId,
          session.selectedDate
        );

        if (availableHoursResponse.code === 200) {
          await whatsappService.sendAvailableHours(
            session.phoneNumber,
            availableHoursResponse.data.available
          );
        }
      }
    }
  } catch (error) {
    console.error("Error handling hour selection:", error);
    throw error;
  }
};

// Step 6 to 7: Handle professional selection
const handleProfessionalSelection = async (
  session: UserSession,
  message: string,
  buttonId?: string
): Promise<void> => {
  try {
    // Extract professional ID from button ID (format: "professional_123")
    const professionalIdMatch = buttonId
      ? buttonId.match(/professional_(\d+)/)
      : null;
    if (professionalIdMatch && professionalIdMatch[1]) {
      const professionalId = parseInt(professionalIdMatch[1], 10);

      // Save selected professional
      session.selectedProfessionalId = professionalId;

      // Get professional details
      if (session.selectedServiceId) {
        const professionalResponse = await apiService.getProfessionalInfo(
          session.selectedServiceId,
          professionalId
        );

        if (
          professionalResponse.code === 200 &&
          professionalResponse.data.professionals.length > 0
        ) {
          const professional = professionalResponse.data.professionals[0];
          session.selectedProfessional = professional.nome;
        }
      }

      // Send confirmation message
      if (
        session.selectedDate &&
        session.selectedHour &&
        session.selectedService &&
        session.selectedProfessional
      ) {
        await whatsappService.sendConfirmationMessage(
          session.phoneNumber,
          session.selectedDate,
          formatHour(session.selectedHour),
          session.selectedService,
          session.selectedProfessional
        );

        // Move to next step
        session.step = 7;
        await updateSession(session);
      } else {
        throw new Error("Missing information for confirmation");
      }
    }
  } catch (error) {
    console.error("Error handling professional selection:", error);
    throw error;
  }
};

// Step 7 to 8: Handle confirmation
const handleConfirmation = async (
  session: UserSession,
  buttonId?: string
): Promise<void> => {
  try {
    if (buttonId === "confirm") {
      // User confirmed the reservation
      if (
        session.selectedProfessionalId &&
        session.selectedServiceId &&
        session.selectedDate &&
        session.selectedHour
      ) {
        // Create reservation request
        const reservationData: ReservationRequest = {
          agendamentos: [
            {
              profissional_id: session.selectedProfessionalId,
              servico_id: session.selectedServiceId,
              salao_id: 101539,
              data: session.selectedDate,
              hora_ini: session.selectedHour,
              profissional_indiferente: 0,
              obs: "",
              pagamento_reserva: 0,
              email: 1,
              email_agendamento: 1,
            },
          ],
        };

        // Send reservation request
        const reservationResponse = await apiService.createReservation(
          reservationData
        );

        if (reservationResponse.code === 200) {
          // Reservation successful
          await whatsappService.sendSuccessMessage(session.phoneNumber);
        } else {
          // Reservation failed
          await whatsappService.sendFailureMessage(session.phoneNumber);
        }
      } else {
        // Missing information
        await whatsappService.sendFailureMessage(session.phoneNumber);
      }
    } else if (buttonId === "cancel") {
      // User canceled the reservation
      await whatsappService.sendText({
        recipientPhone: session.phoneNumber,
        message: "Agendamento cancelado. Obrigado pelo contato!",
      });
    }

    // Reset session to step 1
    session.step = 1;
    await updateSession(session);
  } catch (error) {
    console.error("Error handling confirmation:", error);
    await whatsappService.sendFailureMessage(session.phoneNumber);
  }
};

// Add new function to resend current step options
const resendCurrentStepOptions = async (
  session: UserSession
): Promise<void> => {
  try {
    switch (session.step) {
      case 2:
        // Resend categories list
        const categoriesResponse = await apiService.getCategories();
        if (categoriesResponse.code === 200) {
          await whatsappService.sendCategoriesList(
            session.phoneNumber,
            categoriesResponse.data.categories
          );
        }
        break;
      case 3:
        // Resend services list
        if (session.selectedCategoryId) {
          const servicesResponse = await apiService.getServices(
            session.selectedCategoryId
          );
          if (servicesResponse.code === 200) {
            await whatsappService.sendServicesList(
              session.phoneNumber,
              servicesResponse.data.salonServices
            );
          }
        }
        break;
      case 4:
        // Resend date picker
        await whatsappService.sendDatePicker(session.phoneNumber);
        break;
      case 5:
        // Resend available hours
        if (session.selectedServiceId && session.selectedDate) {
          const availableHoursResponse = await apiService.getAvailableHours(
            session.selectedServiceId,
            session.selectedDate
          );
          if (availableHoursResponse.code === 200) {
            await whatsappService.sendAvailableHours(
              session.phoneNumber,
              availableHoursResponse.data.available
            );
          }
        }
        break;
      case 6:
        // Resend professionals list
        if (
          session.selectedServiceId &&
          session.selectedDate &&
          session.selectedHour
        ) {
          const availableHoursResponse = await apiService.getAvailableHours(
            session.selectedServiceId,
            session.selectedDate
          );
          if (availableHoursResponse.code === 200) {
            const selectedHourSlot = availableHoursResponse.data.available.find(
              (hour) => hour.schedule === session.selectedHour
            );
            if (selectedHourSlot && selectedHourSlot.professionals.length > 0) {
              const professionals = [];
              for (const professionalId of selectedHourSlot.professionals) {
                const professionalResponse =
                  await apiService.getProfessionalInfo(
                    session.selectedServiceId,
                    professionalId
                  );
                if (
                  professionalResponse.code === 200 &&
                  professionalResponse.data.professionals.length > 0
                ) {
                  professionals.push(
                    professionalResponse.data.professionals[0]
                  );
                }
              }
              if (professionals.length > 0) {
                await whatsappService.sendProfessionalsList(
                  session.phoneNumber,
                  professionals
                );
              }
            }
          }
        }
        break;
      case 7:
        // Resend confirmation message
        if (
          session.selectedDate &&
          session.selectedHour &&
          session.selectedService &&
          session.selectedProfessional
        ) {
          await whatsappService.sendConfirmationMessage(
            session.phoneNumber,
            session.selectedDate,
            formatHour(session.selectedHour),
            session.selectedService,
            session.selectedProfessional
          );
        }
        break;
    }
  } catch (error) {
    console.error("Error resending current step options:", error);
    throw error;
  }
};
