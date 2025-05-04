# Barber Bot Chat

A WhatsApp chatbot for handling barber shop appointment scheduling. This bot integrates with a barber shop management system API to provide a seamless scheduling experience.

## Features

- Browse service categories
- Select services
- Choose appointment date and time
- Select available professionals
- Confirm and book appointments
- Integration with WhatsApp Cloud API

## Technical Details

- Built with Node.js and TypeScript
- Deployed as a Firebase Cloud Function
- Uses WhatsApp Cloud API for messaging
- Integrates with Avec Beauty API for appointment management

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Firebase CLI
- WhatsApp Business Account

### Environment Variables

You need to set up the following environment variables in Firebase:

```bash
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_WABA_ID=your-waba-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Avec Configurations
API_BASE_URL=avec-api-url
SALON_ID=avec-salon-id
API_AUTH_TOKEN=your-actual-token
SCHEDULE_URL=your-schedule-url

# General Configurations
INSTAGRAM_URL=your-instagram-url
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/barber-bot-chat.git
cd barber-bot-chat
```

2. Install dependencies

```bash
yarn i
```

3. Build the project

```bash
yarn build
```

### Local Development

1. Start the Firebase emulator

```bash
yarn serve
```

2. Test the function locally

```bash
yarn shell
```

### Deployment

1. Set up environment variables in Firebase Console:

   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Set up WhatsApp API credentials

2. Deploy to Firebase

```bash
yarn deploy
```

3. Set up the webhook in WhatsApp Business Manager:
   - Use the deployed function URL
   - Set the verify token to match your environment variable

## WhatsApp Webhook Setup

1. Set up a WhatsApp Business account
2. Configure the webhook URL to point to your Firebase function
3. Use the verify token you specified in the environment variables

## Structure

- `/src/types`: TypeScript interfaces and types
- `/src/services`: API and WhatsApp message services
- `/src/handlers`: Message handling logic
- `/src/index.ts`: Main entry point and webhook handling

## Flow

1. Welcome message with options
2. Browse categories
3. Select service
4. Choose date
5. Select available time
6. Choose professional
7. Confirm appointment
8. Booking confirmation

## License

This project is licensed under the MIT License
