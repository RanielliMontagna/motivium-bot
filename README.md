# Motivium Bot

<div align="center">

![Motivium Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/RanielliMontagna/motivium-bot/deploy.yml?style=for-the-badge&label=CI%2FCD)](https://github.com/RanielliMontagna/motivium-bot/actions)

A powerful Discord bot built with TypeScript and modern best practices, featuring automated currency updates and more.

[Features](#-features) •
[Getting Started](#-getting-started) •
[Development](#-development) •
[Deployment](#-deployment) •
[Acknowledgments](#-acknowledgments) 

</div>

## 🌟 Features

- ⚡ **Real-time Currency Updates**: Automated dollar exchange rate updates in configured channels
- 🪙 **Bitcoin Price Updates**: Automated Bitcoin price updates in configured channels
- 🔵 **Ethereum Price Updates**: Automated Ethereum price updates in configured channels
- 🟣 **Solana Price Updates**: Automated Solana price updates in configured channels
- 🏙️ **CEP Command**: Get information about a Brazil CEP code
- 🏋️ **BMI Calculator**: Calculate your Body Mass Index with ease
- 📰 **News Updates**: Get the latest news from various sources
   - 🗞️ **Investing.com - Economy**: Stay updated with the latest economic news
   - 🗞️ **The Verge - AI**:  Get the latest news on AI from The Verge
   - 🗞️ **The Verge - Space**: Stay updated with the latest space news from The Verge
   - 🗞️ **The Verge - Tech**: Stay updated with the latest tech news from The Verge
- 🔄 **Scheduled Messages**: Configurable message scheduling system
- 🛠️ **Modern Architecture**: Built with TypeScript and modern development practices
- 🚀 **CI/CD Pipeline**: Automated testing and deployment
- 🐳 **Docker Support**: Containerized for easy deployment
- 📊 **Logging System**: Comprehensive error tracking and monitoring

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm
- Discord Bot Token ([Create one here](https://discord.com/developers/applications))

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/RanielliMontagna/motivium-bot.git
   cd motivium-bot
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Discord bot token and other settings.

4. Start the bot:
   ```bash
   pnpm dev
   ```

## 💻 Development

### Available Scripts

- `pnpm dev` - Start the bot in development mode
- `pnpm build` - Build the bot for production
- `pnpm start` - Start the bot in production mode
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint
- `pnpm check` - Run TypeScript type checking

### Project Structure

```
src/
├── discord/           # Discord-specific functionality
│   ├── commands/      # Bot commands
│   ├── events/        # Event handlers
│   ├── messages/      # Message templates
│   └── schedulers/    # Scheduled tasks
├── services/          # External services integration
├── settings/          # Configuration and settings
```

## 🚢 Deployment

This project is configured to be deployed using Docker and GitHub Actions. The CI/CD pipeline will automatically build and deploy the bot to a Docker container on every push to the `main` branch.

To run the bot locally using Docker, you can use the following commands:

```bash
docker-compose up -d
```

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) for the amazing Discord API wrapper library used in this project
- [Constatic CLI](https://github.com/rinckodev/constatic) for the project base structure 

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
